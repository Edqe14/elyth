import { join } from "path";
import { GeneratorCommand } from "@console/generatorCommand";

export default class MakeMiddleware extends GeneratorCommand {
  public name = "Middleware";
  public signature = "make:middleware <name> {--force|f:Force_create}";
  public description = "Create a new middleware";

  public directory = join(__dirname, "..", "..", "..", "http", "middlewares");
}
