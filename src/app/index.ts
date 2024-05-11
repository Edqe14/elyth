import { Context, CookieOptions, Elysia, SingletonBase } from "elysia";
import { Config } from "@providers/config";
import { Utils } from "@providers/utils";
import { Cache } from "@providers/cache";
import { Router } from "./router";
import type { GetPathParameter } from "elysia/dist/types";
import type { AvailableRoutes } from "@configs/routes";
import type { Response as BunResponse } from "bun-types/fetch";

export type AppBaseTypes = SingletonBase & {
  decorator: {
    config: Config;
    utils: typeof Utils;
    cache: Cache;
    setHeader: (key: string, value: string) => AppBaseTypes["decorator"];
    setStatus: (status: number) => AppBaseTypes["decorator"];
    status: (status: number) => AppBaseTypes["decorator"];
    setCookie: (key: string, value: CookieOptions) => AppBaseTypes["decorator"];
    redirect: <const Route extends AvailableRoutes>(
      url: Route | string,
      params?: Route extends `${string}/${":" | "*"}${string}`
        ? Record<GetPathParameter<Route>, string>
        : never,
      status?: number
    ) => BunResponse;
    json: <T>(data: T) => Response;
    debugId?: string;
    debugTime?: number;
  };
};

export type ContextForRoute<Path extends string = ""> = Context<
  {},
  AppBaseTypes,
  Path
>;

export class App extends Elysia<"", false, AppBaseTypes> {
  public readonly configurations = new Config("@/configs");
  public readonly utils = Utils;
  public readonly cache = new Cache();

  constructor() {
    super();
  }

  createRouter<const Prefix extends string = "">(prefix?: Prefix) {
    return new Router<AppBaseTypes, Prefix>(this, this.decorator, prefix);
  }

  async init() {
    this.decorate("config", this.configurations);
    this.decorate("utils", this.utils);
    this.decorate("cache", this.cache);
    this.decorateSetters();

    // Load configurations
    await this.configurations.load("app");

    if (await this.configurations.get("app.debug")) {
      this.debug();
    }

    await this.loadRoutes();
  }

  public getRoutes() {
    return Array.from(this.routeTree.keys());
  }

  private decorateSetters() {
    this.onBeforeHandle((ctx) => {
      ctx.status = ctx.setStatus = (status) => {
        ctx.set.status = status;

        return ctx;
      };

      ctx.setCookie = (key, value) => {
        ctx.cookie[key].set(value);

        return ctx;
      };

      ctx.setHeader = (key, value) => {
        ctx.set.headers[key] = value;

        return ctx;
      };

      const originalRedirect = ctx.redirect;
      ctx.redirect = <const Route extends AvailableRoutes>(
        url: Route | string,
        paramsOrStatus?:
          | (Route extends `${string}/${":" | "*"}${string}`
              ? Record<GetPathParameter<Route>, string>
              : never)
          | number,
        status?: number
      ) => {
        let newUrl: string = url;

        if (typeof paramsOrStatus === "object") {
          for (const [key, value] of Object.entries(paramsOrStatus)) {
            newUrl = url.replaceAll(`:${key}`, value);
          }
        } else {
          status = paramsOrStatus;
        }

        console.log(newUrl);

        return originalRedirect(newUrl, status);
      };

      ctx.json = (data) => {
        ctx.set.headers["Content-Type"] = "application/json";

        return new Response(JSON.stringify(data), {
          status: (ctx.set.status as number) ?? 200,
          headers: ctx.set.headers,
        });
      };
    });
  }

  private async loadRoutes() {
    const routes = await import("@configs/routes");

    if (!routes.default) {
      throw new Error("No routes found");
    }

    for (const [, router] of Object.entries(routes.default)) {
      this.use(router.build());
    }
  }

  private debug() {
    this.onBeforeHandle((ctx) => {
      ctx.debugId = this.utils.randomId(6);
      ctx.debugTime = Date.now();
    });

    this.onAfterHandle(async (ctx) => {
      console.log(
        `🦊 [${ctx.debugId}] ${ctx.request.method} ${ctx.request.url} took ${
          Date.now() - ctx.debugTime!
        }ms`
      );
      console.log(await ctx.response);
    });
  }
}
