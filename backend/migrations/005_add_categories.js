import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'todos.db');

function createDb() {
  const rawDb = new sqlite3.Database(dbPath);

  return {
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        rawDb.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        rawDb.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

const db = createDb();

export async function up() {
    console.log('▶️  Применяем миграцию: добавляем таблицы categories и todos_categories');
    await db.run('BEGIN TRANSACTION');
    try {
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
        
        await db.run('COMMIT');
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    }
    console.log('✅ Таблицы categories и todos_categories добавлены');
}

export async function down() {
    console.log('⏮️  Откатываем миграцию: удаляем таблицы categories и todos_categories');
    await db.run('BEGIN TRANSACTION');
    try {
        await db.run('DROP TABLE IF EXISTS todos_categories');
        await db.run('DROP TABLE IF EXISTS categories');
        await db.run('COMMIT');
        console.log('✅ Таблицы categories и todos_categories удалены');
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    }
}

const command = process.argv[2];

async function main() {
  try {
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.log('Использование: node backend/migrations/005_add_categories.js <up|down>');
    }
  } finally {
    await db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Ошибка при выполнении миграции:', error);
    process.exitCode = 1;
  });
}