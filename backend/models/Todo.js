import { db } from '../config/database.js';
import { config } from '../config/constants.js';

// Модель Todo - содержит методы для работы с данными
export class Todo {
  // Получить все задачи
  static async getAll({ conditions, values, paginationConditions, paginationValues, hasPagination, sortCondition, categoryId }) {
    // Используем LEFT JOIN для получения всех задач, даже без категорий
    // Если фильтр по категории задан, используем INNER JOIN для фильтрации
    const joinClause = categoryId !== null 
      ? `INNER JOIN todos_categories ON todos.id = todos_categories.todo_id`
      : `LEFT JOIN todos_categories ON todos.id = todos_categories.todo_id`;
    
    if (categoryId !== null) {
      conditions.push('todos_categories.category_id = ?');
      values.push(categoryId);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const paginationClause = paginationConditions.length > 0 ? ` ${paginationConditions.join(' ')}` : '';
    
    // Получаем задачи
    const query = `
      SELECT 
        todos.*
      FROM todos 
      ${joinClause}
      ${whereClause}
      GROUP BY todos.id
      ${sortCondition}
      ${paginationClause}
    `;
    const todos = await db.all(query, [...values, ...paginationValues]);

    // Получаем категории для всех задач
    const todoIds = todos.map(t => t.id);
    let categoriesMap = {};
    if (todoIds.length > 0) {
      const placeholders = todoIds.map(() => '?').join(',');
      const categoriesQuery = `
        SELECT 
          todos_categories.todo_id,
          categories.id,
          categories.name,
          categories.color
        FROM todos_categories
        INNER JOIN categories ON todos_categories.category_id = categories.id
        WHERE todos_categories.todo_id IN (${placeholders})
      `;
      const categories = await db.all(categoriesQuery, todoIds);
      
      // Группируем категории по todo_id
      categories.forEach(cat => {
        if (!categoriesMap[cat.todo_id]) {
          categoriesMap[cat.todo_id] = [];
        }
        categoriesMap[cat.todo_id].push({
          id: cat.id,
          name: cat.name,
          color: cat.color
        });
      });
    }

    // Преобразование данных (boolean для completed, добавляем категории)
    const todosResponse = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed),
      categories: categoriesMap[todo.id] || []
    }));

    // Если пагинация не запрашивалась, возвращаем просто массив
    if (!hasPagination) {
      return todosResponse;
    }

    // Если пагинация запрашивалась, возвращаем объект с data и total
    const countJoinClause = categoryId !== null 
      ? `INNER JOIN todos_categories ON todos.id = todos_categories.todo_id`
      : `LEFT JOIN todos_categories ON todos.id = todos_categories.todo_id`;
    const queryTotalCount = `SELECT COUNT(DISTINCT todos.id) as count FROM todos ${countJoinClause} ${whereClause}`;
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
    const todo = await db.get(`SELECT * FROM todos WHERE todos.id = ? AND todos.deleted_at IS NULL`, [id]);
    if (!todo) return null;
    
    // Получаем категории для задачи
    const categoriesQuery = `
      SELECT 
        categories.id,
        categories.name,
        categories.color
      FROM todos_categories
      INNER JOIN categories ON todos_categories.category_id = categories.id
      WHERE todos_categories.todo_id = ?
    `;
    const categories = await db.all(categoriesQuery, [id]);
    
    return {
      ...todo,
      completed: Boolean(todo.completed),
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color
      }))
    };
  }

  // Создать новую задачу
  static async create({ title, description = '', priority }) {
    const result = await db.run(
      'INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)',
      [title, description, priority]
    );
    return result.lastID;
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
    const whereClause = `WHERE (todos.title LIKE ? OR todos.description LIKE ?) AND todos.deleted_at IS NULL`;
    const query = `SELECT * FROM todos ${whereClause} ORDER BY todos.created_at DESC`;
    const todos = await db.all(query, [`%${q.q}%`, `%${q.q}%`]);
    
    // Получаем категории для всех найденных задач
    const todoIds = todos.map(t => t.id);
    let categoriesMap = {};
    if (todoIds.length > 0) {
      const placeholders = todoIds.map(() => '?').join(',');
      const categoriesQuery = `
        SELECT 
          todos_categories.todo_id,
          categories.id,
          categories.name,
          categories.color
        FROM todos_categories
        INNER JOIN categories ON todos_categories.category_id = categories.id
        WHERE todos_categories.todo_id IN (${placeholders})
      `;
      const categories = await db.all(categoriesQuery, todoIds);
      
      categories.forEach(cat => {
        if (!categoriesMap[cat.todo_id]) {
          categoriesMap[cat.todo_id] = [];
        }
        categoriesMap[cat.todo_id].push({
          id: cat.id,
          name: cat.name,
          color: cat.color
        });
      });
    }
    
    // Преобразование данных (boolean для completed, добавляем категории)
    const todosResponse = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed),
      categories: categoriesMap[todo.id] || []
    }));

    return todosResponse;
  }

  static async addCategoryToTodo(id, categoryId) {
    const query = 'INSERT INTO todos_categories (todo_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING';
    await db.run(query, [id, categoryId]);
    // Возвращаем обновленную задачу с категориями
    return this.getById(id);
  }

  static async removeCategoryFromTodo(id, categoryId) {
    const query = 'DELETE FROM todos_categories WHERE todo_id = ? AND category_id = ?';
    await db.run(query, [id, categoryId]);
    // Возвращаем обновленную задачу с категориями
    return this.getById(id);
  }
}

