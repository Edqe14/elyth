import { DatabaseProvider } from "@providers/database";
import { Command } from "@console/command";
import { MigrationHelper } from "@/app/providers/database/migration/helper";

type Options = {
  fresh: boolean;
  name: string | false;
  connection: string;
};

export default class Migrate extends Command {
  public signature =
    "migrate {--fresh|f:Drop_all_tables_and_re-run_all_migrations} {--name_<migration>|n:Specify_the_migration_to_run} {--connection_<name>|c:Specify_the_connection_to_use=default}";
  public description = "Run all pending migrations";

  private databaseProvider = new DatabaseProvider();

  public async handle(options: Options) {
    const connection = this.databaseProvider.connection(options.connection);
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
  }
}
