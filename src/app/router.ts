import Elysia, { Handler, RouteSchema } from "elysia";
import type { App, AppBaseTypes } from ".";
import type { Controller } from "./http/controllers/controller";
import type { Middleware } from "./middleware";

export class Router<
  BaseTypes extends AppBaseTypes = AppBaseTypes,
  Prefix extends string = "",
  in out Routes extends { [key: string]: string } = {}
> {
  public readonly app: App;
  private elysia: Elysia<Prefix, false, BaseTypes>;

  constructor(
    app: App,
    decorators: BaseTypes["decorator"],
    prefix?: Prefix,
    elysia?: Elysia<Prefix, false, BaseTypes>
  ) {
    this.app = app;
    this.elysia = elysia ?? new Elysia<Prefix, false, BaseTypes>({ prefix });

    for (const [key, value] of Object.entries(decorators)) {
      this.elysia.decorate(key as string, value);
    }
  }

  public build() {
    return this.elysia;
  }

  private createControllerHandler<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(handler: [ConstructorOf<ControllerType>, ClassMethod]) {
    return (async (ctx) => {
      const [Controller, method] = handler;
      const controller =
        this.app.cache.get<ControllerType>(Controller.name) ?? new Controller();

      // @ts-ignore
      if (!controller[method]) {
        throw new Error(`Method ${String(method)} not found in controller`);
      }

      // @ts-ignore
      return await controller[method](ctx);
    }) as Handler<Schema, BaseTypes, Path>;
  }

  public get<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(
    path: Path,
    handler:
      | Handler<Schema, BaseTypes, Path>
      | [ConstructorOf<ControllerType>, ClassMethod]
  ) {
    if (Array.isArray(handler)) {
      handler = this.createControllerHandler<
        Schema,
        Path,
        ControllerType,
        ClassMethod
      >(handler);
    }

    this.elysia.get(path, handler as Handler<Schema, BaseTypes, Path>);

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}${Path}`]: K extends keyof Routes
          ? Routes[K] | "get"
          : "get";
      }
    >;
  }

  public post<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(
    path: Path,
    handler:
      | Handler<Schema, BaseTypes, Path>
      | [ConstructorOf<ControllerType>, ClassMethod]
  ) {
    if (Array.isArray(handler)) {
      handler = this.createControllerHandler<
        Schema,
        Path,
        ControllerType,
        ClassMethod
      >(handler);
    }

    this.elysia.post(path, handler as Handler<Schema, BaseTypes, Path>);

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}${Path}`]: K extends keyof Routes
          ? Routes[K] | "post"
          : "post";
      }
    >;
  }

  public put<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(
    path: Path,
    handler:
      | Handler<Schema, BaseTypes, Path>
      | [ConstructorOf<ControllerType>, ClassMethod]
  ) {
    if (Array.isArray(handler)) {
      handler = this.createControllerHandler<
        Schema,
        Path,
        ControllerType,
        ClassMethod
      >(handler);
    }

    this.elysia.put(path, handler as Handler<Schema, BaseTypes, Path>);

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}${Path}`]: K extends keyof Routes
          ? Routes[K] | "put"
          : "put";
      }
    >;
  }

  public patch<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(
    path: Path,
    handler:
      | Handler<Schema, BaseTypes, Path>
      | [ConstructorOf<ControllerType>, ClassMethod]
  ) {
    if (Array.isArray(handler)) {
      handler = this.createControllerHandler<
        Schema,
        Path,
        ControllerType,
        ClassMethod
      >(handler);
    }

    this.elysia.patch(path, handler as Handler<Schema, BaseTypes, Path>);

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}${Path}`]: K extends keyof Routes
          ? Routes[K] | "patch"
          : "patch";
      }
    >;
  }

  public delete<
    Schema extends RouteSchema = {},
    Path extends string = "",
    ControllerType extends Controller = Controller,
    ClassMethod extends
      | ClassMethodNames<ControllerType>
      | string = ClassMethodNames<ControllerType>
  >(
    path: Path,
    handler:
      | Handler<Schema, BaseTypes, Path>
      | [ConstructorOf<ControllerType>, ClassMethod]
  ) {
    if (Array.isArray(handler)) {
      handler = this.createControllerHandler<
        Schema,
        Path,
        ControllerType,
        ClassMethod
      >(handler);
    }

    this.elysia.delete(path, handler as Handler<Schema, BaseTypes, Path>);

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}${Path}`]: K extends keyof Routes
          ? Routes[K] | "delete"
          : "delete";
      }
    >;
  }

  public group<
    CallbackReturn extends Router<BaseTypes, GroupPrefix, any>,
    GroupPrefix extends string = ""
  >(
    prefix: GroupPrefix,
    callback: (router: Router<BaseTypes, GroupPrefix>) => CallbackReturn
  ) {
    const newRouter = this.createChildRouter(prefix);

    callback(newRouter);

    this.elysia.use(newRouter.build());

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes &
        (CallbackReturn extends Router<BaseTypes, GroupPrefix, infer R>
          ? { [K in keyof R as `${Prefix}${string & K}`]: R[K] }
          : never)
    >;
  }

  public middleware(
    handlers: ConstructorOf<Middleware> | ConstructorOf<Middleware>[]
  ) {
    this.elysia.onBeforeHandle(async (ctx) => {
      if (!Array.isArray(handlers)) {
        handlers = [handlers];
      }

      for (const handler of handlers) {
        const handlerInstance =
          this.app.cache.get<Middleware>(handler.name) ?? new handler();
        const response = await handlerInstance.handle(ctx);

        if (response) return response;
      }
    });

    return this;
  }

  public resource<
    Name extends string = "",
    ControllerType extends Controller = Controller
  >(name: Name, controller: ConstructorOf<ControllerType>) {
    this.group(`/${name}`, (group) =>
      group
        .get("/", [controller, "index"])
        .post("/", [controller, "store"])
        .get("/create", [controller, "create"])
        .get("/:id", [controller, "show"])
        .get("/:id/edit", [controller, "edit"])
        .put("/:id", [controller, "update"])
        .patch("/:id", [controller, "update"])
        .delete("/:id", [controller, "destroy"])
    );

    return this as unknown as Router<
      BaseTypes,
      Prefix,
      Routes & {
        [K in `${Prefix}/${Name}`]: "get" | "post";
      } & {
        [K in `${Prefix}/${Name}/create`]: "get";
      } & {
        [K in `${Prefix}/${Name}/:id`]: "get" | "put" | "patch" | "delete";
      } & {
        [K in `${Prefix}/${Name}/:id/edit`]: "get";
      }
    >;
  }

  protected createChildRouter<Prefix extends string = "">(prefix?: Prefix) {
    return new Router<BaseTypes, Prefix>(
      this.app,
      this.elysia.decorator,
      prefix
    );
  }
}

export type ExtractRoutes<R> = R extends Router<any, any, infer Routes>
  ? Routes
  : never;
