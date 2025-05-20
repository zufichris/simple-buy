import swagger from "@elysiajs/swagger";
import { Elysia, t, ValidationError } from "elysia";

const router = new Elysia();

router
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
  .get("/", () => "Welcome To Superbuy API", {
    detail: {
      summary: "Welcome Message",
      tags: ["Wellcome"],
      description: "Returns a welcome Message",
    },
  })
  .group("/auth", (authRoutes) =>
    authRoutes
      .post("/login", ({ body }) => body, {
        body: t.Object({
          email: t.String({
            error: "Invalid Email",
            format: "email",
          }),
          password: t.String({
            error: "Invalid Password",
          }),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "Login",
          description: "Allows Users To Login",
        },
      })
      .post("/register", ({ body }) => body, {
        body: t.Object({
          username: t.String({ minLength: 5 }),
          email: t.String({ format: "email" }),
          password: t.String(),
          phone: t.String(),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "Register Users",
          description: "Allows new users to register",
        },
      })
      .post(
        "/forget-password",
        () => ({
          message: "This is Login Router",
        }),
        {
          detail: {
            tags: ["Authentication"],
            summary: "Reset Password",
            description: "Allows users to reset their passwords",
          },
        },
      ),
  )
  .onError(({ error }) => {
    console.log("An Error  occurred", error);
  });
export default router;
