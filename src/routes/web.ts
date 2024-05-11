import { app } from "@/index";

export default app
  .createRouter()
  .get("/", () => "hi route!")
  .get("/test", () => "test route!")
  .get("/test/:id", (ctx) => `test route with id: ${ctx.params.id}`);
