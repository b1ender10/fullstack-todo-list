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

// GET /api/categories - получить все категории
router.get('/', getAllCategories);

// POST /api/categories - создать новую категорию
router.post('/', validateCreateCategory, createCategory);

// DELETE /api/categories/:id - удалить категорию
router.delete('/:id', validateId, deleteCategory);

export default router;

