import { sql } from "./src/db";

async function getCommand() {
  try {
    const text = await Bun.stdin.text();
    console.log(text, "ss");
    return text.trim();
  } catch (err) {
    console.log("Error getting command", err);
    process.exit(1);
  }
}

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

async function main() {
  const cmd = Bun.argv[2];
  if (cmd === "--migrate") {
    await runMigrations();
  } else {
    console.log("Unknown command:", cmd || "");
  }
  process.exit(0);
}

main();
