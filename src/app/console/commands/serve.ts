import providers from "@/app/providers";
import { Command } from "@console/command";
import { createServer } from "vite";

export default class Serve extends Command {
  public signature = "serve";
  public description = "List all available routes";

  public async handle() {
    if (this.program.isProduction) {
      process.env.NODE_ENV = "production";
    }

    await import("@/index");
    await this.startVite();
  }

  public async startVite() {
    if (providers.config.get("app.environment") === "production") return;

    const server = await createServer({
      root: process.cwd(),
    });

    await server.listen();

    this.logger.info(
      `Vite server started on http://localhost:${server.config.server.port}`
    );
  }
}
