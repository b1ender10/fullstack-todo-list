# 📚 Руководство по созданию миграций

## Что такое миграции?

**Миграции** — это способ версионировать изменения схемы базы данных. Они позволяют:
- Отслеживать изменения БД
- Применять изменения на разных окружениях (dev, staging, production)
- Откатывать изменения при необходимости
- Работать в команде (все используют одинаковую схему)

---

## Структура миграции

Каждая миграция должна иметь:

1. **Имя файла** — `NNN_description.js` (где NNN — номер по порядку)
2. **Функцию `up()`** — применяет изменения
3. **Функцию `down()`** — откатывает изменения
4. **CLI интерфейс** — возможность запускать из командной строки

---

## Шаблон миграции

```javascript
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

const db = createDb();

// Функция up - применяет миграцию
export async function up() {
  console.log('▶️  Применяем миграцию: описание того, что делаем');
  
  // Твой код здесь
  await db.run('SQL команда');
  
  console.log('✅ Миграция применена');
}

// Функция down - откатывает миграцию
export async function down() {
  console.log('⏮️  Откатываем миграцию: описание отката');
  
  // Твой код здесь
  await db.run('SQL команда для отката');
  
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
```

---

## Правила именования

### Формат имени файла:
```
NNN_описание_изменения.js
```

**Примеры:**
- `001_add_due_date_to_todos.js` ✅
- `002_add_indexes.js` ✅
- `003_add_user_id_to_todos.js` ✅
- `migration.js` ❌ (нет номера)
- `add_column.js` ❌ (нет номера, не описательное)

**Правила:**
- Номер должен быть последовательным (001, 002, 003...)
- Используй snake_case для описания
- Описание должно быть понятным на английском
- Одно изменение = одна миграция

---

## Типы миграций и примеры

### 1. Добавление колонки

```javascript
export async function up() {
  await db.run('ALTER TABLE todos ADD COLUMN due_date TEXT');
}

export async function down() {
  // SQLite не поддерживает DROP COLUMN, нужен workaround
  await db.run('BEGIN TRANSACTION');
  try {
    // Создаем новую таблицу без колонки
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
    
    // Копируем данные (без due_date)
    await db.run(`
      INSERT INTO todos__backup (id, title, description, completed, priority, created_at, updated_at)
      SELECT id, title, description, completed, priority, created_at, updated_at
      FROM todos
    `);
    
    // Удаляем старую таблицу
    await db.run('DROP TABLE todos');
    
    // Переименовываем новую
    await db.run('ALTER TABLE todos__backup RENAME TO todos');
    
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

---

### 2. Создание индекса

```javascript
// Проверка существования индекса
async function indexExists(indexName) {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
    [indexName]
  );
  return !!result;
}

export async function up() {
  if (!(await indexExists('idx_completed'))) {
    await db.run('CREATE INDEX idx_completed ON todos(completed)');
  }
}

