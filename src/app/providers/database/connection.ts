import knex, { Knex } from "knex";

export class Connection {
  public readonly driver: Knex;

  constructor(
    public readonly name: string,
    public readonly config: Knex.Config
  ) {
    this.driver = knex(config);
  }

  public get schema() {
    return this.driver.schema;
  }

  public get query() {
    return this.driver;
  }
}
