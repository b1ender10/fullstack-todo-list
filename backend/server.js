import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database.js';
import todoRoutes from './routes/todoRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config/constants.js';

const app = express();
const PORT = process.env.PORT || config.defaultPort;

// Middleware
app.use(cors()); // Разрешаем запросы с фронтенда
app.use(express.json()); // Парсим JSON в теле запроса
app.use(express.urlencoded({ extended: true })); // Парсим URL-encoded данные

// Логирование запросов (простое)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
      console.log(`📝 API доступен по адресу http://localhost:${PORT}${config.apiBasePath}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer();

