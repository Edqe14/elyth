import { app } from "@/index";
import Welcome from "@/resources/views/welcome";

export default app
  .createRouter()
  .get("/", (ctx) => ctx.render(Welcome, { name: "Elysia" }));
