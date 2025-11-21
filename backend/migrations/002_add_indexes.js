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
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        rawDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
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

// Проверка существования индекса
async function indexExists(indexName) {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
    [indexName]
  );
  return !!result;
}

export async function up() {
  console.log('▶️  Применяем миграцию: добавляем индексы');
  
  // Проверяем существование индексов перед созданием
  if (!(await indexExists('idx_completed'))) {
    await db.run('CREATE INDEX idx_completed ON todos(completed)');
    console.log('✅ Индекс idx_completed создан');
  } else {
    console.log('ℹ️  Индекс idx_completed уже существует');
  }

  if (!(await indexExists('idx_priority'))) {
    await db.run('CREATE INDEX idx_priority ON todos(priority)');
    console.log('✅ Индекс idx_priority создан');
  } else {
    console.log('ℹ️  Индекс idx_priority уже существует');
  }

  if (!(await indexExists('idx_created_at'))) {
    await db.run('CREATE INDEX idx_created_at ON todos(created_at)');
    console.log('✅ Индекс idx_created_at создан');
  } else {
    console.log('ℹ️  Индекс idx_created_at уже существует');
  }
}

export async function down() {
  console.log('⏮️  Откатываем миграцию: удаляем индексы');
  
  // Удаляем индексы (если они существуют)
  try {
    await db.run('DROP INDEX IF EXISTS idx_completed');
    console.log('✅ Индекс idx_completed удален');
  } catch (error) {
    console.log('ℹ️  Индекс idx_completed не найден');
  }

  try {
    await db.run('DROP INDEX IF EXISTS idx_priority');
    console.log('✅ Индекс idx_priority удален');
  } catch (error) {
    console.log('ℹ️  Индекс idx_priority не найден');
  }

  try {
    await db.run('DROP INDEX IF EXISTS idx_created_at');
    console.log('✅ Индекс idx_created_at удален');
  } catch (error) {
    console.log('ℹ️  Индекс idx_created_at не найден');
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
      console.log('Использование: node backend/migrations/002_add_indexes.js <up|down>');
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

