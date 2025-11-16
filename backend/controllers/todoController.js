import { Todo } from '../models/Todo.js';

// Контроллер - обрабатывает HTTP запросы и вызывает методы модели

// GET /api/todos - получить все задачи
export const getAllTodos = async (req, res, next) => {
  const { completed, priority, page, limit } = req.query;
  try {
    const result = await Todo.getAll({ completed, priority, page, limit });
    
    // Если результат - массив (пагинация не запрашивалась)
    if (Array.isArray(result)) {
      return res.json({
        success: true,
        data: result
      });
    }
    
    // Если результат - объект с data и pagination
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/todos/:id - получить задачу по ID
export const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const todo = await Todo.getById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/todos - создать новую задачу
export const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;
    const todo = await Todo.create({ title, description, priority });

    res.status(201).json({
      success: true,
      data: todo,
      message: 'Задача успешно создана'
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

    const existingTodo = await Todo.getById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    const todo = await Todo.update(id, { title, description, completed, priority });

    res.json({
      success: true,
      data: todo,
      message: 'Задача успешно обновлена'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/todos/:id - удалить задачу
export const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const todo = await Todo.delete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      data: todo,
      message: 'Задача успешно удалена'
    });
  } catch (error) {
    next(error);
  }
};

