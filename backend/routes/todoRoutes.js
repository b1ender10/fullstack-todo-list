import express from 'express';
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  batchDeleteTodos,
  batchSoftDeleteTodos,
  batchSoftDeleteRestoreTodos,
  getAllDeletedTodos,
  searchTodos,
  addCategoryToTodo,
  removeCategoryFromTodo,
} from '../controllers/todoController.js';
import {
  validateCreateTodo,
  validateUpdateTodo,
  validateId,
  validateCategoryId,
  validateBatchDelete,
  validateSearchTodos,
  validateGetAllTodos
} from '../middleware/validator.js';
const router = express.Router();

// GET /api/todos/deleted - получить все удаленные задачи
router.get('/deleted', getAllDeletedTodos);

// GET /api/todos/search - поиск задач по заголовку или описанию, принимает query параметр q
router.get('/search', validateSearchTodos, searchTodos);

// GET /api/todos - получить все задачи
router.get('/', validateGetAllTodos, getAllTodos);

// GET /api/todos/:id - получить задачу по ID
router.get('/:id', validateId, getTodoById);

// POST /api/todos - создать новую задачу
router.post('/', validateCreateTodo, createTodo);

// POST /api/todos/:id/categories/:categoryId - добавить категорию к задаче
router.post('/:id/categories/:categoryId', validateId, validateCategoryId, addCategoryToTodo);

// PUT /api/todos/batch/soft/restore - восстановить несколько задач (пометить) (должен быть ПЕРЕД /:id!)
router.put('/batch/soft/restore', validateBatchDelete, batchSoftDeleteRestoreTodos);

// PUT /api/todos/:id - обновить задачу
router.put('/:id', validateUpdateTodo, updateTodo);

// DELETE /api/todos/:id/categories/:categoryId - удалить категорию к задаче
router.delete('/:id/categories/:categoryId', validateId, validateCategoryId, removeCategoryFromTodo);

// DELETE /api/todos/batch/soft - удалить несколько задач (пометить) (должен быть ПЕРЕД /:id!)
router.delete('/batch/soft', validateBatchDelete, batchSoftDeleteTodos);

// DELETE /api/todos/batch - удалить несколько задач (должен быть ПЕРЕД /:id!)
router.delete('/batch', validateBatchDelete, batchDeleteTodos);

// DELETE /api/todos/:id - удалить задачу
router.delete('/:id', validateId, deleteTodo);

export default router;

