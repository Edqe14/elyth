import chalk from "chalk";
import { Command } from "@console/command";

export default class ListRoutes extends Command {
  public signature = "routes";
  public description = "List all available routes";

  public async handle() {
    process.env.CLI = "true";

    const { app } = await import("@/index");

    const routes = app.getRoutes().map((route) => {
      const indexOfFirstSlash = route.indexOf("/");
      const [method, path] = [
        route.slice(0, indexOfFirstSlash),
        route.slice(indexOfFirstSlash),
      ];

      return [
        method as keyof typeof this.logger.httpMethodColors,
        path,
      ] as const;
    });

    console.log(chalk.underline.bold("Availble routes:"));

    for (const [method, path] of routes) {
      console.log(`${this.formatMethod(method)} ${path}`);
    }
  }

  private formatMethod(method: keyof typeof this.logger.httpMethodColors) {
    return this.logger.httpMethodColors[method](method.padEnd(6));
  }
}