export async function down() {
  await db.run('DROP INDEX IF EXISTS idx_completed');
}
```

---

### 3. Изменение типа колонки

```javascript
export async function up() {
  await db.run('BEGIN TRANSACTION');
  try {
    // Создаем новую таблицу с новым типом
    await db.run(`
      CREATE TABLE todos__new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority INTEGER DEFAULT 2,  -- было TEXT, стало INTEGER
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Копируем данные с преобразованием
    await db.run(`
      INSERT INTO todos__new (id, title, priority, created_at)
      SELECT id, title, CAST(priority AS INTEGER), created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__new RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function down() {
  // Обратное преобразование
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority TEXT DEFAULT '2',  -- обратно в TEXT
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(`
      INSERT INTO todos__old (id, title, priority, created_at)
      SELECT id, title, CAST(priority AS TEXT), created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__old RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

---

### 4. Добавление ограничения (CHECK)

```javascript
export async function up() {
  // SQLite не поддерживает ADD CONSTRAINT напрямую
  // Нужно пересоздать таблицу
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) > 0),
        priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(`
      INSERT INTO todos__new (id, title, priority, created_at)
      SELECT id, title, priority, created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__new RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function down() {
  // Убираем CHECK ограничения
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,  -- без CHECK
        priority INTEGER DEFAULT 2,  -- без CHECK
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(`
      INSERT INTO todos__old (id, title, priority, created_at)
      SELECT id, title, priority, created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__old RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

---

### 5. Переименование колонки

```javascript
export async function up() {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_title TEXT NOT NULL,  -- было title, стало task_title
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(`
      INSERT INTO todos__new (id, task_title, description, created_at)
      SELECT id, title, description, created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__new RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function down() {
  // Обратно: task_title -> title
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      CREATE TABLE todos__old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,  -- обратно title
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(`
      INSERT INTO todos__old (id, title, description, created_at)
      SELECT id, task_title, description, created_at
      FROM todos
    `);
    
    await db.run('DROP TABLE todos');
    await db.run('ALTER TABLE todos__old RENAME TO todos');
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

---

## Лучшие практики

### ✅ ДЕЛАЙ:

1. **Всегда используй транзакции** для сложных операций
   ```javascript
   await db.run('BEGIN TRANSACTION');
   try {
     // операции
     await db.run('COMMIT');
   } catch (error) {
     await db.run('ROLLBACK');
     throw error;
   }
   ```

2. **Проверяй существование** перед созданием
   ```javascript
   // Для индексов
   if (!(await indexExists('idx_name'))) {
     await db.run('CREATE INDEX ...');
   }
   
   // Для таблиц
   await db.run('CREATE TABLE IF NOT EXISTS ...');
   ```

3. **Используй параметризованные запросы** (защита от SQL инъекций)
   ```javascript
   await db.run('INSERT INTO todos (title) VALUES (?)', [title]);
   ```

4. **Логируй действия**
   ```javascript
   console.log('▶️  Применяем миграцию: ...');
   console.log('✅ Успешно');
   ```

5. **Всегда реализуй `down()`** — возможность отката

6. **Тестируй миграцию** перед коммитом
   ```bash
   # Применить
   node migrations/XXX_name.js up
   
   # Откатить
   node migrations/XXX_name.js down
   
   # Снова применить
   node migrations/XXX_name.js up
   ```

---

### ❌ НЕ ДЕЛАЙ:

1. **Не изменяй существующие миграции** (если они уже применены)
   - Создай новую миграцию вместо изменения старой

2. **Не удаляй данные без backup**
   ```javascript
   // ❌ Плохо
   await db.run('DELETE FROM todos WHERE id > 100');
   
   // ✅ Хорошо (если нужно)
   await db.run('BEGIN TRANSACTION');
   try {
     // Создаем backup
     await db.run('CREATE TABLE todos_backup AS SELECT * FROM todos WHERE id > 100');
     // Удаляем
     await db.run('DELETE FROM todos WHERE id > 100');
     await db.run('COMMIT');
   } catch (error) {
     await db.run('ROLLBACK');
     throw error;
   }
   ```

3. **Не делай миграции зависимыми друг от друга**
   - Каждая миграция должна быть независимой

4. **Не используй данные из других таблиц без проверки**
   ```javascript
   // ❌ Плохо
   await db.run('INSERT INTO todos (user_id) SELECT id FROM users');
   
   // ✅ Хорошо
   const users = await db.all('SELECT id FROM users');
   if (users.length === 0) {
     throw new Error('No users found');
   }
   ```

---

## Порядок выполнения миграций

1. **Создай файл миграции** с правильным номером
2. **Реализуй `up()`** — что делаем
3. **Реализуй `down()`** — как откатить
4. **Протестируй:**
   ```bash
   node migrations/XXX_name.js up
   node migrations/XXX_name.js down
   node migrations/XXX_name.js up
   ```
5. **Закоммить** в git

---

## Работа в команде

1. **Всегда синхронизируй миграции** через git
2. **Не меняй номера** существующих миграций
3. **Перед pull** — проверь, нет ли новых миграций
4. **Применяй миграции** после pull:
   ```bash
   git pull
   node migrations/XXX_new_migration.js up
   ```

---

## Полезные SQL команды для проверки

```sql
-- Список всех таблиц
SELECT name FROM sqlite_master WHERE type='table';

-- Список всех индексов
SELECT name FROM sqlite_master WHERE type='index';

-- Структура таблицы
PRAGMA table_info(todos);

-- Список всех индексов для таблицы
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='todos';
```

---

## Пример полной миграции

```javascript
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
  console.log('▶️  Применяем миграцию: добавляем колонку tags');
  
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('ALTER TABLE todos ADD COLUMN tags TEXT');
    await db.run('COMMIT');
    console.log('✅ Колонка tags добавлена');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export async function down() {
  console.log('⏮️  Откатываем миграцию: удаляем колонку tags');
  
  await db.run('BEGIN TRANSACTION');
  try {
    // SQLite workaround для DROP COLUMN
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
    console.log('✅ Колонка tags удалена');
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
```

---

## Резюме

1. **Номер + описание** в имени файла
2. **`up()`** — применяет изменения
3. **`down()`** — откатывает изменения
4. **Транзакции** для сложных операций
5. **Проверки существования** перед созданием
6. **Тестируй** перед коммитом
7. **Не изменяй** существующие миграции

