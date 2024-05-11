import { Command as Commander, Help } from "commander";
import { Command } from "./command";
import { join } from "path";

export class MVC extends Commander {
  constructor() {
    super("mvc");

    process.env.CI = "true";

    this.arguments("<command>");
    this.helpCommand("help");
    this.description("Elysia MVC CLI tool");
    this.parse();
  }

  public async run() {
    const [command] = this.args;

    try {
      const cmd = await import(
        `@console/commands/${command.replace(/:/g, "/")}`
      );

      const CommandClass = cmd.default as
        | (new (program: MVC) => Command)
        | undefined;
      if (!CommandClass) throw new Error("Command not found");

      const instance = new CommandClass(this);

      instance.register();
      this.parse();
    } catch (e: any) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        console.error(`Command "${command}" not found`);
      }
    }
  }

  public createHelp(): Help {
    const glob = new Bun.Glob("**/*.ts");
    const files = glob.scanSync(join(__dirname, "commands"));

    for (const file of files) {
      const cmd = require(`@console/commands/${file.replace(/\\/g, "/")}`);

      const CommandClass = cmd.default as
        | (new (program: MVC) => Command)
        | undefined;
      if (!CommandClass) continue;

      const instance = new CommandClass(this);

      instance.register();
    }

    return new Help();
  }
}

await new MVC().run();
