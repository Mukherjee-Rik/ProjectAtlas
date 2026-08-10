export const configuration = () => ({
  app: {
    name: process.env.APP_NAME ?? 'Atlas API',
    version: process.env.APP_VERSION ?? '1.0.0',
  },

  nodeEnv: process.env.NODE_ENV ?? 'development',

  port: parseInt(process.env.PORT ?? '3000', 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  },
});
