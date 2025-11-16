import { db } from '../config/database.js';
import { config } from '../config/constants.js';

// Модель Todo - содержит методы для работы с данными
export class Todo {
  // Получить все задачи
  static async getAll({ conditions, values, paginationConditions, paginationValues, hasPagination }) {
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const paginationClause = paginationConditions.length > 0 ? ` ${paginationConditions.join(' ')}` : '';
    const query = `SELECT * FROM todos ${whereClause} ORDER BY created_at DESC ${paginationClause}`;
    const todos = await db.all(query, [...values, ...paginationValues]);
    
    // Преобразование данных (boolean для completed)
    const todosResponse = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed) // SQLite хранит boolean как 0/1
    }));

    // Если пагинация не запрашивалась, возвращаем просто массив
    if (!hasPagination) {
      return todosResponse;
    }

    // Если пагинация запрашивалась, возвращаем объект с data и total
    const queryTotalCount = `SELECT COUNT(*) as count FROM todos ${whereClause}`;
    const totalCount = await db.get(queryTotalCount, values);

    return {
      data: todosResponse,
      pagination: {
        total: totalCount.count,
      }
    }
  }

  // Получить задачу по ID
  static async getById(id) {
    const todo = await db.get('SELECT * FROM todos WHERE id = ?', [id]);
    if (!todo) return null;
    return {
      ...todo,
      completed: Boolean(todo.completed)
    };
  }

  // Создать новую задачу
  static async create({ title, description = '', priority }) {
    const result = await db.run(
      'INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)',
      [title, description, priority]
    );
    return this.getById(result.lastID);
  }

  // Обновить задачу
  static async update(id, { updates, values }) {
    await db.run(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  // Удалить задачу
  static async delete(id) {
    // Сначала получаем задачу, чтобы вернуть её после удаления
    const todo = await this.getById(id);
    if (!todo) return null;
    
    // Удаляем задачу из БД
    await db.run('DELETE FROM todos WHERE id = ?', [id]);
    
    // Возвращаем удаленную задачу
    return todo;
  }
}

