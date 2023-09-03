/* eslint-disable prettier/prettier */
import * as Joi from 'joi';

/* eslint-disable prettier/prettier */
export const JoiValidationSchema = Joi.object({
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    PORT: Joi.number().default(3000)
})