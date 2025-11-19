import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создаем подключение к базе данных
const dbPath = join(__dirname, '..', 'todos.db');
const db = new sqlite3.Database(dbPath);

// Сохраняем оригинальный метод run
const originalRun = db.run.bind(db);

// Промисфицируем методы для удобной работы с async/await
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

// Специальная обертка для db.run, чтобы сохранить lastID
db.run = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    originalRun(sql, params, function(err) {
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
};

// Создаем таблицу todos при первом запуске
const initDatabase = async () => {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
        description TEXT CHECK(length(description) <= 1000),
        completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
        priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ База данных инициализирована');
  } catch (error) {
    console.error('❌ Ошибка при инициализации БД:', error);
    throw error;
  }
};

export { db, initDatabase };

