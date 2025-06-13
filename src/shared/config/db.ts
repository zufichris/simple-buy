import postgres from "postgres";

export interface DatabaseConfig {
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
  prepare?: boolean;
  maxConnections?: number;
  connectTimeout?: number;
  ssl?: boolean;
  idleTimeout?: number;
  maxLifetime?: number;
  debug?: boolean;
  fetchTypes?: boolean;
}

export interface QueryResult<T = any> extends Array<T> {
  count: number;
  command: string;
  columns: T[]
  statement: postgres.Statement;
  state: postgres.State;
}

export interface TransactionCallback<T> {
  (sql: postgres.Sql): Promise<T> | T;
}

export interface MigrationFile {
  version: string;
  name: string;
  up: string;
  down?: string;
}

export interface HealthCheckResult {
  connected: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
}

export class Database {
  private pool: postgres.Sql<{}> | null = null;
  private connected: boolean = false;
  private connectionAttempts: number = 0;
  private lastHealthCheck: HealthCheckResult | null = null;
  private listeners: Map<string, Set<(payload: string) => void>> = new Map();
  private subscriptions: Map<string, postgres.SubscriptionHandle> = new Map();

  constructor(private readonly config: DatabaseConfig) {}

  private handleError(error: unknown, context: string = "Database operation"): never {
    let message = `${context} failed`;
    let errorCode = "UNKNOWN_ERROR";
    if (error instanceof postgres.PostgresError) {
      errorCode = error.code || "POSTGRES_ERROR";
      message = `${context} error: ${error.message}`;
      
      if (error.detail) message += `\nDetails: ${error.detail}`;
      if (error.hint) message += `\nHint: ${error.hint}`;
      if (error.position) message += `\nPosition: ${error.position}`;
      if (error.query) message += `\nQuery: ${error.query}`;
    } else if (error instanceof Error) {
      message = `${context}: ${error.message}`;
      errorCode = error.name || "ERROR";
    }

    const err = new Error(message);
    (err as any).code = errorCode;
    (err as any).originalError = error;
    
    console.error(`[Database] ${message}`, error);
    throw err;
  }

  async connect(dbName?: string, retries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        
        const pool = postgres({
          transform: {
            undefined: null,
          },
          debug: this.config.debug ? (connection, query, params) => {
            console.log(`[Database Debug] Connection: ${connection}, Query: ${query}, Params:`, params);
          } : false,
          onclose: (connId) => {
            console.log(`[Database] Connection ${connId} closed`);
          },
          onnotice: (notice) => {
            console.log(`[Database Notice] ${notice.message}`);
          },
          onparameter: (key, value) => {
            console.log(`[Database Parameter] ${key}: ${value}`);
          },
          ...this.config,
          database: dbName || this.config.dbName,
          max: this.config.maxConnections || 10,
          connect_timeout: this.config.connectTimeout || 30,
          idle_timeout: this.config.idleTimeout || 0,
          max_lifetime: this.config.maxLifetime || null,
          fetch_types: this.config.fetchTypes ?? true,
        });

        const testQuery = await pool`SELECT 1 AS test, NOW() AS timestamp`;
        if (!testQuery[0]) {
          throw new Error("Connection test failed - no result returned");
        }

        this.pool = pool;
        this.connected = true;
        this.connectionAttempts = 0;
        console.log(`[Database] Connected successfully to ${this.config.host}:${this.config.port}/${dbName || this.config.dbName}`);
        return;
        
      } catch (error: unknown) {
        this.pool = null;
        this.connected = false;
        
        if (attempt === retries) {
          this.handleError(error, `Database connection failed after ${retries} attempts`);
        }
        
        console.warn(`[Database] Connection attempt ${attempt}/${retries} failed, retrying...`);
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  getPool(): postgres.Sql<{}> {
    if (!this.isConnected()) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.pool!;
  }

  async query<T = any>(
    queryText: string, 
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const sql = this.getPool();
    try {
      if (params.length > 0) {
        return await sql.unsafe(queryText, params) as QueryResult<T>;
      }
      return await sql.unsafe(queryText) as QueryResult<T>;
    } catch (error) {
      this.handleError(error, "Query execution");
    }
  }

  async queryFile<T = any>(
    filepath: string, 
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const sql = this.getPool();
    try {
      return await sql.file(filepath, params) as QueryResult<T>;
    } catch (error) {
      this.handleError(error, `Query file execution: ${filepath}`);
    }
  }


  async transaction<T>(
    callback: TransactionCallback<T>,
    options:string
  ): Promise<T> {
    const sql = this.getPool();
    try {
      return await sql.begin(options, callback)as T
    } catch (error) {
      this.handleError(error, `Transaction execution`);
    }
  }

  async bulkInsert<T extends Record<string, any>>(
    table: string, 
    records: T[], 
    columns?: (keyof T)[],
    batchSize: number = 1000
  ): Promise<number> {
    if (!records.length) return 0;
    const sql = this.getPool();
    let totalInserted = 0;
    
    try {
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const cols = columns || Object.keys(records[0]) as (keyof T)[];
        const result = await sql`
          INSERT INTO ${sql(table)} ${sql(batch, cols as string[])}
        `;
        totalInserted += result.count;
      }
      return totalInserted;
    } catch (error) {
      this.handleError(error, `Bulk insert into ${table}`);
    }
  }

