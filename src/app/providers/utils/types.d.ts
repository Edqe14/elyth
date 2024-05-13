declare type ConstructorOf<Class> = {
  new (...args: any): Class;
  // include static methods
};

declare type ConstructorOfSingleton<Class> = {
  new (): Class;
  // include static methods
  public getInstance(): Class;
};

declare type ClassMethodNames<Class> = {
  [K in keyof Class]: Class[K] extends Function ? K : never;
}[keyof Class];

declare type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

declare type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

declare type Promisable<T> = T | Promise<T>;
declare type Writeable<T> = { -readonly [P in keyof T]: Writeable<T[P]> };
