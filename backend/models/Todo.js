import { db } from '../config/database.js';

// Модель Todo - содержит методы для работы с данными
export class Todo {
  // Получить все задачи
  static async getAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.completed !== undefined) {
      console.log(filters.completed);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM todos ${whereClause} ORDER BY created_at DESC`;
    const todos = await db.all(query, values);
    return todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed) // SQLite хранит boolean как 0/1
    }));
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

