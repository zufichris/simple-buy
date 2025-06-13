import Elysia from "elysia";
import { UserControllers } from "./user.controllers";

export class UserModule {
  constructor(private readonly app: Elysia, private readonly controllers: UserControllers) {
    this.app.group(
      "/users",
      (group) => group.use(this.controllers.routes()))
  }
}
