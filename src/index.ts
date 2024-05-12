import { App } from "@/app";

export const app = new App();
export const config = app.configurations;
await app.init();

if (!process.env.CI) {
  app.listen((await app.configurations.get("app.port")) || 3000);
  app.logger.info(
    `Server is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
