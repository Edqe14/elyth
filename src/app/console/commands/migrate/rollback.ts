import { DatabaseProvider } from "@providers/database";
import { Command } from "@console/command";
import { MigrationHelper } from "@/app/providers/database/migration/helper";

type Options = {
  connection: string;
  steps: string;
};

export default class MigrateRollback extends Command {
  public signature =
    "migrate:rollback {--steps_<amount>|s:How_many_steps_to_rollback=1} {--connection_<name>|c:Specify_the_connection_to_use=default}";
  public description = "Roll back migrations";

  private databaseProvider = new DatabaseProvider();

  public async handle(options: Options) {
    const connection = this.databaseProvider.connection(options.connection);
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
    console.log(maxGroup);
  }
}
