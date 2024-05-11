import type { ContextForRoute } from "@/app";
import { Controller } from "./controller";

export class TestController extends Controller {
  public async index(ctx: ContextForRoute<"/api">) {
    return ctx.redirect("/api/users/:id", { id: "1" });
  }

  public todos(ctx: ContextForRoute) {
    return ctx.status(400).json("todos");
  }

  public async users(ctx: ContextForRoute<"/api/users/:id">) {
    const user = await fetch(
      `https://jsonplaceholder.typicode.com/users/${ctx.params.id}`
    );

    if (user.status !== 200) {
      return ctx.status(404).json({ message: user.statusText });
    }

    return user.json();
  }
}
