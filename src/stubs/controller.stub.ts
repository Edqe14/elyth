import type { ContextForRoute } from "@/app";
import { Controller } from "@controllers/controller";

export class ``name`` extends Controller {
  public async index(ctx: ContextForRoute<"/">) {
    return "Hello ``name``!";
  }
}
