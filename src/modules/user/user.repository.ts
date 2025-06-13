import type postgres from 'postgres';
import type { IBaseRepository } from '../../shared/types';
import type { CreateUserDTO, UpdateUserDTO } from './user.dtos';
import { User } from './user.types';
import { Database } from '../../shared/config/db';

export interface IUserRepository
  extends IBaseRepository<User, CreateUserDTO, UpdateUserDTO> {
  findByEmail(email: string): Promise<User | null>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db:Database) {}
  private mapRowToUser(row: postgres.Row): User {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      role: row.role,
      status: row.status,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      addresses:[]
    };
  }

  async create(createDto: CreateUserDTO & { passwordHash: string }): Promise<User> {
    const { firstName, lastName, email, passwordHash } = createDto;
    const result = await this.db.getPool()<User[]>`
      INSERT INTO users (first_name, last_name, email, password_hash, role, status)
      VALUES (${firstName}, ${lastName}, ${email}, ${passwordHash}, 'CUSTOMER', 'ACTIVE')
      RETURNING *
    `;

    return this.mapRowToUser(result[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.getPool()<User[]>`
      SELECT * FROM users WHERE id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToUser(result[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.getPool()<User[]>`
      SELECT * FROM users WHERE email = ${email}
    `;
    if (result.length === 0) {
      return null;
    }
    return this.mapRowToUser(result[0]);
  }

  async findOneBy(criteria: Partial<User>): Promise<User | null> {
    if (criteria.email) {
      return this.findByEmail(criteria.email);
    }
    //TODO Find one
    return null;
  }


  async list(): Promise<User[]> {
    const result = await this.db.getPool()<User[]>`
      SELECT * FROM users ORDER by email
    `;
    return result.map(this.mapRowToUser);
  }

  async update(id:string,updateDto:UpdateUserDTO): Promise<User|null> {
    const fields = Object.entries(updateDto);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }
  const setClause = fields
        .map(([key], idx) => `${key} = $${idx + 1}`)
        .join(", ");
      const values = fields.map(([, value]) => value);

      values.push(id.toString());

      await this.db.getPool().unsafe(
        `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1}`,
        values as any
      );

      const updated = await this.db.getPool()`SELECT * FROM users WHERE id=${id}`;
      if (!updated[0]) {
        throw new Error("User not found after update");
      }
      return this.mapRowToUser(updated[0]);

  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.getPool()`
      DELETE FROM users WHERE id = ${id}
    `;
    return result.count > 0;
  }
}
