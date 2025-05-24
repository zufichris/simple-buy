import { sql } from "./src/db";
import { Product, User } from "./src/types";

async function runMigrations() {
  try {
    const migrationsPath = "src/migrations.sql";
    const file = Bun.file(migrationsPath);
    const text = await file.text();
    const statements = text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const s of statements) {
      await sql.unsafe(s);
      console.log("Executed:", s.slice(0, 60) + (s.length > 60 ? "..." : ""));
    }
    console.log("Migrations completed!");
  } catch (err) {
    console.log("Error running migrations:", err);
    process.exit(1);
  }
}

async function runSeed() {
  const users: User[] = [
    {
      id: 1,
      email: "johndoe@gmail.com",
      name: "John Doe",
      isActive: true,
      password: "John@1234",
      phone: "+1330904-04-04",
    },
    {
      id: 2,
      email: "janedoe@gmail.com",
      name: "Jane Doe",
      isActive: true,
      password: "Jane@1234",
      phone: "+23930930332",
    },
  ];

  const products = [
    {
      id: 1,
      title: "Mechanical Keyboard",
      description:
        "A tactile, backlit mechanical keyboard for productivity and gaming.",
      price: 79.99,
      category: "Electronics",
      image:
        "https://imgs.search.brave.com/qYYKwG9Zd7l2EBV9gvmg8MKROB_n1L75915DRWE4Cz8/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWdz/LnNlYXJjaC5icmF2/ZS5jb20vOXJWQVBw/ZlpmaE53OXUwemZB/dzdsdG1HVzlhSHBq/Vzh6TW4wajJwNEFC/dy9yczpmaXQ6NTAw/OjA6MDowL2c6Y2Uv/YUhSMGNITTZMeTl5/WldSeS9ZV2R2Ym5O/b2IzQXVZMjl0L0wy/TmtiaTl6YUc5d0wy/WnAvYkdWekwxSmxa/SEpoWjI5dS9Telkx/TmxCU1R6TXRUVzlr/L1pURXdNRXRsZVhO/WGFYSmwvYkdWemMx/SkhRa2RoYldsdS9a/MHRsZVdKdllYSmtY/ekV1L2NHNW5QM1k5/TVRjME5qYzMvTnpF/eU5DWjNhV1IwYUQw/MS9Nek0.jpeg",
      amount_in_stock: 20,
      amount_sold: 3,
    },
    {
      id: 2,
      title: "Wireless Mouse",
      description: "Ergonomic wireless mouse with long battery life.",
      price: 29.99,
      category: "Electronics",
      image:
        "https://imgs.search.brave.com/jPudn62p5E70iP0piPqTqE1myiDzkUnGawgtOlihfO0/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWdz/LnNlYXJjaC5icmF2/ZS5jb20vX3dJLXNu/ZDBNVXVxQ0ZYRVBx/ckQzNklTWUhrek05/bHRLdUo2MllDZTJk/ay9yczpmaXQ6NTAw/OjA6MDowL2c6Y2Uv/YUhSMGNITTZMeTl0/TG0xbC9aR2xoTFdG/dFlYcHZiaTVqL2Iy/MHZhVzFoWjJWekww/a3YvTlRGa2MzVjFi/WG8yU0V3dS9hbkJu.jpeg",
      amountInStock: 50,
      amountSold: 8,
    },
  ];

  await sql`DELETE FROM users`;
  await sql`DELETE FROM products`;

  await Promise.all(
    products.map((product) =>
      sql`
        INSERT INTO products
        (id, title, description, price, category, image, amountInStock, amountSold)
        VALUES (
          ${product.id}, ${product.title}, ${product.description}, ${product.price},
          ${product.category}, ${product.image}, ${product.amountInStock}, ${product.amountSold}
        )
      `.then(() => console.log("Added Product", product)),
    ),
  );

  await Promise.all(
    users.map((user) =>
      sql`
        INSERT INTO users
        (id, name, email, password, phone, isActive)
        VALUES (
          ${user.id}, ${user.name}, ${user.email}, ${user.password}, ${user.phone ?? null}, ${user.isActive}
        )
      `.then(() => console.log("Added User", user)),
    ),
  );

  console.log("Seeding complete");
}

async function main() {
  const cmd = Bun.argv[2];

  switch (cmd) {
    case "--migrate":
      await runMigrations();
      break;
    case "--seed":
      await runSeed();
      break;
    default:
      console.log("Invalid Command", cmd);
      process.exit(1);
  }
  process.exit(0);
}

main();