  async bulkUpdate<T extends Record<string, any>>(
    table: string,
    updates: Array<{ data: Partial<T>; where: Record<string, any> }>,
    batchSize: number = 500
  ): Promise<number> {
    if (!updates.length) return 0;
    
    const sql = this.getPool();
    let totalUpdated = 0;
    
    try {
      return await sql.begin(async (sql) => {
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          
          for (const { data, where } of batch) {
            const setClauses = Object.keys(data).map(key => 
              sql`${sql(key)} = ${data[key]}`
            );
            const whereClauses = Object.keys(where).map(key => 
              sql`${sql(key)} = ${where[key]}`
            );
            
            const result = await sql`
              UPDATE ${sql(table)} 
              SET ${sql.join(setClauses, ', ')}
              WHERE ${sql.join(whereClauses, ' AND ')}
            `;
            totalUpdated += result.count;
          }
        }
        return totalUpdated;
      });
    } catch (error) {
      this.handleError(error, `Bulk update in ${table}`);
    }
  }

  async upsert<T extends Record<string, any>>(
    table: string,
    records: T[],
    conflictColumns: string[],
    updateColumns?: string[]
  ): Promise<QueryResult<T>> {
    if (!records.length) return [] as any;
    
    const sql = this.getPool();
    const columns = Object.keys(records[0]);
    const updateCols = updateColumns || columns.filter(col => !conflictColumns.includes(col));
    
    try {
      return await sql`
        INSERT INTO ${sql(table)} ${sql(records, columns)}
        ON CONFLICT (${sql(conflictColumns)})
        DO UPDATE SET ${sql(
          updateCols.reduce((acc, col) => {
            acc[col] = sql`EXCLUDED.${sql(col)}`;
            return acc;
          }, {} as Record<string, any>)
        )}
        RETURNING *
      ` as QueryResult<T>;
    } catch (error) {
      this.handleError(error, `Upsert into ${table}`);
    }
  }

  async listen(
    channel: string, 
    callback: (payload: string) => void
  ): Promise<void> {
    const sql = this.getPool();
    
    try {
      if (!this.listeners.has(channel)) {
        this.listeners.set(channel, new Set());
      }
      
      this.listeners.get(channel)!.add(callback);
      
      await sql.listen(channel, callback);
      console.log(`[Database] Listening on channel: ${channel}`);
    } catch (error) {
      this.handleError(error, `Listen on channel ${channel}`);
    }
  }
  async notify(channel: string, payload?: string): Promise<void> {
    const sql = this.getPool();
    
    try {
      await sql.notify(channel, payload || '');
      console.log(`[Database] Notification sent to channel: ${channel}`);
    } catch (error) {
      this.handleError(error, `Notify channel ${channel}`);
    }
  }

  async unlisten(channel: string): Promise<void> {
    const sql = this.getPool();
    
    try {
      await sql`UNLISTEN ${sql(channel)}`;
      this.listeners.delete(channel);
      console.log(`[Database] Stopped listening on channel: ${channel}`);
    } catch (error) {
      this.handleError(error, `Unlisten channel ${channel}`);
    }
  }

  async subscribe(
    subscription: string,
    callback: (row: any, info: any) => void,
    onReady?: () => void
  ): Promise<() => void> {
    const sql = this.getPool();
    
    try {
      const { unsubscribe } = await sql.subscribe(subscription, callback, onReady);
      this.subscriptions.set(subscription, { unsubscribe } as any);
      console.log(`[Database] Subscribed to: ${subscription}`);
      return unsubscribe;
    } catch (error) {
      this.handleError(error, `Subscribe to ${subscription}`);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      if (!this.connected || !this.pool) {
        this.lastHealthCheck = {
          connected: false,
          error: "Not connected",
          timestamp: new Date()
        };
        return this.lastHealthCheck;
      }

      await this.pool`SELECT 1`;
      const latency = Date.now() - startTime;
      
      this.lastHealthCheck = {
        connected: true,
        latency,
        timestamp: new Date()
      };
      
      return this.lastHealthCheck;
    } catch (error) {
      this.lastHealthCheck = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      return this.lastHealthCheck;
    }
  }

  async getStats(): Promise<{
    activeConnections: number;
    totalConnections: number;
    databaseSize: string;
    uptime: string;
  }> {
    const sql = this.getPool();
    
    try {
      const [stats] = await sql`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
          (SELECT date_trunc('second', now() - pg_postmaster_start_time())) as uptime
      `;
      
      return {
        activeConnections: parseInt(stats.active_connections),
        totalConnections: parseInt(stats.total_connections),
        databaseSize: stats.database_size,
        uptime: stats.uptime
      };
    } catch (error) {
      this.handleError(error, "Get database statistics");
    }
  }
  async reserve(): Promise<postgres.ReservedSql> {
    const sql = this.getPool();
    
    try {
      return await sql.reserve();
    } catch (error) {
      this.handleError(error, "Reserve connection");
    }
  }
  async runMigrations(
    migrationsDir: string = './migrations',
    target?: string
  ): Promise<void> {
    const sql = this.getPool();
    
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `;

      const appliedMigrations = await sql`
        SELECT version FROM migrations ORDER BY version
      `;
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));

      const migrationFiles = this.loadMigrationFiles(migrationsDir);
      
      const pendingMigrations = migrationFiles.filter(
        migration => !appliedVersions.has(migration.version) &&
        (!target || migration.version <= target)
      );

      if (pendingMigrations.length === 0) {
        console.log('[Database] No pending migrations');
        return;
      }

      await sql.begin(async (sql) => {
        for (const migration of pendingMigrations) {
          console.log(`[Database] Applying migration: ${migration.version} - ${migration.name}`);
          
          await sql.unsafe(migration.up);
          await sql`
            INSERT INTO migrations (version, name) 
            VALUES (${migration.version}, ${migration.name})
          `;
          
          console.log(`[Database] Applied migration: ${migration.version}`);
        }
      });

      console.log(`[Database] Applied ${pendingMigrations.length} migrations`);
    } catch (error) {
      this.handleError(error, "Run migrations");
    }
  }

  async rollbackMigrations(
    migrationsDir: string = './migrations',
    target?: string
  ): Promise<void> {
    const sql = this.getPool();
    
    try {
      const appliedMigrations = await sql`
        SELECT version, name FROM migrations 
        ORDER BY version DESC
      `;

      const migrationFiles = this.loadMigrationFiles(migrationsDir);
      const migrationMap = new Map(
        migrationFiles.map(m => [m.version, m])
      );

      const migrationsToRollback = appliedMigrations.filter(
        m => !target || m.version > target
      );

      if (migrationsToRollback.length === 0) {
        console.log('[Database] No migrations to rollback');
        return;
      }

      await sql.begin(async (sql) => {
        for (const migration of migrationsToRollback) {
          const migrationFile = migrationMap.get(migration.version);
          
          if (!migrationFile?.down) {
            throw new Error(`No rollback script for migration: ${migration.version}`);
          }

          console.log(`[Database] Rolling back migration: ${migration.version} - ${migration.name}`);
          
          await sql.unsafe(migrationFile.down);
          await sql`DELETE FROM migrations WHERE version = ${migration.version}`;
          
          console.log(`[Database] Rolled back migration: ${migration.version}`);
        }
      });

      console.log(`[Database] Rolled back ${migrationsToRollback.length} migrations`);
    } catch (error) {
      this.handleError(error, "Rollback migrations");
    }
  }

  async seed(env: string = 'development'): Promise<void> {
    if (env === 'production') {
      console.warn('[Database] Skipping seed in production environment');
      return;
    }

    const sql = this.getPool();
    
    try {
      const seedFile = `./seeds/${env}.sql`;
      console.log(`[Database] Running seed for environment: ${env}`);
      await sql.file(seedFile);
      console.log('[Database] Seed completed successfully');
    } catch (error) {
      console.warn(`[Database] Seed file not found or failed: ${error}`);
    }
  }

  async close(timeout: number = 30): Promise<void> {
    try {
      if (this.pool && this.connected) {
        for (const [subscription, handle] of this.subscriptions) {
          try {
            (handle as any).unsubscribe();
            console.log(`[Database] Unsubscribed from: ${subscription}`);
          } catch (err) {
            console.warn(`[Database] Failed to unsubscribe from ${subscription}:`, err);
          }
        }
        this.subscriptions.clear();

        await this.pool.end({ timeout });
        console.log('[Database] Connections closed successfully');
      }
    } catch (error) {
      this.handleError(error, "Close connections");
    } finally {
      this.pool = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  isConnected(): boolean {
    return !!(this.pool && this.connected);
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  getConnectionAttempts(): number {
    return this.connectionAttempts;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadMigrationFiles(migrationsDir: string): MigrationFile[] {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const files = fs.readdirSync(migrationsDir)
        .filter((file: string) => file.endsWith('.sql'))
        .sort();

      return files.map((file: string) => {
        const filePath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const [version, ...nameParts] = file.replace('.sql', '').split('_');
        
        // Support for up/down migrations in single file
        const sections = content.split('-- DOWN');
        const up = sections[0].replace('-- UP', '').trim();
        const down = sections[1]?.trim();

        return {
          version,
          name: nameParts.join('_'),
          up,
          down
        };
      });
    } catch (error) {
      console.warn(`[Database] Could not load migration files from ${migrationsDir}:`, error);
      return [];
    }
  }
}
