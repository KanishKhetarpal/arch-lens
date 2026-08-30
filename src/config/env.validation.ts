import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  ANALYSIS_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(300),
});
