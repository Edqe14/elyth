const database = {
  debug: false,

  migration: {
    schema: "mvc",
    tableName: "migrations",
  },

  defaultConnection: "default",

  connection: {
    default: {
      driver: process.env.DB_DRIVER,

      url: process.env.DB_URL,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.DB_SSL === "true",
    },
  },
} as const;

export default database;
