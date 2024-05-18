import knex, { Knex } from "knex";
import { EventEmitter } from "events";

export class Connection extends EventEmitter {
  public readonly driver: Knex;
  public readonly type: "postgres" | "mysql" | "sqlite" | "mssql";
  private destroyed = false;

  constructor(
    public readonly name: string,
    public readonly config: Knex.Config
  ) {
    super();

    this.driver = knex(config);
    this.type = Connection.getConnectionType(config.client as string);
  }

  private static getConnectionType(
    driver: string
  ): "postgres" | "mysql" | "sqlite" | "mssql" {
    if (["sqlite3", "better-sqlite3"].includes(driver)) return "sqlite";
    if (["mysql", "mysql2"].includes(driver)) return "mysql";
    if (["tedious"].includes(driver)) return "mssql";

    return "postgres";
  }

  public get database() {
    return (
      this.driver.client?.config?.connection?.filename ??
      this.driver.client?.config?.connection?.database
    );
  }

  public get schema() {
    return this.driver.schema;
  }

  public get query() {
    return this.driver;
  }

  public async destroy() {
    if (this.destroyed) return;

    await this.driver.destroy();

    this.emit("destroyed");

    this.destroyed = true;
  }

  public get isDestroyed() {
    return this.destroyed;
  }
}
