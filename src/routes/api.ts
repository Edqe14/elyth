import { TestController } from "@controllers/testController";
import { app } from "@/index";
import { TestMiddleware } from "@/app/http/middlewares/testMiddleware";

export default app
  .createRouter("/api")
  .get("/", [TestController, "index"])
  .get("/users/:id", [TestController, "users"])
  .group("/todos", (group) =>
    group.middleware(TestMiddleware).get("/", [TestController, "todos"])
  )
  .post("/todos", [TestController, "todos"])
  .resource("albums", TestController);
