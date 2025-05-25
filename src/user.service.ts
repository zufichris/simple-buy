import { sql } from "./db";
import { User } from "./types";

export class UserService {
  async create(user: User): Promise<User> {
    try {
      await sql`
        INSERT INTO users (email, name, password, phone)
        VALUES (${user.email}, ${user.name}, ${user.password}, ${user.phone || null})
      `;
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user. Please try again later.");
    }
  }

  async list(): Promise<User[]> {
    try {
      const result = await sql`SELECT * FROM users`;
      return result.map((r: any) => r as User);
    } catch (error) {
      console.error("Error listing users:", error);
      throw new Error("Failed to fetch users. Please try again later.");
    }
  }

  async get(id: number): Promise<User> {
    try {
      const result = await sql`SELECT * FROM users WHERE id=${id}`;
      if (!result[0]) {
        throw new Error("User not found");
      }
      return result[0] as User;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw new Error("Failed to fetch user. Please try again later.");
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM users WHERE id=${id} RETURNING id`;
      if (!result[0]) {
        throw new Error("User not found or already deleted");
      }
      return true;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw new Error("Failed to delete user. Please try again later.");
    }
  }

  async update(id: number, newUser: Partial<Omit<User, "id">>): Promise<User> {
    const fields = Object.entries(newUser);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }
    try {
      const setClause = fields
        .map(([key], idx) => `${key} = $${idx + 1}`)
        .join(", ");
      const values = fields.map(([, value]) => value);

      values.push(id.toString());

      await sql.unsafe(
        `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1}`,
        values,
      );

      const updated = await sql`SELECT * FROM users WHERE id=${id}`;
      if (!updated[0]) {
        throw new Error("User not found after update");
      }
      return updated[0] as User;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw new Error("Failed to update user. Please try again later.");
    }
  }
}
