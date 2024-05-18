import { Context, CookieOptions, Elysia, SingletonBase } from "elysia";
import { Router } from "./router";
import type { GetPathParameter } from "elysia/dist/types";
import type { AvailableRoutes } from "@configs/routes";
import type { Response as BunResponse } from "bun-types/fetch";
import { LoggerLevel } from "@providers/logger";
import staticPlugin from "@elysiajs/static";
import { Html, html } from "@elysiajs/html";
import providers from "./providers";

export type AppBaseTypes = SingletonBase & {
  decorator: {
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
    db: Awaited<ReturnType<typeof providers.database.connection>>["driver"];
  } & typeof providers;
};

export type ContextForRoute<Path extends string = ""> = Context<
  {},
  AppBaseTypes,
  Path
>;

export class App extends Elysia<"", false, AppBaseTypes> {
  public readonly providers = providers;

  constructor() {
    super();
  }

  createRouter<const Prefix extends string = "">(prefix?: Prefix) {
    return new Router<AppBaseTypes, Prefix>(this, this.decorator, prefix);
  }

  async init() {
    Object.entries(providers).forEach(([key, value]) =>
      this.decorate(key, value)
    );
    this.decorate("db", (await providers.database.connection()).driver);
    this.decorateSetters();

    this.use(staticPlugin());
    this.use(html());

    // Load configurations
    this.providers.config.load("app");

    // Default environment configuration
    if (process.env.NODE_ENV === "production") {
      this.providers.logger.setLevel(LoggerLevel.INFO);
      this.providers.config.set("app.environment", "production");
      this.providers.config.set("app.debug", false);
    }

    if (this.providers.config.get<boolean>("app.debug")) {
      this.debug();
      this.providers.logger.setLevel(LoggerLevel.DEBUG);
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
      ctx.debugId = this.providers.utils.randomId(6);
      ctx.debugTime = Date.now();
    });

    this.onAfterHandle(async (ctx) => {
      const formatMethod =
        this.providers.logger.httpMethodColors[
          ctx.request
            .method as keyof typeof this.providers.logger.httpMethodColors
        ];

      const debugId = this.providers.logger.color.yellow(ctx.debugId);
      const url = this.providers.logger.color.dim(ctx.request.url);
      const time = this.providers.logger.color.yellow(
        Date.now() - ctx.debugTime!
      );

      this.providers.logger.debug(
        `[${debugId}] ${formatMethod(ctx.request.method)} ${url} took ${time}ms`
      );
    });
  }
}
