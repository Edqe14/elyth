import { join } from "path";
import { Command } from "@console/command";
import { StubsProvider } from "@providers/stubs";
import { camelCase } from "change-case";
import { file } from "bun";
import { Stub } from "@providers/stubs/stub";
import { Command as Commander } from "commander";
import { mkdir } from "fs/promises";

export abstract class GeneratorCommand extends Command {
  public abstract name: string;
  public abstract signature: string;
  public abstract description: string;

  public abstract directory: string;
  public stub: string | null = null;
  private stubProvider = new StubsProvider();

  public getFilename(name: string, options: Record<string, boolean>) {
    return camelCase(name) + ".ts";
  }

  public getDirectory(name: string, options: Record<string, boolean>) {
    return this.directory;
  }

  public getFilePath(name: string, options: Record<string, boolean>) {
    return join(
      this.getDirectory(name, options),
      this.getFilename(name, options)
    );
  }

  public renderStub(stub: Stub, command: Commander) {
    return stub.replace("name", command.args[0] as string).render();
  }

  public getStub(name: string, options: Record<string, boolean>) {
    return this.stub;
  }

  public async handle(...args: [...(string | object)[], Commander]) {
    const name = args.shift() as string;
    const command = args.pop() as Commander;
    const options = args.pop() as Record<string, boolean>;

    const target = file(this.getFilePath(name, options));
    if ((await target.exists()) && !options.force) {
      return this.logger.error(`${this.name} "${name}" already exists`);
    }

    const stub = await this.stubProvider.get(
      this.getStub(name, options) ?? camelCase(this.name)
    );
    if (!stub) {
      return this.logger.error(`${this.name} stub not found`);
    }

    const content = this.renderStub(stub, command);

    await mkdir(this.getDirectory(name, options), { recursive: true });

    const writer = target.writer();

    writer.write(content);
    writer.end();

    this.logger.success(`${this.name} "${name}" created successfully`);
  }
}
