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

  public async getLatestGroup() {
    const latest = (await this.query(database.migration.tableName)
      .whereNot("name", "lock")
      .max("group")
      .first()) as unknown as { max: string };

    return latest ? parseInt(latest.max, 10) : 0;
  }

  public async getMigrationsByGroup(groups: number[]) {
    return this.query<{ name: string }>(database.migration.tableName)
      .whereIn("group", groups)
      .whereNot("name", "lock")
      .select("name")
      .pluck("name");
  }

  public async deleteMigrationRecordByGroups(groups: number[]) {
    await this.query(database.migration.tableName)
      .whereIn("group", groups)
      .whereNot("name", "lock")
      .delete();
  }

  public async cleanUp() {
    await this.connection.destroy();
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

      // NOTE: UNTESTED
      case "mysql": {
        await this.connection.query.raw("SET FOREIGN_KEY_CHECKS = 0;");

        const tables = await this.connection
          .query("information_schema.tables")
          .where("table_schema", this.connection.query.raw`DATABASE()`)
          .pluck("table_name");

        await Promise.all(
          tables.map((table) => this.connection.schema.dropTable(table))
        );

        await this.connection.query.raw("SET FOREIGN_KEY_CHECKS = 1;");

        return;
      }

      // NOTE: UNTESTED
      case "sqlite": {
        await this.connection.query.raw("PRAGMA writable_schema = 1;");

        await this.connection
          .query("sqlite_master")
          .whereIn("type", ["table", "index", "trigger"])
          .delete();

        await this.connection.query.raw("PRAGMA writable_schema = 0;");
        await this.connection.query.raw("VACUUM;");

        return;
      }

      // NOTE: UNTESTED
      case "mssql": {
        await this.connection.query.raw(`
          EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
          EXEC sp_MSforeachtable 'DROP TABLE ?';
          EXEC sp_MSforeachtable 'DROP VIEW ?';
          DECLARE @cmd NVARCHAR(4000);
          -- Drop functions
          SELECT @cmd = 'DROP FUNCTION [' + ROUTINE_SCHEMA + '].[' + ROUTINE_NAME + ']'
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_TYPE = 'FUNCTION';
          EXEC sp_executesql @cmd;
          -- Drop procedures
          SELECT @cmd = 'DROP PROCEDURE [' + ROUTINE_SCHEMA + '].[' + ROUTINE_NAME + ']'
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_TYPE = 'PROCEDURE';
          EXEC sp_executesql @cmd;
        `);
      }

      // TODO: Add support for other databases
      default:
        throw new Error(`Unsupported database type: ${this.connection.type}`);
    }
  }
}
