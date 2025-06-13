import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { UserModule } from "../modules/user";
import { UserControllers } from "../modules/user/user.controllers";
import { UserService } from "../modules/user/user.service";
import { UserRepository } from "../modules/user/user.repository";
import { Database, DatabaseConfig } from "./config/db";

interface AppConfig {
  port?: number;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
  swagger?: {
    enabled?: boolean;
    path?: string;
  };
  logging?: {
    enabled?: boolean;
    level?: "info" | "warn" | "error" | "debug";
  };
  db: DatabaseConfig;
}

export class App {
  public readonly app: Elysia;
  private readonly db: Database;

  private userRepository?: UserRepository;
  private userService?: UserService;
  private userControllers?: UserControllers;
  private userModule?: UserModule;

  constructor(private readonly config: AppConfig) {
    this.app = new Elysia({ name: "SuperBuy API" });
    this.db = new Database(this.config.db);
    this.setupPlugins();
    this.setupMiddlewares();
    this.setupDependencies();
    this.registerModules();
    this.setupErrorHandling();
  }

  private setupPlugins(): void {
    if (this.config.cors) {
      this.app.use(
        cors({
          origin: this.config.cors.origin,
          credentials: this.config.cors.credentials,
        }),
      );
    }

    if (this.config.swagger?.enabled) {
      this.app.use(
        swagger({
          path: this.config.swagger.path || "/docs",
          documentation: {
            info: {
              title: "SuperBuy API",
              version: "1.0.0",
              description: "API documentation for SuperBuy application",
            },
            tags: [{ name: "Users", description: "User management endpoints" }],
          },
        }),
      );
    }
  }

  private setupMiddlewares(): void {
    if (this.config.logging?.enabled) {
      this.app.onRequest(function({ request, server }) {
        const timestamp = new Date().toISOString();
        const ip = server?.requestIP(request)?.address || "unknown";
        console.log(
          `[${timestamp}] ${request.method} ${request.url} - IP: ${ip}`,
        );
      });

      this.app.onAfterHandle(function({ request, set, server }) {
        const timestamp = new Date().toISOString();
        const ip = server?.requestIP(request)?.address || "unknown";
        const status = set.status || 200;
        console.log(`[${timestamp}] ${request.method} ${status} - IP: ${ip}`);
      });
    }

    this.app.derive(function() {
      const startTime = Date.now();
      return {
        startTime,
        getExecutionTime: () => Date.now() - startTime,
      };
    });
  }

  private setupDependencies(): void {
    try {
      this.userRepository = new UserRepository(this.db);
      this.userService = new UserService(this.userRepository);
      this.userControllers = new UserControllers(this.userService);
    } catch (error) {
      console.error("Failed to setup dependencies:", error);
      throw new Error("Dependency injection failed");
    }
  }

  private registerModules(): void {
    try {
      this.app.get("/health", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }));

      this.app.group("/api/v1", (api) => {
        this.userModule = new UserModule(api as any, this.userControllers!);
        return api;
      });
    } catch (error) {
      console.error("Failed to register modules:", error);
      throw new Error("Module registration failed");
    }
  }

  private setupErrorHandling(): void {
    this.app.onError(({ error, set, code }) => {
      console.error("Application Error:", {
        code,
        message: error,
        stack: error,
        timestamp: new Date().toISOString(),
      });

      switch (code) {
        case "NOT_FOUND":
          set.status = 404;
          return { error: "Resource not found" };
        case "VALIDATION":
          set.status = 400;
          return { error: "Validation failed", details: error.message };
        case "INTERNAL_SERVER_ERROR":
          set.status = 500;
          return { error: "Internal server error" };
        default:
          set.status = 500;
          return { error: "An unexpected error occurred" };
      }
    });
  }

  public async start(port?: number): Promise<void> {
    const serverPort = port || this.config.port || 5000;

    try {
      this.setupGracefulShutdown();
      if (!this.db.isConnected()) {
        await this.db.connect();
      }

      this.app.listen(serverPort);
      console.log(`SuperBuy is running at http://localhost:${serverPort}`);

      if (this.config.swagger?.enabled) {
        console.log(
          `API Docs available at http://localhost:${serverPort}${this.config.swagger.path}`,
        );
      }

      console.log(
        `Health check available at http://localhost:${serverPort}/health`,
      );
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  async setupGracefulShutdown(): Promise<void> {
    async function shutdown(signal: string, db: Database) {
      await db.close();
      console.log(`${signal} Sinal\n`, "Gracefully Shutting Down");
      process.exit(0);
    }
    process.on("SIGTERM", () => shutdown("SIGTERM", this.db));
    process.on("SIGINT", () => shutdown("SIGINT", this.db));
  }

  public getApp(): Elysia {
    return this.app;
  }

  public use(plugin: any): this {
    this.app.use(plugin);
    return this;
  }
}
