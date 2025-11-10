// Middleware для обработки ошибок
export const errorHandler = (err, req, res, next) => {
  console.error('Ошибка:', err);

  // Ошибка базы данных
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка базы данных',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Ошибка валидации (если не обработана ранее)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      error: err.message
    });
  }

  // Общая ошибка сервера
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware для обработки 404
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Маршрут ${req.method} ${req.path} не найден`
  });
};

