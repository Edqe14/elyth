import { Command } from "@console/command";
import { createServer } from "vite";
import { join } from "path";

export default class Serve extends Command {
  public signature = "serve";
  public description = "List all available routes";

  public async handle() {
    if (this.program.isProduction) {
      process.env.NODE_ENV = "production";

      // auto build if manifest.json not found
      try {
        require(join(process.cwd(), ".vite", "manifest.json"));
      } catch (error) {
        await (await this.program.getCommand("build"))?.handle();
      }
    }

    await import("@/index");

    if (!this.program.isProduction) {
      await this.startVite();
    }
  }

  public async startVite() {
    const server = await createServer({
      root: process.cwd(),
    });

    await server.listen();

    this.logger.info(
      `Vite server started on http://localhost:${server.config.server.port}`
    );
  }
}
