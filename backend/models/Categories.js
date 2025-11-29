import { db } from '../config/database.js';
import { config } from '../config/constants.js';

// Модель Todo - содержит методы для работы с данными
export class Categories {
  // Получить все задачи
  static async getAll() {
    const query = `SELECT * FROM categories ORDER BY name ASC`;
    const categoriesResponse = await db.all(query);
    

    return {
      data: categoriesResponse,
    }
  }

  static async getById(id) {
    const query = `SELECT * FROM categories WHERE id = ?`;
    const categoryResponse = await db.get(query, [id]);
    return categoryResponse;
  }

  static async create(name, color) {
    const query = `INSERT INTO categories (name, color) VALUES (?, ?)`;
    const result = await db.run(query, [name, color]);
    return this.getById(result.lastID);
  }

  static async delete(id) {
    const query = `DELETE FROM categories WHERE id = ?`;
    const result = await db.run(query, [id]);
    return result.changes > 0;
  }
}

