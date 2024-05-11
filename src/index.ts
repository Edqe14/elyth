import { App } from "@/app";

export const app = new App();
await app.init();
app.listen((await app.configurations.get("app.port")) || 3000);

// TODO: remove
console.log(app.getRoutes());

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
