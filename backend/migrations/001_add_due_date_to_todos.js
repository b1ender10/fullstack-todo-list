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
  console.log('▶️  Применяем миграцию: добавляем колонку due_date');
  await db.run('ALTER TABLE todos ADD COLUMN due_date TEXT');
  console.log('✅ Колонка due_date добавлена');
}

export async function down() {
  console.log('⏮️  Откатываем миграцию: удаляем колонку due_date');
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__backup (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 2,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(`
      INSERT INTO todos__backup (id, title, description, completed, priority, created_at, updated_at)
      SELECT id, title, description, completed, priority, created_at, updated_at
      FROM todos
    `);

    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__backup RENAME TO todos');
    await db.run('COMMIT');
    console.log('✅ Колонка due_date удалена, таблица восстановлена');
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
      console.log('Использование: node backend/migrations/001_add_due_date_to_todos.js <up|down>');
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
