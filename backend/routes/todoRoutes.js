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


/**
 * @swagger
 * /api/todos/deleted:
 *   get:
 *     summary: Получить список удаленных задач
 *     description: Возвращает список всех задач, помеченных как удаленные (soft delete)
 *     tags:
 *       - Todos
 *     responses:
 *       200:
 *         description: Список удаленных задач
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       completed:
 *                         type: boolean
 *                       priority:
 *                         type: integer
 *                       deleted_at:
 *                         type: string
 *                         format: date-time
*/
router.get('/deleted', getAllDeletedTodos);

/**
 * @swagger
 * /api/todos/search:
 *   get:
 *     summary: Поиск задач
 *     description: Поиск задач по заголовку или описанию
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *     responses:
 *       200:
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 */
router.get('/search', validateSearchTodos, searchTodos);

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Получить все задачи
 *     description: Возвращает список задач с поддержкой фильтрации, сортировки и пагинации
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Фильтр по статусу выполнения
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: Фильтр по приоритету (1-низкий, 2-средний, 3-высокий)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Фильтр по категории
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество элементов на странице
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, created_at, priority, completed]
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Направление сортировки
 *     responses:
 *       200:
 *         description: Список задач
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 */
router.get('/', validateGetAllTodos, getAllTodos);

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: Получить задачу по ID
 *     description: Возвращает задачу по указанному ID
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Задача найдена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *       404:
 *         description: Задача не найдена
 */
router.get('/:id', validateId, getTodoById);

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Создать новую задачу
 *     description: Создает новую задачу
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Название задачи
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Описание задачи
 *               priority:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 default: 2
 *                 description: Приоритет (1-низкий, 2-средний, 3-высокий)
 *     responses:
 *       201:
 *         description: Задача создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: integer
 *                   description: ID созданной задачи
 *                 message:
 *                   type: string
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', validateCreateTodo, createTodo);

/**
 * @swagger
 * /api/todos/{id}/categories/{categoryId}:
 *   post:
 *     summary: Добавить категорию к задаче
 *     description: Добавляет категорию к указанной задаче
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория добавлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Задача или категория не найдены
 */
router.post('/:id/categories/:categoryId', validateId, validateCategoryId, addCategoryToTodo);

/**
 * @swagger
 * /api/todos/batch/soft/restore:
 *   put:
 *     summary: Восстановить несколько задач
 *     description: Восстанавливает несколько удаленных задач (убирает пометку deleted_at)
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Массив ID задач для восстановления
 *     responses:
 *       200:
 *         description: Задачи восстановлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Одна или несколько задач не найдены
 */
router.put('/batch/soft/restore', validateBatchDelete, batchSoftDeleteRestoreTodos);

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Обновить задачу
 *     description: Обновляет существующую задачу
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               completed:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Задача обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Задача не найдена
 *       400:
 *         description: Ошибка валидации
 */
router.put('/:id', validateUpdateTodo, updateTodo);

/**
 * @swagger
 * /api/todos/{id}/categories/{categoryId}:
 *   delete:
 *     summary: Удалить категорию из задачи
 *     description: Удаляет категорию из указанной задачи
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Задача или категория не найдены
 */
router.delete('/:id/categories/:categoryId', validateId, validateCategoryId, removeCategoryFromTodo);

/**
 * @swagger
 * /api/todos/batch/soft:
 *   delete:
 *     summary: Удалить несколько задач (soft delete)
 *     description: Помечает несколько задач как удаленные (устанавливает deleted_at)
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Массив ID задач для удаления
 *     responses:
 *       200:
 *         description: Задачи помечены как удаленные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Одна или несколько задач не найдены
 */
router.delete('/batch/soft', validateBatchDelete, batchSoftDeleteTodos);

/**
 * @swagger
 * /api/todos/batch:
 *   delete:
 *     summary: Удалить несколько задач
 *     description: Физически удаляет несколько задач из базы данных
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Массив ID задач для удаления
 *     responses:
 *       200:
 *         description: Задачи удалены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Одна или несколько задач не найдены
 */
router.delete('/batch', validateBatchDelete, batchDeleteTodos);

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Удалить задачу
 *     description: Физически удаляет задачу из базы данных
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Задача удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Задача не найдена
 */
router.delete('/:id', validateId, deleteTodo);

export default router;

