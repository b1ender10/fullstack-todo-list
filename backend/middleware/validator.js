import { body, param, validationResult, query } from 'express-validator';
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
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.titleRequired)
    .isLength({ min: config.titleMinLength, max: config.titleMaxLength })
    .withMessage(config.messages.validation.titleLength)
    .escape(),
  body('description')
    .optional()
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .isLength({ max: config.descriptionMaxLength })
    .withMessage(config.messages.validation.descriptionLength)
    .escape(),
  body('priority')
    .optional()
    .isInt({ min: config.priorityMin, max: config.priorityMax })
    .withMessage(config.messages.validation.priorityInvalid)
    .toInt(),
  handleValidationErrors
];

// Валидация для обновления задачи
export const validateUpdateTodo = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid),
  body('title')
    .optional()
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.titleEmpty)
    .isLength({ min: config.titleMinLength, max: config.titleMaxLength })
    .withMessage(config.messages.validation.titleLength)
    .escape(),
  body('description')
    .optional()
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .isLength({ max: config.descriptionMaxLength })
    .withMessage(config.messages.validation.descriptionLength)
    .escape(),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage(config.messages.validation.completedInvalid)
    .toBoolean(),
  body('priority')
    .optional()
    .isInt({ min: config.priorityMin, max: config.priorityMax })
    .withMessage(config.messages.validation.priorityInvalid)
    .toInt(),
  handleValidationErrors
];

// Валидация ID в параметрах
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid),
  handleValidationErrors
];

// Валидация categoryId в параметрах
export const validateCategoryId = [
  param('categoryId')
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid),
  handleValidationErrors
];

export const validateBatchDelete = [
  body('ids')
    .isArray()
    .withMessage(config.messages.validation.invalidType)
    .notEmpty()
    .withMessage(config.messages.validation.emptyArray)
    .custom((value) => {
      console.log(value);
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage(config.messages.validation.idInvalid),
  handleValidationErrors
]

export const validateSearchTodos = [
  query('q')
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.emptyString)
    .escape(),
  handleValidationErrors
]

export const validateGetAllTodos = [
  query('completed')
    .optional()
    .isBoolean()
    .withMessage(config.messages.validation.completedInvalid)
    .toBoolean(),
  query('priority')
    .optional()
    .isInt({ min: config.priorityMin, max: config.priorityMax })
    .withMessage(config.messages.validation.priorityInvalid)
    .toInt(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.pageInvalid)
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.limitInvalid)
    .toInt(),
  query('sortBy')
    .optional()
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.emptyString)
    .isIn(['title', 'created_at', 'priority', 'completed'])
    .withMessage('sortBy must be one of: title, created_at, priority, completed'),
  query('sortOrder')
    .optional()
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.emptyString)
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage(config.messages.validation.idInvalid)
    .toInt(),
  handleValidationErrors
]

export const validateCreateCategory = [
  body('name')
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.emptyString)
    .escape(),
  body('color')
    .isString()
    .withMessage(config.messages.validation.invalidType)
    .trim()
    .notEmpty()
    .withMessage(config.messages.validation.emptyString)
    .escape(),
  handleValidationErrors
]