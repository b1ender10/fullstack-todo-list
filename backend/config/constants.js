export const config = {
  // Порты и URL
  defaultPort: 3000,
  apiBasePath: '/api/todos',
  healthCheckPath: '/health',
  
  // Значения по умолчанию
  defaultPage: 1,
  defaultLimit: 10,
  defaultPriority: 2,
  
  // Лимиты валидации
  titleMinLength: 1,
  titleMaxLength: 200,
  descriptionMaxLength: 1000,
  priorityMin: 1,
  priorityMax: 3,
  
  // Приоритеты
  priority: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
  },
  
  // HTTP коды
  httpStatus: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  
  // Сообщения
  messages: {
    todo: {
      notFound: 'Задача не найдена',
      created: 'Задача успешно создана',
      updated: 'Задача успешно обновлена',
      deleted: 'Задача успешно удалена'
    },
    validation: {
      titleRequired: 'Название задачи обязательно',
      titleLength: 'Название должно быть от 1 до 200 символов',
      descriptionLength: 'Описание не должно превышать 1000 символов',
      idInvalid: 'ID должен быть положительным числом',
      titleEmpty: 'Название не может быть пустым',
      completedInvalid: 'completed должен быть boolean',
      priorityInvalid: 'Приоритет должен быть числом от 1 до 3',
      general: 'Ошибка валидации',
      invalidType: 'Неверный тип',
    },
    errors: {
      database: 'Ошибка базы данных',
      validation: 'Ошибка валидации',
      internal: 'Внутренняя ошибка сервера',
      notFound: (method, path) => `Маршрут ${method} ${path} не найден`
    },
    server: {
      running: 'Сервер работает'
    }
  }
}
