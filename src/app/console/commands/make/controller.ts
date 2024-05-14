import { join } from "path";
import { GeneratorCommand } from "@console/generatorCommand";

export default class MakeController extends GeneratorCommand {
  public name = "Controller";
  public signature = "make:controller <name> {--force|f:Force_create}";
  public description = "Create a new controller";

  public directory = join(__dirname, "..", "..", "..", "http", "controllers");
}
