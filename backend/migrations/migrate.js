import sqlite3 from 'sqlite3';
import { readdir } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к БД (совпадает с путем в миграциях)
const dbPath = join(__dirname, '..', 'todos.db');

// Создаем подключение к БД
function createDb() {
  const rawDb = new sqlite3.Database(dbPath);

  return {
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        rawDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
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

// Инициализация таблицы миграций
async function initMigrationsTable(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Получить список примененных миграций
async function getAppliedMigrations(db) {
  const rows = await db.all('SELECT migration_name FROM schema_migrations ORDER BY id');
  return new Set(rows.map(row => row.migration_name));
}

// Получить список всех миграций из папки
async function getAllMigrations() {
  const migrationsDir = __dirname;
  const files = await readdir(migrationsDir);
  
  return files
    .filter(file => /^\d{3}_/.test(file) && file.endsWith('.js'))
    .sort()
    .map(file => ({
      name: file,
      path: join(migrationsDir, file)
    }));
}

// Применить миграцию
async function applyMigration(db, migration) {
  const migrationUrl = pathToFileURL(migration.path).href;
  const { up } = await import(migrationUrl);
  
  console.log(`▶️  Применяем миграцию: ${migration.name}`);
  await up();
  
  await db.run(
    'INSERT INTO schema_migrations (migration_name) VALUES (?)',
    [migration.name]
  );
  console.log(`✅ Миграция ${migration.name} применена\n`);
}

// Откатить миграцию
async function rollbackMigration(db, migration) {
  const migrationUrl = pathToFileURL(migration.path).href;
  const { down } = await import(migrationUrl);
  
  console.log(`⏮️  Откатываем миграцию: ${migration.name}`);
  await down();
  
  await db.run(
    'DELETE FROM schema_migrations WHERE migration_name = ?',
    [migration.name]
  );
  console.log(`✅ Миграция ${migration.name} откачена\n`);
}

// Применить все pending миграции
async function migrateUp(db) {
  await initMigrationsTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const allMigrations = await getAllMigrations();
  
  const pendingMigrations = allMigrations.filter(
    m => !appliedMigrations.has(m.name)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('✅ Все миграции уже применены');
    return;
  }
  
  console.log(`📦 Найдено ${pendingMigrations.length} миграций для применения:\n`);
  
  for (const migration of pendingMigrations) {
    try {
      await applyMigration(db, migration);
    } catch (error) {
      console.error(`❌ Ошибка при применении миграции ${migration.name}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Все миграции применены (${pendingMigrations.length})`);
}

// Откатить последнюю миграцию
async function migrateDown(db) {
  await initMigrationsTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const allMigrations = await getAllMigrations();
  
  // Находим последнюю примененную миграцию
  const appliedList = allMigrations.filter(m => appliedMigrations.has(m.name));
  
  if (appliedList.length === 0) {
    console.log('ℹ️  Нет примененных миграций для отката');
    return;
  }
  
  const lastMigration = appliedList[appliedList.length - 1];
  
  try {
    await rollbackMigration(db, lastMigration);
    console.log(`✅ Миграция ${lastMigration.name} откачена`);
  } catch (error) {
    console.error(`❌ Ошибка при откате миграции ${lastMigration.name}:`, error);
    throw error;
  }
}

// Показать статус миграций
async function migrateStatus(db) {
  await initMigrationsTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const allMigrations = await getAllMigrations();
  
  console.log('📊 Статус миграций:\n');
  
  for (const migration of allMigrations) {
    const isApplied = appliedMigrations.has(migration.name);
    const status = isApplied ? '✅ Применена' : '⏳ Ожидает';
    console.log(`  ${status} - ${migration.name}`);
  }
  
  const pendingCount = allMigrations.length - appliedMigrations.size;
  console.log(`\n📈 Всего: ${allMigrations.length}, Применено: ${appliedMigrations.size}, Ожидает: ${pendingCount}`);
}

// Главная функция
async function main() {
  const command = process.argv[2] || 'up';
  const db = createDb();
  
  try {
    switch (command) {
      case 'up':
        await migrateUp(db);
        break;
      case 'down':
        await migrateDown(db);
        break;
      case 'status':
        await migrateStatus(db);
        break;
      default:
        console.log('Использование: node migrations/migrate.js <up|down|status>');
        console.log('  up     - применить все pending миграции');
        console.log('  down   - откатить последнюю миграцию');
        console.log('  status - показать статус миграций');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

