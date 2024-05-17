import { DatabaseProvider } from "@providers/database";
import { Command } from "@console/command";
import { MigrationHelper } from "@/app/providers/database/migration/helper";
import type { Connection } from "@providers/database/connection";

type Options = {
  connection: string;
};

export default class MigrateUnlock extends Command {
  public signature =
    "migrate:unlock {--connection_<name>|c:Specify_the_connection_to_use=default}";
  public description = "Unlock migrations";

  private databaseProvider = new DatabaseProvider();

  public async handle(options: Options) {
    const connection = this.databaseProvider.connection(options.connection);
    if (!connection) {
      return this.logger.error(`Connection ${options.connection} not found`);
    }

    const helper = new MigrationHelper(connection);

    await helper.ensureMigrationTables();
    const isLocked = await helper.isLocked();

    if (!isLocked) {
      await helper.cleanUp();
      return this.logger.info("Migration is not locked.");
    }

    await helper.unlock();
    await helper.cleanUp();

    return this.logger.success("Migration unlocked successfully");
  }
}
