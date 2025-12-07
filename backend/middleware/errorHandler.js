import { config } from '../config/constants.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// Middleware для обработки ошибок
export const errorHandler = (err, req, res, next) => {
  logger.error('Ошибка обработана errorHandler', {
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  // Ошибка базы данных
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(config.httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: config.messages.errors.database,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Ошибка валидации (если не обработана ранее)
  if (err.name === 'ValidationError') {
    return res.status(config.httpStatus.BAD_REQUEST).json({
      success: false,
      message: config.messages.errors.validation,
      error: err.message
    });
  }

  // Общая ошибка сервера
  res.status(err.status || config.httpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || config.messages.errors.internal,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware для обработки 404
export const notFoundHandler = (req, res) => {
  res.status(config.httpStatus.NOT_FOUND).json({
    success: false,
    message: config.messages.errors.notFound(req.method, req.path)
  });
};

