import { Context, CookieOptions, Elysia, SingletonBase } from "elysia";
import { ConfigProvider } from "@providers/config";
import { UtilsProvider } from "@providers/utils";
import { MemoryCacheProvider } from "@providers/cache";
import { Router } from "./router";
import type { GetPathParameter } from "elysia/dist/types";
import type { AvailableRoutes } from "@configs/routes";
import type { Response as BunResponse } from "bun-types/fetch";
import { LoggerLevel, LoggerProvider } from "@providers/logger";
import staticPlugin from "@elysiajs/static";
import { Html, html } from "@elysiajs/html";

export type AppBaseTypes = SingletonBase & {
  decorator: {
    config: ConfigProvider;
    utils: typeof UtilsProvider;
    cache: MemoryCacheProvider;
    logger: LoggerProvider;
    render: <T extends (props: any) => JSX.Element>(
      ...args: Parameters<T>[0] extends undefined
        ? [component: T]
        : [component: T, data: Parameters<T>[0]]
    ) => Promise<BunResponse>;
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
  public readonly configurations = new ConfigProvider("@/configs");
  public readonly utils = UtilsProvider;
  public readonly cache = new MemoryCacheProvider();
  public readonly logger = new LoggerProvider();

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
    this.decorate("logger", this.logger);
    this.decorateSetters();

    this.use(staticPlugin());
    this.use(html());

    // Load configurations
    this.configurations.load("app");

    if (this.configurations.get<boolean>("app.debug")) {
      this.debug();
      this.logger.setLevel(LoggerLevel.DEBUG);
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
            newUrl = url.replaceAll(`:${key}`, value as any);
          }
        } else {
          status = paramsOrStatus;
        }

        return originalRedirect(newUrl, status);
      };

      ctx.json = (data) => {
        ctx.setHeader("Content-Type", "application/json");

        return new Response(JSON.stringify(data), {
          status: (ctx.set.status as number) ?? 200,
          headers: ctx.set.headers,
        });
      };

      ctx.render = (async (View, data) => {
        const body: string = await Html.createElement(View, data);

        ctx.setHeader("Content-Type", "text/html");

        return new Response(body, {
          status: (ctx.set.status as number) ?? 200,
          headers: ctx.set.headers,
        });
      }) as typeof ctx.render;
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
      const formatMethod =
        this.logger.httpMethodColors[
          ctx.request.method as keyof typeof this.logger.httpMethodColors
        ];

      const debugId = this.logger.color.yellow(ctx.debugId);
      const url = this.logger.color.dim(ctx.request.url);
      const time = this.logger.color.yellow(Date.now() - ctx.debugTime!);

      this.logger.debug(
        `[${debugId}] ${formatMethod(ctx.request.method)} ${url} took ${time}ms`
      );
    });
  }
}
