import type { App } from "@/app";
import { Command } from "@console/command";
import { createServer } from "vite";

export default class Serve extends Command {
  public signature = "serve";
  public description = "List all available routes";

  public async handle() {
    delete process.env.CI;

    const { app } = await import("@/index");

    await this.startVite(app);
  }

  public async startVite(app: App) {
    if (app.configurations.get("app.environment") === "production") return;

    const server = await createServer({
      root: process.cwd(),
    });

    await server.listen();

    this.logger.info(
      `Vite server started on http://localhost:${server.config.server.port}`
    );
  }
}
