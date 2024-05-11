import { ContextForRoute } from ".";

export abstract class Middleware {
  /**
   * Return a response to stop execution
   * @param ctx
   */
  public abstract handle(ctx: ContextForRoute): Promisable<any>;
}
