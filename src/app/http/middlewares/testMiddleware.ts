import { ContextForRoute } from "@/app";
import { Middleware } from "@/app/middleware";

export class TestMiddleware extends Middleware {
  public handle(ctx: ContextForRoute) {
    console.log("Test middleware");

    if (!ctx.headers.authorization) {
      ctx.status(401);

      return { message: "Unauthorized" };
    }
  }
}
