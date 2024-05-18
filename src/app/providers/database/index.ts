import database from "@/configs/database";
import { MemoryCacheProvider } from "../cache";
import { Connection } from "./connection";

type ConnectionKey = keyof (typeof database)["connection"];

type ResolvedOf<Key> = Key extends ConnectionKey
  ? Connection<
      Awaited<ReturnType<(typeof database.connection)[Key]["resolver"]>>
    >
  : never;

export class DatabaseProvider {
  private cache = new MemoryCacheProvider<string, Connection<any>>();

  public async connection<Key extends ConnectionKey>(
    key: Key = database.defaultConnection as Key
  ) {
    if (this.cache.has(key))
      return this.cache.get(key)! as ResolvedOf<typeof key>;

    const resolver = database.connection[key as ConnectionKey]?.resolver;
    if (!resolver) throw new Error(`Connection "${key}" not found`);

    const driver = await resolver();
    const connection = new Connection(key, driver);

    this.cache.set(key, connection);

    return connection;
  }
}
