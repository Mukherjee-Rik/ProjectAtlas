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
    // Comma-separated allowlist, e.g. "https://app.example.com,https://admin.example.com".
    // Empty means "reflect the requesting origin" — see main.ts for the warning.
    origins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
});
