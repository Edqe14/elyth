import { join } from "path/posix";
import { ConfigError } from "./configError";
import { getProperty } from "dot-prop";

export class ConfigProvider {
  public directory: string;

  public readonly cache = new Map<string, any>();

  constructor(directory: string) {
    this.directory = directory;
  }

  public set<T>(key: string, value: T) {
    this.cache.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return (this.cache.get(key) as T) || this.parse<T>(key);
  }

  protected parse<T>(key: string) {
    if (this.cache.has(key)) return this.cache.get(key) as T;

    return this.load<T>(key);
  }

  public load<T>(key: string) {
    // Key is dot-separated
    const [file, ...path] = key.split(".");
    if (this.cache.has(key)) return this.loadKey<T>(file, path.join("."));

    const filePath = join(this.directory, `${file}`);

    try {
      const module = require(filePath) as { default: any };
      const config = module.default;

      if (!config) throw new ConfigError(`Config file for "${file}" is empty`);

      this.cache.set(file, config);
      if (path.length === 0) return config as T | undefined;

      return this.loadKey<T>(file, path.join("."));
    } catch (error) {
      throw new ConfigError(`Config file for "${file}" not found`);
    }
  }

  public loadKey<T>(module: string, key: string) {
    if (this.cache.has(`${module}.${key}`)) return;

    const property = getProperty(this.cache.get(module)!, key) as T | undefined;
    this.cache.set(key, property);

    return property;
  }
}
