const Joi = require('joi');
const { z } = require('zod');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ApiError('Validation failed', 400, true, errorMessages));
    }
    next(error);
  }
};

module.exports = validate;