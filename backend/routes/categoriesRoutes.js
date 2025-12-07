import express from 'express';
import {
  getAllCategories,
  createCategory,
  deleteCategory
} from '../controllers/categoriesController.js';
import {
  validateId,
  validateCreateCategory
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Получить все категории
 *     description: Возвращает список всех категорий, отсортированных по имени
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Список категорий
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
 *                     $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Создать новую категорию
 *     description: Создает новую категорию с указанным именем и цветом
 *     tags:
 *       - Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название категории
 *                 example: Работа
 *               color:
 *                 type: string
 *                 description: Цвет категории (hex код или название)
 *                 example: "#FF5733"
 *     responses:
 *       200:
 *         description: Категория создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', validateCreateCategory, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Удалить категорию
 *     description: Физически удаляет категорию из базы данных
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   type: boolean
 *                   description: Результат удаления
 *                 message:
 *                   type: string
 *       404:
 *         description: Категория не найдена
 *       400:
 *         description: Ошибка валидации ID
 */
router.delete('/:id', validateId, deleteCategory);

export default router;

