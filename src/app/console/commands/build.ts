import { Command } from "@console/command";
import { build } from "vite";
import viteConfig from "@/../../vite.config";

export default class Serve extends Command {
  public signature = "build";
  public description = "Build the application for production";

  public async handle() {
    await Promise.all([
      Bun.$`rm -rf .vite`,
      Bun.$`rm -rf ${viteConfig.build?.outDir}`,
    ]);

    await build();

    // move manifest.json outside of public
    await Bun.$`mv ${viteConfig.build?.outDir}/.vite .vite`;

    this.logger.success("Application built successfully");
  }
}
