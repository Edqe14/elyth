import { LoggerProvider } from "@providers/logger";
import type { MVC } from "./mvc";

export abstract class Command {
  protected program: MVC;
  public abstract signature: string;
  public abstract description: string;

  public readonly logger: LoggerProvider;

  constructor(program: MVC) {
    this.program = program;
    this.logger = program.logger;
  }

  public abstract handle(...args: any[]): Promisable<void>;

  public register() {
    const { command, options } = this.prepareCommand();

    options
      .reduce((cmd, { optionParts, optionDescription, optionDefault }) => {
        if (!optionDescription) {
          return cmd.requiredOption(
            optionParts.join(", "),
            optionDescription,
            optionDefault
          );
        }

        return cmd.option(
          optionParts.join(", "),
          optionDescription,
          optionDefault
        );
      }, this.program.command(command).description(this.description))
      .action(this.handle.bind(this));
  }

  private prepareCommand() {
    const signature = this.signature.split(" ");
    const name = signature.shift();

    const args: string[] = [];
    const options: {
      optionParts: string[];
      optionDescription?: string;
      optionDefault?: string;
    }[] = [];

    signature.forEach((part) => {
      if (part.startsWith("{") && part.endsWith("}")) {
        const [option, description, defaultVal] = part
          .slice(1, -1)
          .trim()
          .split(/[:=]/gi);

        const optionParts = option
          .split("|")
          .map((v) => `${!v.trim().startsWith("--") ? "-" : ""}${v.trim()}`)
          .toSorted((a, b) => a.length - b.length);
        const optionDescription = description?.trim()?.replaceAll("_", " ");
        const optionDefault = defaultVal?.trim() ?? false;

        options.push({ optionParts, optionDescription, optionDefault });

        return;
      }

      args.push(part);
    });

    return {
      command: `${name} ${args.join(" ")}`,
      options,
    };
  }
}
