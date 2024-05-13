import { join } from "path";
import { Command } from "@console/command";
import { StubsProvider } from "@providers/stubs";
import { camelCase } from "change-case";
import { file } from "bun";

export default class ListRoutes extends Command {
  public signature = "make:controller <name> {--force|f:Force_create}";
  public description = "Create a new controller";

  private directory = join(__dirname, "..", "..", "..", "http", "controllers");
  private stubProvider = new StubsProvider();

  public async handle(name: string, options: Record<string, boolean>) {
    const target = file(join(this.directory, `${camelCase(name)}.ts`));
    if (await target.exists()) {
      if (!options.force) {
        this.logger.error(`Controller "${name}" already exists`);
        return;
      }
    }

    const stub = await this.stubProvider.get("controller");
    if (!stub) {
      this.logger.error("Controller stub not found");
      return;
    }

    const content = stub.replace("name", name).render();

    const writer = target.writer();

    writer.write(content);
    writer.end();

    this.logger.success(`Controller "${name}" created`);
  }
}
