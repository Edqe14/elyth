import database from "@/configs/database";
import { MemoryCacheProvider } from "../cache";
import { Connection } from "./connection";
import type { Knex } from "knex";

type ConnectionKey = keyof (typeof database)["connection"];

export class DatabaseProvider {
  private cache = new MemoryCacheProvider<string, Connection>();

  public getConfigFor(key: ConnectionKey): Knex.Config | undefined {
    if (!database.connection[key]) return;

    return {
      client: database.connection[key].driver,
      connection: {
        ...database.connection[key],
        connectionString: database.connection[key].url,
        filename: database.connection[key].database,
      },
      debug: database.debug,
    };
  }

  public connection(key: string = database.defaultConnection) {
    if (this.cache.has(key)) return this.cache.get(key)!;

    const config = this.getConfigFor(key as ConnectionKey);
    if (!config) return;

    const connection = new Connection(key, config);
    connection.once("destroyed", () => this.cache.forget(key));

    this.cache.set(key, connection);

    return connection;
  }
}
