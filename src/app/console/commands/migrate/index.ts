import { DatabaseProvider } from "@providers/database";
import { Command } from "@console/command";
import { MigrationHelper } from "@/app/providers/database/migration/helper";
import { join } from "path";
import { Glob } from "bun";
import { Migration } from "@providers/database/migration";
import { Connection } from "@providers/database/connection";
import database from "@configs/database";

type Options = {
  fresh: boolean;
  name: string | false;
  connection: string | false;
};

export default class Migrate extends Command {
  public signature =
    "migrate {--fresh|f:Drop_all_tables_and_re-run_all_migrations} {--name_<migration>|n:Specify_the_migration_to_run} {--connection_<name>|c:Specify_the_connection_to_use}";
  public description = "Run migrations";

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

    const helper = new MigrationHelper(connection);

    await helper.ensureMigrationTables();
    const isLocked = await helper.isLocked();

    if (isLocked) {
      return this.logger.error(
        "Migration is locked. To forcefully unlock, use migrate:unlock"
      );
    }

    await helper.lock();

    if (options.fresh) {
      await helper.dropAllTables();
      await helper.ensureMigrationTables();
      await helper.lock();
    }

    const [records, files] = await Promise.all([
      helper.getMigrationsRecord(),
      await Array.fromAsync(new Glob("*.ts").scan(this.directory)),
    ]);

    const newMigrations = files.filter(
      (file) =>
        !records.some((record) => record.name === file) &&
        (typeof options.name === "string" ? file === options.name : true)
    );

    if (newMigrations.length === 0) {
      return this.logger.info("No new migrations to run");
    }

    const newGroup =
      Math.max(-1, ...records.map((record) => Number(record.group))) + 1;

    this.logger.info(`Running ${newMigrations.length} new migrations`);

    try {
      for (const [key, file] of Object.entries(newMigrations)) {
        const index = Number(key);
        const migration = (
          await import(`@database/migrations/${file}?t=${Date.now()}`)
        ).default as Migration;

        try {
          await this.runMigration(migration, connection);
        } catch (error: any) {
          throw [index, file, error];
        }

        this.logger.success(`[${index + 1}] "${file}" ran successfully`);
      }

      await helper.insertMigrationRecord(newMigrations, newGroup);

      this.logger.success("All migrations ran successfully");
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
      await migration.up(connection.schema.withSchema("public"));
      return;
    }

    await connection.query.transaction(async (trx) => {
      await migration.up(trx.schema.withSchema("public"));
    });
  }
}
