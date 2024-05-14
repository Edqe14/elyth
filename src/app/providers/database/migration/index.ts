import { Knex } from "knex";

export abstract class Migration {
  public withTransaction = true;

  public abstract up(schema: Knex.SchemaBuilder): Promise<void>;
  public abstract down(schema: Knex.SchemaBuilder): Promise<void>;
}

export type Schema = Knex.SchemaBuilder;
