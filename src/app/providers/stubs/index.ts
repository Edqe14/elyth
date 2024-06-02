import { join } from "path";
import { MemoryCacheProvider } from "../cache";
import { Stub } from "./stub";
import { file } from "bun";

export class StubsProvider {
  private cache = new MemoryCacheProvider();
  private directory = join(__dirname, "..", "..", "..", "stubs");

  public async get(key: string): Promise<Stub | null> {
    if (this.cache.has(key)) return new Stub(this.cache.get<string>(key)!);

    const target = file(join(this.directory, `${key}.stub.ts`));

    if (!(await target.exists())) return null;

    const content = await target.text();

    return new Stub(content);
  }
}
