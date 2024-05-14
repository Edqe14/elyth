import database from "@configs/database";
import { Connection } from "../connection";

export class MigrationHelper {
  constructor(public connection: Connection) {}

  public async createMigrationTable(tableName = "migrations", schema = "mvc") {
    await this.connection.schema
      .withSchema(schema)
      .createTableIfNotExists(tableName, (table) => {
        table.increments();
        table.string("group").defaultTo("0");
        table.string("name").unique().notNullable();
        table.timestamps();
      });
  }

  public async ensureMigrationTables() {
    await this.createMigrationTable(
      database.migration.tableName,
      database.migration.schema
    );
  }

  public async isLocked() {
    const lock = await this.connection
      .query<{ name: string }>()
      .withSchema(database.migration.schema)
      .where("name", "lock")
      .first();

    return Boolean(lock);
  }

  public async lock() {
    await this.connection
      .query(database.migration.tableName)
      .insert({ name: "lock" });
  }

  public async unlock() {
    await this.connection
      .query(database.migration.tableName)
      .where("name", "lock")
      .delete();
  }

  public dropAllTables() {
    // TODO: Implement this
    throw new Error("Method not implemented.");
  }
}
