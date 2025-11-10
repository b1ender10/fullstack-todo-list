# To-Do CRUD Backend

Backend для простого to-do приложения на Node.js + Express + SQLite.

## Структура проекта

```
crud/
├── config/
│   └── database.js          # Настройка и инициализация БД
├── models/
│   └── Todo.js              # Модель данных (работа с БД)
├── controllers/
│   └── todoController.js    # Обработка HTTP запросов
├── routes/
│   └── todoRoutes.js        # Определение маршрутов API
├── middleware/
│   ├── validator.js         # Валидация входных данных
│   └── errorHandler.js      # Обработка ошибок
├── server.js                # Главный файл сервера
└── package.json
```

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Запустите сервер:
```bash
npm start
```

Или в режиме разработки с автоперезагрузкой:
```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

## API Endpoints

### GET /api/todos
Получить все задачи

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Купить молоко",
      "description": "В магазине на углу",
      "completed": false,
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ]
}
```

### GET /api/todos/:id
Получить задачу по ID

### POST /api/todos
Создать новую задачу

**Тело запроса:**
```json
{
  "title": "Купить молоко",
  "description": "В магазине на углу"
}
```

### PUT /api/todos/:id
Обновить задачу

**Тело запроса (все поля опциональны):**
```json
{
  "title": "Купить молоко",
  "description": "В магазине на углу",
  "completed": true
}
```

### DELETE /api/todos/:id
Удалить задачу

## Тестирование API

Можно использовать curl или Postman:

```bash
# Получить все задачи
curl http://localhost:3000/api/todos

# Создать задачу
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Новая задача","description":"Описание"}'

# Обновить задачу
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Удалить задачу
curl -X DELETE http://localhost:3000/api/todos/1
```

## Архитектура

### MVC Pattern

- **Models** (`models/Todo.js`) - работа с данными, бизнес-логика
- **Views** - в нашем случае это JSON ответы (REST API)
- **Controllers** (`controllers/todoController.js`) - обработка HTTP запросов

### Слои приложения

1. **Routes** - определяют URL и методы HTTP
2. **Middleware** - валидация, обработка ошибок
3. **Controllers** - вызывают методы модели и формируют ответ
4. **Models** - работают с базой данных
5. **Database** - SQLite база данных

## База данных

Используется SQLite - файловая база данных. Файл `todos.db` создается автоматически при первом запуске.

Структура таблицы `todos`:
- `id` - уникальный идентификатор (автоинкремент)
- `title` - название задачи (обязательно)
- `description` - описание задачи (опционально)
- `completed` - статус выполнения (0/1, по умолчанию 0)
- `created_at` - дата создания
- `updated_at` - дата последнего обновления

