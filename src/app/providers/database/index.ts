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
      connection: {
        ...database.connection[key],
        connectionString: database.connection[key].url,
        filename: database.connection[key].database,
      },
    };
  }

  public connection(key = "default") {
    if (this.cache.has(key)) return this.cache.get(key);

    const config = this.getConfigFor(key as ConnectionKey);
    if (!config) return;

    const connection = new Connection(key, config);

    this.cache.set(key, connection);

    return connection;
  }
}
