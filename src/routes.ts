import swagger from "@elysiajs/swagger";
import { Elysia, t } from "elysia";

const router = new Elysia();

router
  .use(
    swagger({
      documentation: {
        info: {
          title: "Super Buy Documentation",
          version: "1.0",
          description: "A simple e-commerce application API documentation",
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
      tags: ["Welcome"],
      description: "Returns a welcome message",
    },
  })
  // Auth Group (already present)
  .group("/auth", (authRoutes) =>
    authRoutes
      .post("/login", ({ body }) => body, {
        body: t.Object({
          email: t.String({ error: "Invalid Email", format: "email" }),
          password: t.String({ error: "Invalid Password" }),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "Login",
          description: "Allows users to log in",
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

  // USERS GROUP
  .group("/users", (userRoutes) =>
    userRoutes
      .get("/", () => [], {
        detail: {
          tags: ["Users"],
          summary: "List Users",
          description: "Retrieve a list of all users",
        },
      })
      .get("/:id", ({ params }) => params.id, {
        params: t.Object({ id: t.Numeric() }),
        detail: {
          tags: ["Users"],
          summary: "Get User By ID",
          description: "Retrieve a specific user by their ID",
        },
      })
      .post("/", ({ body }) => body, {
        body: t.Object({
          name: t.String(),
          email: t.String({ format: "email" }),
          password: t.String(),
          phone: t.String(),
        }),
        detail: {
          tags: ["Users"],
          summary: "Create User",
          description: "Add a new user to the database",
        },
      })
      .put("/:id", ({ params, body }) => ({ ...body, id: params.id }), {
        params: t.Object({ id: t.Numeric() }),
        body: t.Object({
          name: t.String(),
          email: t.String({ format: "email" }),
          password: t.String(),
          phone: t.String(),
        }),
        detail: {
          tags: ["Users"],
          summary: "Update User",
          description: "Update user details by ID",
        },
      })
      .delete("/:id", ({ params }) => params.id, {
        params: t.Object({ id: t.Numeric() }),
        detail: {
          tags: ["Users"],
          summary: "Delete User",
          description: "Delete a user by their ID",
        },
      }),
  )

  // PRODUCTS GROUP
  .group("/products", (productRoutes) =>
    productRoutes
      .get("/", () => [], {
        detail: {
          tags: ["Products"],
          summary: "List Products",
          description: "Retrieve a list of all products",
        },
      })
      .get("/:id", ({ params }) => params.id, {
        params: t.Object({ id: t.Numeric() }),
        detail: {
          tags: ["Products"],
          summary: "Get Product By ID",
          description: "Retrieve a specific product by its ID",
        },
      })
      .post("/", ({ body }) => body, {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          price: t.Numeric(),
          category: t.String(),
          image: t.String(),
          amountInStock: t.Numeric(),
          amountSold: t.Numeric(),
        }),
        detail: {
          tags: ["Products"],
          summary: "Create Product",
          description: "Add a new product to the database",
        },
      })
      .put("/:id", ({ params, body }) => ({ ...body, id: params.id }), {
        params: t.Object({ id: t.Numeric() }),
        body: t.Object({
          title: t.String(),
          description: t.String(),
          price: t.Numeric(),
          category: t.String(),
          image: t.String(),
          amountInStock: t.Numeric(),
          amountSold: t.Numeric(),
        }),
        detail: {
          tags: ["Products"],
          summary: "Update Product",
          description: "Update product details by ID",
        },
      })
      .delete("/:id", ({ params }) => params.id, {
        params: t.Object({ id: t.Numeric() }),
        detail: {
          tags: ["Products"],
          summary: "Delete Product",
          description: "Delete a product by its ID",
        },
      }),
  )
  .onError(({ error }) => {
    console.log("An Error occurred", error);
  });

export default router;
