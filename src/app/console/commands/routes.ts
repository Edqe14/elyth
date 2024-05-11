import chalk from "chalk";
import { Command } from "../command";

export default class ListRoutes extends Command {
  public signature = "routes";
  public description = "List all available routes";

  private methodColors = {
    GET: (text: string) => chalk.bold.green(text),
    POST: (text: string) => chalk.bold.blue(text),
    PUT: (text: string) => chalk.bold.yellow(text),
    PATCH: (text: string) => chalk.bold.cyan(text),
    DELETE: (text: string) => chalk.bold.red(text),
  };

  public async handle() {
    const { app } = await import("@/index");

    const routes = app.getRoutes().map((route) => {
      const indexOfFirstSlash = route.indexOf("/");
      const [method, path] = [
        route.slice(0, indexOfFirstSlash),
        route.slice(indexOfFirstSlash),
      ];

      return [method as keyof typeof this.methodColors, path] as const;
    });

    console.log(chalk.underline.bold("Availble routes:"));

    for (const [method, path] of routes) {
      console.log(`${this.formatMethod(method)} ${path}`);
    }
  }

  private formatMethod(method: keyof typeof this.methodColors) {
    return this.methodColors[method](method.padEnd(6));
  }
}
