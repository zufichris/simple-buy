import { App } from "./shared/app";
import { getEnvVar } from "./shared/config/env";

const app = new App({
  port: Number(getEnvVar("PORT")),
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5000",
    ],
    credentials: true,
  },
  swagger: {
    enabled: true,
    path: "/docs",
  },
  logging: {
    enabled: true,
    level: "debug",
  },

  db: {
    dbName: getEnvVar("DB_NAME"),
    host: getEnvVar("DB_HOST"),
    password: getEnvVar("DB_PASS"),
    port: Number(getEnvVar("DB_PORT")),
    username: getEnvVar("DB_USER"),
    prepare: getEnvVar("ENV").includes("prod"),
    connectTimeout: 10,
    maxConnections: 20,
    ssl: false,
  },
});

app.start();
