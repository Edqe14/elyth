import { join } from "path";
import { MemoryCacheProvider } from "../cache";
import { Stub } from "./stub";

export class StubsProvider {
  private cache = new MemoryCacheProvider();
  private directory = join(__dirname, "..", "..", "..", "stubs");

  public async get(key: string): Promise<Stub | null> {
    if (this.cache.has(key)) return new Stub(this.cache.get<string>(key)!);

    const file = Bun.file(join(this.directory, `${key}.stub.ts`));

    if (!(await file.exists())) return null;

    const content = await file.text();

    return new Stub(content);
  }
}
