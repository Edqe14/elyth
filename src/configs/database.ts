const database = {
  debug: false,

  defaultConnection: "default",

  connection: {
    default: {
      resolver: async () => {},
    },
  },
} as const;

export default database;
