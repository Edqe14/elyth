import { MemoryCacheProvider } from "./cache";
import { ConfigProvider } from "./config";
import { LoggerProvider } from "./logger";
import { UtilsProvider } from "./utils";
import { DatabaseProvider } from "./database";

export default {
  logger: new LoggerProvider(),
  config: new ConfigProvider("@/configs"),
  utils: UtilsProvider,
  cache: new MemoryCacheProvider(),
  database: new DatabaseProvider(),
} as const;