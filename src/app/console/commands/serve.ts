import { Command } from "@console/command";

export default class Serve extends Command {
  public signature = "serve";
  public description = "List all available routes";

  public async handle() {
    delete process.env.CI;

    await import("@/index");
  }
}
