import { join } from "path";
import { camelCase } from "change-case";
import { GeneratorCommand } from "@console/generatorCommand";

export default class MakeProvider extends GeneratorCommand {
  public name = "Provider";
  public signature =
    "make:provider <name> {--force|f:Force_create} {--single|s:Create_in_a_single_file}";
  public description = "Create a new provider";

  public directory = join(__dirname, "..", "..", "..", "providers");

  public getFilename(name: string, options: Record<string, boolean>) {
    if (!options.single) return "index.ts";

    return camelCase(name) + ".ts";
  }

  public getDirectory(name: string, options: Record<string, boolean>) {
    const extraDir = options.single
      ? ""
      : camelCase(name)
          .replace(/Provider$/, "")
          .trim();

    return join(this.directory, extraDir);
  }
}
