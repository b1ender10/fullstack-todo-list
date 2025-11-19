import { body, param, validationResult } from 'express-validator';
import { config } from '../config/constants.js';

// Middleware для обработки ошибок валидации
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(config.httpStatus.BAD_REQUEST).json({
      success: false,
      message: config.messages.validation.general,
      errors: errors.array()
    });
  }
  next();
};

// Валидация для создания задачи
export const validateCreateTodo = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.titleRequired)
    .isLength({ min: config.titleMinLength, max: config.titleMaxLength })
    .withMessage(config.messages.validation.titleLength)
    .isString()
    .withMessage(config.messages.validation.invalidType),
  body('description')
    .optional()
    .trim()
    .isLength({ max: config.descriptionMaxLength })
    .withMessage(config.messages.validation.descriptionLength)
    .isString()
    .withMessage(config.messages.validation.invalidType),
  body('priority')
    .optional()
    .isInt({ min: config.priorityMin, max: config.priorityMax })
    .withMessage(config.messages.validation.priorityInvalid),
  handleValidationErrors
];

// Валидация для обновления задачи
export const validateUpdateTodo = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.titleEmpty)
    .isLength({ min: config.titleMinLength, max: config.titleMaxLength })
    .withMessage(config.messages.validation.titleLength)
    .isString()
    .withMessage(config.messages.validation.invalidType),
  body('description')
    .optional()
    .trim()
    .isLength({ max: config.descriptionMaxLength })
    .withMessage(config.messages.validation.descriptionLength),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage(config.messages.validation.completedInvalid)
    .isString()
    .withMessage(config.messages.validation.invalidType),
  body('priority')
    .optional()
    .isInt({ min: config.priorityMin, max: config.priorityMax })
    .withMessage(config.messages.validation.priorityInvalid),
  handleValidationErrors
];

// Валидация ID в параметрах
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid),
  handleValidationErrors
];

