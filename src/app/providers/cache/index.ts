// Memory cache for storing data in memory
export class MemoryCacheProvider {
  private cache = new Map<string, any>();

  public set<T = any>(key: string, value: T) {
    this.cache.set(key, value);
  }

  public get<T = any>(key: string) {
    return this.cache.get(key) as T | undefined;
  }

  public has(key: string) {
    return this.cache.has(key);
  }

  public forget(key: string) {
    this.cache.delete(key);
  }

  /**
   *
   * @param key Cache key
   * @param ttl In milliseconds
   * @param callback Generate value if not exists
   */
  public remember<T = any>(key: string, ttl: number, callback: () => T) {
    if (this.has(key)) {
      return this.get(key) as T;
    }

    const value = callback();
    this.set(key, value);

    setTimeout(() => {
      this.forget(key);
    }, ttl);

    return value;
  }
}
