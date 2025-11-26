import { db } from '../config/database.js';
import { config } from '../config/constants.js';

// Модель Todo - содержит методы для работы с данными
export class Todo {
  // Получить все задачи
  static async getAll({ conditions, values, paginationConditions, paginationValues, hasPagination, sortCondition }) {
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const paginationClause = paginationConditions.length > 0 ? ` ${paginationConditions.join(' ')}` : '';
    const query = `SELECT * FROM todos ${whereClause} ${sortCondition} ${paginationClause}`;
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
    const todo = await db.get('SELECT * FROM todos WHERE id = ? AND deleted_at IS NULL', [id]);
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

  static async batchDelete(ids) {
    // Начинаем транзакцию
    await db.run('BEGIN TRANSACTION');

    try {
      // Получаем все задачи одним запросом перед удалением
      const placeholders = ids.map(() => '?').join(',');
      const todosToDelete = await db.all(
        `SELECT * FROM todos WHERE id IN (${placeholders})`,
        ids
      );

      // Проверяем, что все запрошенные ID найдены (принцип "все или ничего")
      if (todosToDelete.length !== ids.length) {
        const foundIds = todosToDelete.map(t => t.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));
        throw new Error(`Todos with IDs [${missingIds.join(', ')}] not found`);
      }

      // Удаляем все задачи одним запросом
      await db.run(
        `DELETE FROM todos WHERE id IN (${placeholders})`,
        ids
      );

      // Коммитим транзакцию
      await db.run('COMMIT');

      // Преобразуем данные (boolean для completed)
      return todosToDelete.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed)
      }));
    } catch (error) {
      // Откатываем транзакцию при ошибке
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        // Логируем ошибку отката, но пробрасываем оригинальную ошибку
        console.error('Ошибка при откате транзакции:', rollbackError);
      }
      // Пробрасываем оригинальную ошибку дальше
      throw error;
    }
  }

  static async batchSoftDelete(ids) {
    // Начинаем транзакцию
    await db.run('BEGIN TRANSACTION');

    try {
      // Получаем все задачи одним запросом перед удалением
      const placeholders = ids.map(() => '?').join(',');
      const todosToDelete = await db.all(
        `SELECT * FROM todos WHERE id IN (${placeholders})`,
        ids
      );

      // Проверяем, что все запрошенные ID найдены (принцип "все или ничего")
      if (todosToDelete.length !== ids.length) {
        const foundIds = todosToDelete.map(t => t.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));
        throw new Error(`Todos with IDs [${missingIds.join(', ')}] not found`);
      }

      // Добавляем дату удаления (текущее время)
      await db.run(
        `UPDATE todos SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        ids
      );

      // Коммитим транзакцию
      await db.run('COMMIT');

      // Преобразуем данные (boolean для completed)
      return todosToDelete.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed)
      }));

    } catch (error) {
       // Откатываем транзакцию при ошибке
       try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        // Логируем ошибку отката, но пробрасываем оригинальную ошибку
        console.error('Ошибка при откате транзакции:', rollbackError);
      }
      // Пробрасываем оригинальную ошибку дальше
      throw error;
    }

  }

  static async batchSoftDeleteRestore(ids) {
    // Начинаем транзакцию
    await db.run('BEGIN TRANSACTION');

    try {
      // Получаем все задачи одним запросом перед удалением
      const placeholders = ids.map(() => '?').join(',');
      
      const todosToDelete = await db.all(
        `SELECT * FROM todos WHERE id IN (${placeholders})`,
        ids
      );

      // Проверяем, что все запрошенные ID найдены (принцип "все или ничего")
      if (todosToDelete.length !== ids.length) {
        const foundIds = todosToDelete.map(t => t.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));
        throw new Error(`Todos with IDs [${missingIds.join(', ')}] not found`);
      }

      // placeholders уже строка, не нужно .join()
      const sql = `UPDATE todos SET deleted_at = NULL WHERE id IN (${placeholders})`;

      // Добавляем дату удаления (текущее время)
      await db.run(
        sql,
        ids
      );

      // Коммитим транзакцию
      await db.run('COMMIT');

      // Преобразуем данные (boolean для completed)
      return todosToDelete.map(todo => ({
        ...todo,
        completed: Boolean(todo.completed)
      }));

    } catch (error) {
       // Откатываем транзакцию при ошибке
       try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        // Логируем ошибку отката, но пробрасываем оригинальную ошибку
        console.error('Ошибка при откате транзакции:', rollbackError);
      }
      // Пробрасываем оригинальную ошибку дальше
      throw error;
    }

  }

  static async searchTodos(q) {
    const whereClause = `WHERE (title LIKE ? OR description LIKE ?) AND deleted_at IS NULL`;
    const query = `SELECT * FROM todos ${whereClause} ORDER BY created_at DESC`;
    const todos = await db.all(query, [`%${q.q}%`, `%${q.q}%`]);
    
    // Преобразование данных (boolean для completed)
    const todosResponse = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed) // SQLite хранит boolean как 0/1
    }));

    return todosResponse;
  }
}

