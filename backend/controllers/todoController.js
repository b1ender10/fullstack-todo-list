import { config } from '../config/constants.js';
import TodoService from '../services/todoService.js';

// Контроллер - обрабатывает HTTP запросы и вызывает методы модели

// GET /api/todos - получить все задачи
export const getAllTodos = async (req, res, next) => {
  const { completed, priority, page, limit } = req.query;
  try {
    const result = await TodoService.getAllTodos({ completed, priority, page, limit });
    
    // Service всегда возвращает единый формат { data, pagination }
    res.json({
      success: true,
      data: result.data,
      ...(result.pagination && { pagination: result.pagination })
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/todos/:id - получить задачу по ID
export const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const todo = await TodoService.getTodoById(id);

    // Service выбрасывает ошибку, если задача не найдена
    // Контроллер просто передает результат
    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    // Обработка ошибки "Todo not found" - возвращаем 404
    if (error.message === 'Todo not found') {
      return res.status(config.httpStatus.NOT_FOUND).json({
        success: false,
        message: config.messages.todo.notFound
      });
    }
    next(error);
  }
};

// POST /api/todos - создать новую задачу
export const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;

    const onlyLettersAndNumbersAndSpaces = /^[a-zA-Z0-9\s]+$/;
    const onlyNumbers = /^[0-9]+$/;
    if (!onlyLettersAndNumbersAndSpaces.test(title)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }

    if (!onlyLettersAndNumbersAndSpaces.test(description)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }

    if (!onlyNumbers.test(priority)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }
    
    const todo = await TodoService.createTodo({ title, description, priority });

    res.status(config.httpStatus.CREATED).json({
      success: true,
      data: todo,
      message: config.messages.todo.created
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/todos/:id - обновить задачу
export const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority } = req.body;

    const onlyLettersAndNumbersAndSpaces = /^[a-zA-Z0-9\s]+$/;
    const onlyNumbers = /^[0-9]+$/;
    if (!onlyLettersAndNumbersAndSpaces.test(title)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }

    if (!onlyLettersAndNumbersAndSpaces.test(description)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }

    if (!onlyNumbers.test(priority)) {
      return res.status(config.httpStatus.BAD_REQUEST).json({
        success: false,
        message: config.messages.validation.invalidType
      });
    }

    // Service проверяет существование задачи и валидирует данные
    const todo = await TodoService.updateTodo(id, { title, description, completed, priority });

    res.json({
      success: true,
      data: todo,
      message: config.messages.todo.updated
    });
  } catch (error) {
    // Обработка ошибки "Todo not found" - возвращаем 404
    if (error.message === 'Todo not found') {
      return res.status(config.httpStatus.NOT_FOUND).json({
        success: false,
        message: config.messages.todo.notFound
      });
    }
    next(error);
  }
};

// DELETE /api/todos/:id - удалить задачу
export const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Service проверяет существование задачи и валидирует ID
    const todo = await TodoService.deleteTodo(id);

    res.json({
      success: true,
      data: todo,
      message: config.messages.todo.deleted
    });
  } catch (error) {
    // Обработка ошибки "Todo not found" - возвращаем 404
    if (error.message === 'Todo not found') {
      return res.status(config.httpStatus.NOT_FOUND).json({
        success: false,
        message: config.messages.todo.notFound
      });
    }
    next(error);
  }
};

export const batchDeleteTodos = async (req, res, next) => {
  try {
    const { ids } = req.body;

    const todos = await TodoService.batchDeleteTodos(ids);

    res.json({
      success: true,
      data: todos,
      message: config.messages.todo.deleted
    });
  } catch (error) {
    // Обработка ошибки "Todos not found" - возвращаем 404
    if (error.message.includes('not found')) {
      return res.status(config.httpStatus.NOT_FOUND).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}