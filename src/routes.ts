import swagger from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { UserService } from "./user.service";

const router = new Elysia();

router
  .use(
    swagger({
      documentation: {
        info: {
          title: "Super Buy Documentation",
          version: "1.0",
          description:
            "A simple e-commerce application to demonstrate popular API infrastructures",
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
      description: "Returns a welcome Message",
    },
  })

  // USER ROUTES GROUP
  .group("/users", (users) => {
    const userService = new UserService();
    return users
      .get("/", () => userService.list(), {
        detail: {
          tags: ["Users"],
          summary: "Get All Users",
          description: "Retrieve a list of all registered users.",
          responses: {
            200: {
              description: "A list of user objects.",
            },
          },
        },
      })
      .get("/:id", ({ params }) => userService.get(params.id), {
        params: t.Object({
          id: t.Numeric(),
        }),
        detail: {
          tags: ["Users"],
          summary: "Get User By ID",
          description: "Retrieve a user by their unique ID.",
        },
      })
      .patch(
        "/:id",
        ({ params, body }) => userService.update(params.id, body),
        {
          params: t.Object({
            id: t.Numeric(),
          }),
          body: t.Partial(
            t.Object({
              name: t.String(),
              email: t.String({ format: "email" }),
              phone: t.String(),
            }),
          ),
          detail: {
            tags: ["Users"],
            summary: "Update User",
            description: "Update a user's information.",
          },
        },
      )
      .delete(
        "/:id",
        ({ params }) => ({ deleted: userService.delete(params.id), ...params }),
        {
          params: t.Object({
            id: t.Numeric(),
          }),
          detail: {
            tags: ["Users"],
            summary: "Delete User",
            description: "Remove a user by their unique ID.",
          },
        },
      );
  })

  // PRODUCT ROUTES GROUP
  .group("/products", (products) =>
    products
      .get("/", () => [], {
        detail: {
          tags: ["Products"],
          summary: "Get All Products",
          description: "Retrieve a list of all available products.",
        },
      })
      .get("/:id", ({ params }) => params, {
        params: t.Object({
          id: t.Numeric(),
        }),
        detail: {
          tags: ["Products"],
          summary: "Get Product By ID",
          description: "Retrieve a product by its unique ID.",
        },
      })
      .post("/", ({ body }) => body, {
        body: t.Object({
          name: t.String(),
          description: t.String(),
          price: t.Number(),
          stock: t.Number(),
        }),
        detail: {
          tags: ["Products"],
          summary: "Create Product",
          description: "Create a new product.",
        },
      })
      .put("/:id", ({ params, body }) => ({ ...params, ...body }), {
        params: t.Object({
          id: t.Numeric(),
        }),
        body: t.Partial(
          t.Object({
            name: t.String(),
            description: t.String(),
            price: t.Number(),
            stock: t.Number(),
          }),
        ),
        detail: {
          tags: ["Products"],
          summary: "Update Product",
          description: "Update product details by ID.",
        },
      })
      .delete("/:id", ({ params }) => ({ deleted: true, ...params }), {
        params: t.Object({
          id: t.Numeric(),
        }),
        detail: {
          tags: ["Products"],
          summary: "Delete Product",
          description: "Remove a product by its unique ID.",
        },
      }),
  )

  .onError(({ error }) => {
    console.log("An error occurred", error);
  });

export default router;
