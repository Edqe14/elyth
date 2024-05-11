import { App } from "@/app";

export const app = new App();
await app.init();

if (!process.env.CI) {
  app.listen((await app.configurations.get("app.port")) || 3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
