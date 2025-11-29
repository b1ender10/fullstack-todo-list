import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { Todo } from '../models/Todo.js';
import { db } from '../config/database.js';

let testDb = null;

// Создаем in-memory БД для тестов
function createTestDb() {
  const rawDb = new sqlite3.Database(':memory:');
  
  const db = {
    get: promisify(rawDb.get.bind(rawDb)),
    all: promisify(rawDb.all.bind(rawDb)),
    run: function(sql, params = []) {
      return new Promise((resolve, reject) => {
        rawDb.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes
            });
          }
        });
      });
    },
    close: promisify(rawDb.close.bind(rawDb))
  };
  
  return db;
}

// Инициализация БД перед каждым тестом
async function initTestDatabase(db) {
  await db.run(`
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
      description TEXT CHECK(length(description) <= 1000),
      completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
      priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      date_expiration DATETIME,
      deleted_at DATETIME
    )
  `);
  
  await db.run(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `);
  
  await db.run(`
    CREATE TABLE todos_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(todo_id, category_id)
    )
  `);
}

beforeEach(async () => {
  // Создаем тестовую БД
  testDb = createTestDb();
  await initTestDatabase(testDb);
  
  // Заменяем методы db на тестовую БД
  Object.defineProperty(db, 'get', {
    value: testDb.get.bind(testDb),
    writable: true,
    configurable: true
  });
  Object.defineProperty(db, 'all', {
    value: testDb.all.bind(testDb),
    writable: true,
    configurable: true
  });
  Object.defineProperty(db, 'run', {
    value: testDb.run.bind(testDb),
    writable: true,
    configurable: true
  });
});

afterEach(async () => {
  // Очищаем БД после каждого теста
  if (testDb) {
    await testDb.run('DELETE FROM todos_categories');
    await testDb.run('DELETE FROM todos');
    await testDb.run('DELETE FROM categories');
  }
});

test('создание задачи', async () => {
  const todoId = await Todo.create({
    title: 'Test Todo',
    description: 'Test Description',
    priority: 1
  });
  
  expect(todoId).toBeDefined();
  expect(typeof todoId).toBe('number');
  
  const todo = await Todo.getById(todoId);
  expect(todo).not.toBeNull();
  expect(todo.title).toBe('Test Todo');
  expect(todo.description).toBe('Test Description');
  expect(todo.priority).toBe(1);
  expect(todo.completed).toBe(false);
});

test('получение задачи по ID', async () => {
  const todoId = await Todo.create({
    title: 'Test Todo',
    description: 'Test Description',
    priority: 2
  });
  
  const todo = await Todo.getById(todoId);
  
  expect(todo).not.toBeNull();
  expect(todo.id).toBe(todoId);
  expect(todo.title).toBe('Test Todo');
  expect(todo.description).toBe('Test Description');
  expect(todo.priority).toBe(2);
  expect(todo.completed).toBe(false);
  expect(todo.categories).toEqual([]);
});

test('получение несуществующей задачи по ID', async () => {
  const todo = await Todo.getById(999);
  expect(todo).toBeNull();
});

test('обновление задачи', async () => {
  const todoId = await Todo.create({
    title: 'Test Todo',
    description: 'Test Description',
    priority: 1
  });
  
  const updatedTodo = await Todo.update(todoId, {
    updates: ['title = ?', 'description = ?', 'priority = ?', 'completed = ?'],
    values: ['Updated Title', 'Updated Description', 3, 1, todoId]
  });
  
  expect(updatedTodo).not.toBeNull();
  expect(updatedTodo.id).toBe(todoId);
  expect(updatedTodo.title).toBe('Updated Title');
  expect(updatedTodo.description).toBe('Updated Description');
  expect(updatedTodo.priority).toBe(3);
  expect(updatedTodo.completed).toBe(true);
});

test('удаление задачи', async () => {
  const todoId = await Todo.create({
    title: 'Test Todo',
    description: 'Test Description',
    priority: 1
  });
  
  const deletedTodo = await Todo.delete(todoId);
  
  expect(deletedTodo).not.toBeNull();
  expect(deletedTodo.id).toBe(todoId);
  expect(deletedTodo.title).toBe('Test Todo');
  
  // Проверяем, что задача действительно удалена
  const todo = await Todo.getById(todoId);
  expect(todo).toBeNull();
});
