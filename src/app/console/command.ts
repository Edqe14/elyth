import type { MVC } from "./mvc";

export abstract class Command {
  private program: MVC;
  public abstract signature: string;
  public abstract description: string;

  constructor(program: MVC) {
    this.program = program;
  }

  public abstract handle(...args: any[]): Promisable<void>;

  public register() {
    this.program
      .command(this.signature)
      .description(this.description)
      .action(this.handle.bind(this));
  }
}
