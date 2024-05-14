// Memory cache for storing data in memory
export class MemoryCacheProvider<Key = string, Value = any> {
  private cache = new Map<Key, Value>();

  public set(key: Key, value: Value) {
    this.cache.set(key, value);
  }

  public get(key: Key) {
    return this.cache.get(key) as Value | undefined;
  }

  public has(key: Key) {
    return this.cache.has(key);
  }

  public forget(key: Key) {
    this.cache.delete(key);
  }

  /**
   *
   * @param key Cache key
   * @param ttl In milliseconds
   * @param callback Generate value if not exists
   */
  public remember(key: Key, ttl: number, callback: () => Value) {
    if (this.has(key)) {
      return this.get(key) as Value;
    }

    const value = callback();
    this.set(key, value);

    setTimeout(() => {
      this.forget(key);
    }, ttl);

    return value;
  }
}
