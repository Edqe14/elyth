import { join } from "path";
import { GeneratorCommand } from "@console/generatorCommand";

export default class MakeController extends GeneratorCommand {
  public name = "Controller";
  public signature =
    "make:controller <name> {--force|f:Force_create} {--resource|r:Resource_controller}";
  public description = "Create a new controller";

  public directory = join(__dirname, "..", "..", "..", "http", "controllers");

  public getStub(
    name: string,
    options: Record<string, boolean>
  ): string | null {
    if (options.resource) {
      return "resourceController";
    }

    return "controller";
  }
}
