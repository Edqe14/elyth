import database from "@configs/database";
import { Connection } from "../connection";

export class MigrationHelper {
  constructor(public connection: Connection) {}

  public query<TRecord extends {} = any, TResult = {}[]>(table: string) {
    return this.connection
      .query<TRecord, TResult>(table)
      .withSchema(database.migration.schema);
  }

  public async createMigrationTable(tableName = "migrations", schema = "mvc") {
    await this.connection.schema.createSchemaIfNotExists(schema);

    const schemaDb = this.connection.schema.withSchema(schema);

    if (!(await schemaDb.hasTable(tableName))) {
      await schemaDb.createTable(tableName, (table) => {
        table.increments();
        table.string("group").defaultTo("0");
        table.string("name").unique().notNullable();
        table.timestamps(true, true);
      });
    }
  }

  public async ensureMigrationTables() {
    await this.createMigrationTable(
      database.migration.tableName,
      database.migration.schema
    );
  }

  public async isLocked() {
    const lock = await this.query<{ name: string }>(
      database.migration.tableName
    )
      .where("name", "lock")
      .first();

    return Boolean(lock);
  }

  public async lock() {
    await this.query(database.migration.tableName).insert({ name: "lock" });
  }

  public async unlock() {
    await this.query(database.migration.tableName)
      .where("name", "lock")
      .delete();
  }

  public async getMigrationsRecord() {
    return this.query<{ name: string; group: string }>(
      database.migration.tableName
    )
      .whereNot("name", "lock")
      .select("name", "group");
  }

  public async insertMigrationRecord(name: string[], group: number) {
    await this.query(database.migration.tableName).insert(
      name.map((name) => ({ name, group }))
    );
  }

  public async dropAllTables() {
    switch (this.connection.type) {
      case "postgres": {
        const schemas = await this.connection
          .query("pg_tables")
          .distinct("schemaname")
          .whereNotIn("schemaname", ["pg_catalog", "information_schema"])
          .pluck("schemaname");

        for (const schema of schemas) {
          if (schema === "public") {
            const tables = await this.connection
              .query("pg_tables")
              .where("schemaname", schema)
              .pluck("tablename");

            await Promise.all(
              tables.map((table) =>
                this.connection.schema.withSchema(schema).dropTable(table)
              )
            );

            continue;
          }

          await this.connection.schema
            .withSchema(schema)
            .dropSchema(schema, true);
        }

        return;
      }

      // TODO: Add support for other databases
      default:
        throw new Error(`Unsupported database type: ${this.connection.type}`);
    }
  }
}
