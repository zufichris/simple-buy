import Elysia, { t } from "elysia";
import { UserService } from "./user.service";
import { CreateUserSchema, UpdateUserSchema } from "./user.dtos";

export class UserControllers {
  constructor(private readonly service: UserService) { }

  public routes() {
    return new Elysia()
.post("/", ({body}) => this.service.createUser(body), {
        body:CreateUserSchema,
        detail: {
          tags: ["Users"],
          summary: "New User",
          description: "Creates a new User",
        },
      })

      .get("/", () => this.service.getAllUsers(), {
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
      .get("/:id", ({ params }) => this.service.getUserById(params.id), {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["Users"],
          summary: "Get User By ID",
          description: "Retrieve a user by their unique ID.",
        },
      })
      .patch(
        "/:id",
        ({ params, body }) => this.service.updateUser(params.id, body),
        {
          params: t.Object({
            id: t.String(),
          }),
          body:UpdateUserSchema,
          detail: {
            tags: ["Users"],
            summary: "Update User",
            description: "Update a user's information.",
          },
        },
      )
      .delete(
        "/:id",
        ({ params }) => ({
          deleted: this.service.deleteUser(params.id),
          ...params,
        }),
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Users"],
            summary: "Delete User",
            description: "Remove a user by their unique ID.",
          },
        },
      );
  }
}
