import { App } from "@/app";

export const app = new App();
await app.init();

if (!process.env.CLI) {
  app.listen((await app.providers.config.get("app.port")) || 3000);
  app.providers.logger.info(
    `Server is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}
