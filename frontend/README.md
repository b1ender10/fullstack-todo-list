# To-Do React Frontend

React приложение для работы с To-Do API.

## Структура проекта

```
frontend/
├── src/
│   ├── components/
│   │   ├── TodoForm.jsx      # Форма создания/редактирования
│   │   ├── TodoList.jsx      # Список задач
│   │   └── TodoItem.jsx      # Отдельная задача
│   ├── services/
│   │   └── api.js            # API клиент
│   ├── App.jsx               # Главный компонент
│   ├── main.jsx              # Точка входа
│   └── styles.css            # Стили
├── index.html
├── package.json
└── vite.config.js
```

## Установка и запуск

1. Установи зависимости:
```bash
npm install
```

2. Запусти dev сервер:
```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

3. Собери для production:
```bash
npm run build
```

4. Предпросмотр production сборки:
```bash
npm run preview
```

## Важно

Убедись, что бекенд запущен на `http://localhost:3000`

## Технологии

- React 18
- Vite
- Vanilla CSS

