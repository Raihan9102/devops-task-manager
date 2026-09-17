'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const taskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).optional().allow(''),
  status: Joi.string().valid('todo', 'in_progress', 'done', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  dueDate: Joi.date().iso().optional().allow(null),
  tags: Joi.array().items(Joi.string()).optional(),
});

const taskUpdateSchema = taskSchema.fork(
  ['title'],
  (schema) => schema.optional()
);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return res.status(422).json({ status: 'fail', message: 'Validation failed', errors });
  }
  req.body = value;
  next();
};

module.exports = { validate, registerSchema, loginSchema, taskSchema, taskUpdateSchema };
