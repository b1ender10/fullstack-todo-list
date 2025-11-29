import { Categories } from '../models/Categories.js';
import { config } from '../config/constants.js';
import logger from '../utils/logger.js';

class CategoriesService {

    static async getAllCategories() {
        // Вызов модели
        const result = await Categories.getAll();

        return {
            data: result,
        };
    }

    static async createCategory(name, color) {
        // Вызов модели
        const normalizedName = name.trim();
        const normalizedColor = color.trim();
        if (normalizedName.length === 0 || normalizedColor.length === 0) {
            throw new Error('Name and color must be non-empty strings');
        }

        const result = await Categories.create(normalizedName, normalizedColor);

        return {
            data: result,
        };
    }

    static async deleteCategory(id) {
        // Вызов модели
        const normalizedId = Number(id);
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId)) {
            throw new Error('ID must be a positive integer');
        }

        const result = await Categories.delete(normalizedId);

        return {
            data: result,
        };
    }
}

export default CategoriesService;