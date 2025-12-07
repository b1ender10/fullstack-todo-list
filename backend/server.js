import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { initDatabase } from './config/database.js';
import todoRoutes from './routes/todoRoutes.js';
import categoriesRoutes from './routes/categoriesRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config/constants.js';
import logger from './utils/logger.js';
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv';
import { db } from './config/database.js';

import swaggerJsdoc from 'swagger-jsdoc';
import { dirname, join } from 'path';

const swaggerDirname = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo CRUD API',
      version: '1.0.0',
      description: 'REST API для управления задачами (todos)',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Todo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID задачи'
            },
            title: {
              type: 'string',
              description: 'Название задачи',
              minLength: 1,
              maxLength: 200
            },
            description: {
              type: 'string',
              description: 'Описание задачи',
              maxLength: 1000
            },
            completed: {
              type: 'boolean',
              description: 'Статус выполнения'
            },
            priority: {
              type: 'integer',
              enum: [1, 2, 3],
              description: 'Приоритет (1-низкий, 2-средний, 3-высокий)'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Дата удаления (для soft delete)'
            },
            categories: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category'
              },
              description: 'Список категорий задачи'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID категории'
            },
            name: {
              type: 'string',
              description: 'Название категории'
            },
            color: {
              type: 'string',
              description: 'Цвет категории'
            }
          }
        }
      }
    }
  },
  apis: [join(swaggerDirname, './routes/*.js')], // files containing annotations
};

const openapiSpecification = swaggerJsdoc(options);


dotenv.config();

const app = express();
const PORT = process.env.PORT || config.defaultPort;
const version = '1.0.0';

// Счетчики для метрик
const metrics = {
  requests: {
    total: 0,
    byMethod: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 },
    byStatus: {}
  },
  responseTimes: []
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  limit: 100, // 100 запросов за окно
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(config.httpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      message: config.messages.errors.rateLimit
    });
  }
});

app.use(limiter);

// Middleware
app.use(cors()); // Разрешаем запросы с фронтенда
app.use(express.json()); // Парсим JSON в теле запроса
app.use(express.urlencoded({ extended: true })); // Парсим URL-encoded данные


import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger.json';

console.log(openapiSpecification);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Логирование HTTP запросов и сбор метрик
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  
  // Собираем метрики
  metrics.requests.total++;
  const method = req.method;
  if (metrics.requests.byMethod[method] !== undefined) {
    metrics.requests.byMethod[method]++;
  }
  
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    
    // Логирование
    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${durationMs.toFixed(2)}ms`
    });
    
    // Сбор метрик
    const status = res.statusCode.toString();
    metrics.requests.byStatus[status] = (metrics.requests.byStatus[status] || 0) + 1;
    metrics.responseTimes.push(durationMs);
    
    // Храним только последние 1000 значений для экономии памяти
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }
  });
  next();
});

// Роуты
app.use(config.apiBasePath, todoRoutes);
app.use(config.apiBasePathCategories, categoriesRoutes);

// Health check endpoint
app.get(config.healthCheckPath, async (req, res) => {
  try {
    const result = await db.get('SELECT 1');
    if (!result) {
      return res.status(config.httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'ERROR',
        database: 'disconnected',
        message: config.messages.errors.database
      });
    }
    
    res.json({
      status: 'OK',
      message: config.messages.server.running,
      version: version,
      uptime_seconds: Math.round(process.uptime()),
      database: 'connected'
    });
  } catch (error) {
    res.status(config.httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'ERROR',
      database: 'disconnected',
      message: config.messages.errors.database,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Метрики БД
    const dbMetrics = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM todos WHERE deleted_at IS NULL) as total_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = 1 AND deleted_at IS NULL) as completed_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = 0 AND deleted_at IS NULL) as pending_todos,
        (SELECT COUNT(*) FROM todos WHERE deleted_at IS NOT NULL) as deleted_todos,
        (SELECT COUNT(*) FROM categories) as total_categories
    `);
    
    // Распределение по приоритетам
    const priorityDistribution = await db.all(`
      SELECT priority, COUNT(*) as count 
      FROM todos 
      WHERE deleted_at IS NULL 
      GROUP BY priority
    `);
    
    // Среднее время ответа
    const avgResponseTime = metrics.responseTimes.length > 0
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0;
    
    // Использование памяти
    const memoryUsage = process.memoryUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      version: version,
      uptime_seconds: Math.round(process.uptime()),
      
      database: {
        total_todos: dbMetrics.total_todos,
        completed_todos: dbMetrics.completed_todos,
        pending_todos: dbMetrics.pending_todos,
        deleted_todos: dbMetrics.deleted_todos,
        total_categories: dbMetrics.total_categories,
        priority_distribution: priorityDistribution.reduce((acc, row) => {
          acc[`priority_${row.priority}`] = row.count;
          return acc;
        }, {})
      },
      
      performance: {
        total_requests: metrics.requests.total,
        requests_by_method: metrics.requests.byMethod,
        requests_by_status: metrics.requests.byStatus,
        avg_response_time_ms: Math.round(avgResponseTime * 100) / 100,
        min_response_time_ms: metrics.responseTimes.length > 0 
          ? Math.round(Math.min(...metrics.responseTimes) * 100) / 100 
          : 0,
        max_response_time_ms: metrics.responseTimes.length > 0 
          ? Math.round(Math.max(...metrics.responseTimes) * 100) / 100 
          : 0
      },
      
      system: {
        memory: {
          heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
          rss_mb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
        },
        node_version: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    logger.error('Ошибка при получении метрик', error);
    res.status(config.httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Ошибка при получении метрик',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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

// Запускаем сервер только если файл запущен напрямую, а не импортирован
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(__filename);

if (isMainModule) {
  startServer();
}

export default app;

