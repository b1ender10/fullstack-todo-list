import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database.js';
import todoRoutes from './routes/todoRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config/constants.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || config.defaultPort;

// Middleware
app.use(cors()); // Разрешаем запросы с фронтенда
app.use(express.json()); // Парсим JSON в теле запроса
app.use(express.urlencoded({ extended: true })); // Парсим URL-encoded данные

// Логирование HTTP запросов (пример использования winston)
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${durationMs.toFixed(2)}ms`
    });
  });
  next();
});

// Роуты
app.use(config.apiBasePath, todoRoutes);

// Health check endpoint
app.get(config.healthCheckPath, (req, res) => {
  res.json({ status: 'OK', message: config.messages.server.running });
});

// Обработка 404
app.use(notFoundHandler);

// Обработка ошибок (должен быть последним)
app.use(errorHandler);

// Запуск сервера
const startServer = async () => {
  try {
    // Инициализируем базу данных
    await initDatabase();

    // Запускаем сервер
    app.listen(PORT, () => {
      logger.info(`🚀 Сервер запущен на http://localhost:${PORT}`);
      logger.info(`📝 API доступен по адресу http://localhost:${PORT}${config.apiBasePath}`);
    });
  } catch (error) {
    logger.error('❌ Ошибка при запуске сервера', error);
    process.exit(1);
  }
};

startServer();

