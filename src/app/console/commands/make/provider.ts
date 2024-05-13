import { join } from "path";
import { Command } from "@console/command";
import { StubsProvider } from "@providers/stubs";
import { camelCase } from "change-case";
import { file } from "bun";
import { mkdir } from "fs/promises";

export default class MakeProvider extends Command {
  public signature =
    "make:provider <name> {--force|f:Force_create} {--single|s:Create_in_a_single_file}";
  public description = "Create a new provider";

  private directory = join(__dirname, "..", "..", "..", "providers");
  private stubProvider = new StubsProvider();

  public getFileName(name: string) {
    return camelCase(name)
      .replace(/Provider$/, "")
      .trim();
  }

  public async handle(name: string, options: Record<string, boolean>) {
    const fileName = this.getFileName(name);
    // const target = file(
    //   options.single
    //     ? join(this.directory, `${fileName}.ts`)
    //     : join(this.directory, fileName, "index.ts")
    // );
    // if (await target.exists()) {
    //   if (!options.force) {
    //     this.logger.error(`Provider "${name}" already exists`);
    //     return;
    //   }
    // }

    // const stub = await this.stubProvider.get("provider");
    // if (!stub) return this.logger.error("Provider stub not found");

    // const content = stub.replace("name", name).render();

    // if (!options.single) {
    //   await mkdir(join(this.directory, fileName), {
    //     recursive: true,
    //   });
    // }

    // const writer = target.writer();

    // writer.write(content);
    // writer.end();

    this.appendProvider(fileName, name);

    this.logger.success(`Provider "${name}" created`);
  }

  public async appendProvider(fileName: string, className: string) {
    const target = file(join(this.directory, "index.ts"));

    const content = await target.text();
    const index = content.indexOf("export default {");
    const endIndex = content.lastIndexOf("} as const;");

    const imports = content.slice(0, index).trim().split("\n");
    imports.push(`import { ${className} } from "./${fileName}";`);

    const exports = content
      .slice(index, endIndex + "} as const;".length)
      .split("\n");

    const lastExport = exports[exports.length - 2];
    if (!lastExport.endsWith(",")) {
      exports[exports.length - 2] = lastExport + ",";
    }

    exports.splice(exports.length - 1, 0, `  ${fileName}: new ${className}(),`);

    const newContent = [...imports, "", ...exports].join("\n");

    const writer = target.writer();

    writer.write(newContent);
    writer.end();
  }
}
