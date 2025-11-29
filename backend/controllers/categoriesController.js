import { config } from '../config/constants.js';
import CategoriesService from '../services/categoriesService.js';

// Контроллер - обрабатывает HTTP запросы и вызывает методы модели

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await CategoriesService.getAllCategories();

    res.json({
      success: true,
      data: categories,
      message: config.messages.todo.categories
    })

  } catch (error) {
    next(error);
  }
}

export const createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const category = await CategoriesService.createCategory(name, color);
    res.json({
      success: true,
      data: category,
      message: config.messages.category.created
    })
  } catch (error) {
    next(error);
  }
}

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await CategoriesService.deleteCategory(id);
    res.json({
      success: true,
      data: category,
      message: config.messages.category.deleted
    })
  } catch (error) {
    next(error);
  }
}