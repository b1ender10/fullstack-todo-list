import express from 'express';
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo
} from '../controllers/todoController.js';
import {
  validateCreateTodo,
  validateUpdateTodo,
  validateId
} from '../middleware/validator.js';

const router = express.Router();

// GET /api/todos - получить все задачи
router.get('/', getAllTodos);

// GET /api/todos/:id - получить задачу по ID
router.get('/:id', validateId, getTodoById);

// POST /api/todos - создать новую задачу
router.post('/', validateCreateTodo, createTodo);

// PUT /api/todos/:id - обновить задачу
router.put('/:id', validateUpdateTodo, updateTodo);

// DELETE /api/todos/:id - удалить задачу
router.delete('/:id', validateId, deleteTodo);

export default router;

