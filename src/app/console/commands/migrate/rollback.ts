import { DatabaseProvider } from "@providers/database";
import { Command } from "@console/command";
import { MigrationHelper } from "@providers/database/migration/helper";
import { join } from "path";
import { Migration } from "@providers/database/migration";
import { Connection } from "@providers/database/connection";
import database from "@configs/database";

type Options = {
  connection: string | false;
  steps: string;
};

export default class MigrateRollback extends Command {
  public signature =
    "migrate:rollback {--steps_<amount>|s:How_many_steps_to_rollback=1} {--connection_<name>|c:Specify_the_connection_to_use}";
  public description = "Roll back migrations";

  private databaseProvider = new DatabaseProvider();
  private directory = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "database",
    "migrations"
  );

  public async handle(options: Options) {
    const connection = this.databaseProvider.connection(
      options.connection || database.defaultConnection
    );
    if (!connection) {
      return this.logger.error(`Connection ${options.connection} not found`);
    }

    const steps = parseInt(options.steps, 10);
    if (isNaN(steps)) {
      return this.logger.error("Invalid steps");
    }

    const helper = new MigrationHelper(connection);

    await helper.ensureMigrationTables();
    const isLocked = await helper.isLocked();

    if (isLocked) {
      return this.logger.error(
        "Migration is locked. To forcefully unlock, use migrate:unlock"
      );
    }

    await helper.lock();

    const maxGroup = await helper.getLatestGroup();
    const groups = [];

    for (let i = 0; i < steps; i++) {
      if (maxGroup - i < 0) break;

      groups.push(maxGroup - i);
    }

    const files = await helper.getMigrationsByGroup(groups);

    this.logger.info(`Rolling back ${files.length} migrations`);

    try {
      for (const [key, file] of Object.entries(files)) {
        const index = Number(key);
        const migration = (
          await import(`@database/migrations/${file}?t=${Date.now()}`)
        ).default as Migration;

        try {
          await this.runMigration(migration, connection);
        } catch (error: any) {
          throw [index, file, error];
        }

        this.logger.success(
          `[${index + 1}] "${file}" rolled back successfully`
        );
      }

      await helper.deleteMigrationRecordByGroups(groups);

      this.logger.success("Migrations rolled back successfully");
    } catch (error: any) {
      if (Array.isArray(error)) {
        const [index, file, errObject] = error as [number, string, Error];

        this.logger.error(`[${index + 1}] "${file}" errored.`, errObject);
      } else {
        this.logger.error("An error occurred");
        console.log(error);
      }
    }

    await helper.unlock();
    await helper.cleanUp();
  }

  public async runMigration(migration: Migration, connection: Connection) {
    if (!migration.withTransaction) {
      await migration.down(connection.schema.withSchema("public"));
      return;
    }

    await connection.query.transaction(async (trx) => {
      await migration.down(trx.schema.withSchema("public"));
    });
  }
}
