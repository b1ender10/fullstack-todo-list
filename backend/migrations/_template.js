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
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        rawDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
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

// Функция up - применяет миграцию
export async function up() {
  console.log('▶️  Применяем миграцию: ОПИШИ ЧТО ДЕЛАЕШЬ');
  
  // TODO: Добавь свой код здесь
  // Примеры:
  // await db.run('ALTER TABLE todos ADD COLUMN new_column TEXT');
  // await db.run('CREATE INDEX idx_name ON todos(column_name)');
  
  console.log('✅ Миграция применена');
}

// Функция down - откатывает миграцию
export async function down() {
  console.log('⏮️  Откатываем миграцию: ОПИШИ КАК ОТКАТЫВАЕШЬ');
  
  // TODO: Добавь код для отката
  // Примеры:
  // await db.run('DROP INDEX IF EXISTS idx_name');
  // await db.run('ALTER TABLE todos DROP COLUMN new_column'); // SQLite не поддерживает, нужен workaround
  
  console.log('✅ Миграция откачена');
}

// CLI интерфейс
const command = process.argv[2];

async function main() {
  try {
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.log('Использование: node migrations/XXX_name.js <up|down>');
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

