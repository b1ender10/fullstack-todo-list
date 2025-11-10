import { body, param, validationResult } from 'express-validator';

// Middleware для обработки ошибок валидации
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
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
    .withMessage('Название задачи обязательно')
    .isLength({ min: 1, max: 200 })
    .withMessage('Название должно быть от 1 до 200 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Описание не должно превышать 1000 символов'),
  handleValidationErrors
];

// Валидация для обновления задачи
export const validateUpdateTodo = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным числом'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Название не может быть пустым')
    .isLength({ min: 1, max: 200 })
    .withMessage('Название должно быть от 1 до 200 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Описание не должно превышать 1000 символов'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed должен быть boolean'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Приоритет должен быть числом от 1 до 3'),
  handleValidationErrors
];

// Валидация ID в параметрах
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным числом'),
  handleValidationErrors
];

