import { db } from '../config/database.js';

// Модель Todo - содержит методы для работы с данными
export class Todo {
  // Получить все задачи
  static async getAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.completed !== undefined) {
      conditions.push('completed = ?');
      const completedValue =
        filters.completed === true ||
        filters.completed === 'true' ||
        filters.completed === 1 ||
        filters.completed === '1'
          ? true
          : false;
      values.push(completedValue);
    }

    if (filters.priority !== undefined && filters.priority !== '') {
      conditions.push('priority = ?');
      values.push(Number(filters.priority));
    }

    const paginationConditions = [];
    const paginationValues = [];
    const hasPagination = filters.page !== undefined && filters.limit !== undefined;

    if (hasPagination) {
      // Валидация: page и limit должны быть минимум 1
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.max(1, Number(filters.limit) || 10);
      
      paginationConditions.push('LIMIT ?');
      paginationConditions.push('OFFSET ?');
      paginationValues.push(limit);
      paginationValues.push((page - 1) * limit);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const paginationClause = paginationConditions.length > 0 ? ` ${paginationConditions.join(' ')}` : '';
    const query = `SELECT * FROM todos ${whereClause} ORDER BY created_at DESC ${paginationClause}`;
    const todos = await db.all(query, [...values, ...paginationValues]);
    
    const todosResponse = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed) // SQLite хранит boolean как 0/1
    }));

    // Если пагинация не запрашивалась, возвращаем просто массив
    if (!hasPagination) {
      return todosResponse;
    }

    // Если пагинация запрашивалась, возвращаем объект с data и pagination
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const queryTotalCount = `SELECT COUNT(*) as count FROM todos ${whereClause}`;
    const totalCount = await db.get(queryTotalCount, values);

    return {
      data: todosResponse,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
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
    const normalizedPriority =
      priority !== undefined && priority !== null && priority !== ''
        ? Number(priority)
        : 2;
    const result = await db.run(
      'INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)',
      [title, description, normalizedPriority]
    );
    return this.getById(result.lastID);
  }

  // Обновить задачу
  static async update(id, { title, description, completed, priority }) {
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(
        priority === null || priority === ''
          ? 2
          : Number(priority)
      );
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.run(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  // Удалить задачу
  static async delete(id) {
    const todo = await this.getById(id);
    if (!todo) return null;
    
    await db.run('DELETE FROM todos WHERE id = ?', [id]);
    return todo;
  }
}

