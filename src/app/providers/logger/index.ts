import chalk from "chalk";
import { inspect } from "util";

export type LoggerOptions = {
  writer?: NodeJS.WriteStream;
  errorWriter?: NodeJS.WriteStream;
  level?: LoggerLevel;
};

export const LoggerLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LoggerLevel = (typeof LoggerLevel)[keyof typeof LoggerLevel];

export class LoggerProvider {
  private writer: NodeJS.WriteStream;
  private errorWriter: NodeJS.WriteStream;
  private level: LoggerLevel = LoggerLevel.INFO;

  public readonly color = chalk;

  constructor(options?: LoggerOptions) {
    this.writer = options?.writer ?? process.stdout;
    this.errorWriter = options?.errorWriter ?? process.stderr;
    this.level = options?.level ?? LoggerLevel.INFO;
  }

  private shouldLog(level: LoggerLevel) {
    return level >= this.level;
  }

  public setLevel(level: LoggerLevel) {
    this.level = level;
  }

  public log(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.INFO)) return;

    this.writer.write(this.format(message, null, extra));
  }

  public error(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.ERROR)) return;

    this.errorWriter.write(this.format(message, this.color.red("✘"), extra));
  }

  public info(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.INFO)) return;

    this.writer.write(this.format(message, this.color.blue("👁"), extra));
  }

  public warn(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.WARN)) return;

    this.writer.write(this.format(message, this.color.yellow("⚠"), extra));
  }

  public debug(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.DEBUG)) return;

    this.writer.write(this.format(message, this.color.blueBright("⦾"), extra));
  }

  public success(message: string, ...extra: any[]) {
    if (!this.shouldLog(LoggerLevel.INFO)) return;

    this.writer.write(this.format(message, this.color.greenBright("✔"), extra));
  }

  protected format(message: string, prefix?: string | null, extra?: any[]) {
    return (
      `${prefix ?? ""} ${message}\n${
        extra?.map((v) => inspect(v, true, 4, true))?.join("\n") ?? ""
      }`.trim() + "\n"
    );
  }
}
