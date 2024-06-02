import type { ContextForRoute } from "@/app";
import { Controller } from "@controllers/controller";

export class ``name`` extends Controller {
  public async index(ctx: ContextForRoute<"/">) {
    return "Hello ``name``!";
  }

  public async show(ctx: ContextForRoute<"/:id">) {
    return "Show ``name``!";
  }

  public async create(ctx: ContextForRoute<"/">) {
    return "Create ``name``!";
  }

  public async store(ctx: ContextForRoute<"/">) {
    return "Store ``name``!";
  }

  public async edit(ctx: ContextForRoute<"/:id/edit">) {
    return "Edit ``name``!";
  }

  public async update(ctx: ContextForRoute<"/:id">) {
    return "Update ``name``!";
  }

  public async destroy(ctx: ContextForRoute<"/:id">) {
    return "Destroy ``name``!";
  }
}
