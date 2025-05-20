import psql from "postgres";
export const sql = psql({
  hostname: "localhost",
  host: "localhost",
  port: 5432,
  database: "simple_buy",
  username: "zufi",
  password: "68205",
  user: "zufi",
});
