import { join } from "path/posix";
import { ConfigError } from "./configError";
import { getProperty } from "dot-prop";

export class Config {
  public directory: string;

  public readonly cache = new Map<string, any>();

  constructor(directory: string) {
    this.directory = directory;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    return (this.cache.get(key) as T) || this.parse<T>(key);
  }

  protected async parse<T>(key: string) {
    if (this.cache.has(key)) return this.cache.get(key) as T;

    return this.load<T>(key);
  }

  public async load<T>(key: string) {
    // Key is dot-separated
    const [file, ...path] = key.split(".");
    if (this.cache.has(key)) return this.loadKey<T>(file, path.join("."));

    const filePath = join(this.directory, `${file}`);

    try {
      const module = await import(filePath);
      const config = module.default;

      if (!config) throw new ConfigError(`Config file for "${file}" is empty`);

      this.cache.set(file, config);
      if (path.length === 0) return config as T | undefined;

      return this.loadKey<T>(file, path.join("."));
    } catch (error) {
      throw new ConfigError(`Config file for "${file}" not found`);
    }
  }

  public async loadKey<T>(module: string, key: string) {
    if (this.cache.has(`${module}.${key}`)) return;

    const property = getProperty(this.cache.get(module)!, key) as T | undefined;
    this.cache.set(key, property);

    return property;
  }
}
