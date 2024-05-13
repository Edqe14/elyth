import knex from "knex";
import database from "@/configs/database";

export class DatabaseProvider {
  private destroyed = false;
  private client = this.create();

  public async connect() {
    if (this.destroyed) {
      this.client = this.create();
    }

    await this.client.raw("SELECT 1");
  }

  public async disconnect() {
    await this.client.destroy();

    this.destroyed = true;
  }

  get isDestroyed() {
    return this.destroyed;
  }

  get connection() {
    return this.client;
  }

  private create() {
    return knex({
      client: database.driver,
      connection: {
        connectionString: database.credentials.url,
        host: database.credentials.host,
        port: database.credentials.port,
        user: database.credentials.user,
        password: database.credentials.password,
        database: database.credentials.database,
        ssl: database.credentials.ssl,
        filename: database.credentials.database,
      },
    });
  }
}
