import { join } from "path";
import { GeneratorCommand } from "@console/generatorCommand";

export default class MakeMigration extends GeneratorCommand {
  public name = "Migration";
  public signature = "make:migration <name> {--force|f:Force_create}";
  public description = "Create a new migration";

  public directory = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "database",
    "migrations"
  );

  public getFilename(name: string) {
    const date = new Date();
    const prefix = `${date.getDate().toString().padStart(2, "0")}${date
      .getMonth()
      .toString()
      .padStart(2, "0")}${date.getFullYear().toString().slice(-2)}`;

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const timestamp = Math.round(
      ((date.getTime() - startOfDay.getTime()) / 86400000) * 1000000
    )
      .toString()
      .padStart(7, "0");

    return `${prefix}_${timestamp}_${name}.ts`;
  }
}
