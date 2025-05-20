import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import router from "./routes";

const app = new Elysia()
  .onAfterHandle(({ server, request, set, response, store, status }) => {
    console.log(
      `${request.method}/ ${set.status} IP:${server?.requestIP(request)?.address}`,
    );
  })
  .use(
    swagger({
      documentation: {
        info: {
          title: "Super Buy Documentation",
          version: "1.0",
          description:
            "A simple e-comerce application to demonstrate popular  API infrastructures",
          license: {
            name: "MIT",
          },
        },
      },
    }),
  )
  .get("/", async () => {
    return {
      message: "Hello World",
    };
  })
  .use(router)
  .listen(3000);

console.log(
  `Super Buy is running at ${app.server?.hostname}:${app.server?.port}`,
);
