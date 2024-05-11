export default {
  port: process.env.PORT || 3000,
  debug: process.env.APP_ENVIRONMENT !== "production" || false,
} as const;
