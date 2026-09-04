import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_NAME: Joi.string().default('Kafei API'),

  APP_VERSION: Joi.string().default('1.0.0'),

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Comma-separated list of allowed browser origins.
  CORS_ORIGIN: Joi.string().optional(),
});
