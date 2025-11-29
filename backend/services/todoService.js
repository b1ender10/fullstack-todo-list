import { Todo } from '../models/Todo.js';
import { config } from '../config/constants.js';
import logger from '../utils/logger.js';

class TodoService {

    static async getAllTodos({ completed, priority, page, limit, sortBy, sortOrder, categoryId }) {
        const conditions = [];
        const values = [];
        conditions.push('deleted_at is NULL');

        // Нормализация и валидация фильтра completed
        if (completed !== undefined) {
            const normalizedCompleted = 
                completed === true ||
                completed === 'true' ||
                completed === 1 ||
                completed === '1'
                ? true
                : false;
            conditions.push('completed = ?');
            values.push(normalizedCompleted);
        }

        // Нормализация и валидация фильтра priority
        if (priority !== undefined && priority !== null && priority !== '') {
            const normalizedPriority = Number(priority);
            
            // Валидация диапазона приоритета
            if (isNaN(normalizedPriority) || normalizedPriority < config.priorityMin || normalizedPriority > config.priorityMax) {
                throw new Error(`Priority must be a number between ${config.priorityMin} and ${config.priorityMax}`);
            }
            
            conditions.push('priority = ?');
            values.push(normalizedPriority);
        }

        let sortCondition = "";

        // Разрешенные поля для сортировки: title, created_at, priority, completed
        const allowedSortFields = ['title', 'created_at', 'priority', 'completed'];
        if (sortBy && allowedSortFields.includes(sortBy)) {
            sortCondition = `ORDER BY ${sortBy}`;
        } else {
            sortCondition = 'ORDER BY created_at';
        }

        // Разрешенные направления сортировки: asc, desc
        const allowedSortOrders = ['asc', 'desc'];
        if (sortOrder && allowedSortOrders.includes(sortOrder.toLowerCase())) {
            sortCondition += ` ${sortOrder.toLowerCase()}`;
        } else {
            sortCondition += ' DESC';
        }

        // Нормализация и валидация пагинации
        const hasPagination = page !== undefined && limit !== undefined;
        let normalizedPage, normalizedLimit;

        if (hasPagination) {
            normalizedPage = page !== undefined && page !== null && page !== ''
                ? Number(page)
                : config.defaultPage;
            
            normalizedLimit = limit !== undefined && limit !== null && limit !== ''
                ? Number(limit)
                : config.defaultLimit;

            // Валидация page и limit
            if (isNaN(normalizedPage) || normalizedPage < 1) {
                throw new Error('Page must be a positive number');
            }
            
            if (isNaN(normalizedLimit) || normalizedLimit < 1) {
                throw new Error('Limit must be a positive number');
            }

            // Максимальный лимит (защита от слишком больших запросов)
            const maxLimit = 100;
            if (normalizedLimit > maxLimit) {
                normalizedLimit = maxLimit;
            }
        }

        const paginationConditions = [];
        const paginationValues = [];

        if (hasPagination) {
            paginationConditions.push('LIMIT ?');
            paginationConditions.push('OFFSET ?');
            paginationValues.push(normalizedLimit);
            paginationValues.push((normalizedPage - 1) * normalizedLimit);
        }

        const normalizedCategoryId = categoryId !== undefined && categoryId !== null && categoryId !== ''
            ? Number(categoryId)
            : null;

        // Вызов модели
        const result = await Todo.getAll({
            conditions: conditions,
            values: values,
            paginationConditions: paginationConditions,
            paginationValues: paginationValues,
            hasPagination: hasPagination,
            sortCondition: sortCondition,
            categoryId: normalizedCategoryId,
        });

        // Service всегда возвращает единый формат
        if (!hasPagination) {
            return {
                data: result,
                pagination: null
            };
        }

        return {
            data: result.data,
            pagination: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: result.pagination.total,
                totalPages: Math.ceil(result.pagination.total / normalizedLimit)
            }
        }
    }

    static async getAllDeletedTodos({ page, limit }) {
        const conditions = [];
        const values = [];
        conditions.push('deleted_at is NOT NULL');

        // Нормализация и валидация пагинации
        const hasPagination = page !== undefined && limit !== undefined;
        let normalizedPage, normalizedLimit;

        if (hasPagination) {
            normalizedPage = page !== undefined && page !== null && page !== ''
                ? Number(page)
                : config.defaultPage;
            
            normalizedLimit = limit !== undefined && limit !== null && limit !== ''
                ? Number(limit)
                : config.defaultLimit;

            // Валидация page и limit
            if (isNaN(normalizedPage) || normalizedPage < 1) {
                throw new Error('Page must be a positive number');
            }
            
            if (isNaN(normalizedLimit) || normalizedLimit < 1) {
                throw new Error('Limit must be a positive number');
            }

            // Максимальный лимит (защита от слишком больших запросов)
            const maxLimit = 100;
            if (normalizedLimit > maxLimit) {
                normalizedLimit = maxLimit;
            }
        }

        const paginationConditions = [];
        const paginationValues = [];

        if (hasPagination) {
            paginationConditions.push('LIMIT ?');
            paginationConditions.push('OFFSET ?');
            paginationValues.push(normalizedLimit);
            paginationValues.push((normalizedPage - 1) * normalizedLimit);
        }

        // Вызов модели
        const result = await Todo.getAll({
            conditions: conditions,
            values: values,
            paginationConditions: paginationConditions,
            paginationValues: paginationValues,
            hasPagination: hasPagination,
            sortCondition: 'ORDER BY created_at DESC',
            categoryId: null,
        });

        // Service всегда возвращает единый формат
        if (!hasPagination) {
            return {
                data: result,
                pagination: null
            };
        }

        return {
            data: result.data,
            pagination: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: result.pagination.total,
                totalPages: Math.ceil(result.pagination.total / normalizedLimit)
            }
        }
            
    }

    static async getTodoById(id) {
        // Нормализация и валидация ID
        const normalizedId = Number(id);
        
        // Валидация: ID должен быть положительным числом
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId)) {
            throw new Error('ID must be a positive integer');
        }
        
        // Вызов модели
        const todo = await Todo.getById(normalizedId);
        
        // Бизнес-логика: если задача не найдена, выбрасываем ошибку
        if (!todo) {
            throw new Error('Todo not found');
        }
        
        return todo;
    }

    static async createTodo({ title, description, priority }) {
        if (typeof title !== 'string') {
            throw new Error('Title must be a string');
        }
        const trimmedTitle = title.trim();
        if (trimmedTitle === '') {
            throw new Error('Title cannot be empty');
        }
        if (trimmedTitle.length < config.titleMinLength || trimmedTitle.length > config.titleMaxLength) {
            throw new Error(`Title must be between ${config.titleMinLength} and ${config.titleMaxLength} characters`);
        }

        // Валидация и нормализация description
        let normalizedDescription = '';
        if (description !== undefined && description !== null) {
            if (typeof description !== 'string') {
                throw new Error('Description must be a string');
            }
            const trimmedDescription = description.trim();
            if (trimmedDescription.length > config.descriptionMaxLength) {
                throw new Error(`Description must not exceed ${config.descriptionMaxLength} characters`);
            }
            normalizedDescription = trimmedDescription;
        }

        // Валидация и нормализация priority
        let normalizedPriority = config.defaultPriority;
        if (priority !== undefined && priority !== null && priority !== '') {
            normalizedPriority = Number(priority);
            if (
                !Number.isInteger(normalizedPriority) ||
                normalizedPriority < config.priorityMin ||
                normalizedPriority > config.priorityMax
            ) {
                throw new Error(`Priority must be a number between ${config.priorityMin} and ${config.priorityMax}`);
            }
        }

        // Вызов модели
        const todoId = await Todo.create({ 
            title: trimmedTitle, 
            description: normalizedDescription, 
            priority: normalizedPriority 
        });

        logger.info('Todo created', { id: todoId});
        
        return todoId;
    }

    static async updateTodo(id, { title, description, completed, priority }) {
        // Валидация ID
        const normalizedId = Number(id);
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId)) {
            throw new Error('ID must be a positive integer');
        }

        // Проверка существования задачи перед обновлением
        const existingTodo = await Todo.getById(normalizedId);
        if (!existingTodo) {
            throw new Error('Todo not found');
        }

        const updates = [];
        const values = [];

        // Валидация и нормализация title
        if (title !== undefined) {
            if (typeof title !== 'string') {
                throw new Error('Title must be a string');
            }
            const trimmedTitle = title.trim();
            if (trimmedTitle === '') {
                throw new Error('Title cannot be empty');
            }
            if (trimmedTitle.length < config.titleMinLength || trimmedTitle.length > config.titleMaxLength) {
                throw new Error(`Title must be between ${config.titleMinLength} and ${config.titleMaxLength} characters`);
            }
            updates.push('title = ?');
            values.push(trimmedTitle);
        }

        // Валидация и нормализация description
        if (description !== undefined) {
            if (typeof description !== 'string') {
                throw new Error('Description must be a string');
            }
            const trimmedDescription = description.trim();
            if (trimmedDescription.length > config.descriptionMaxLength) {
                throw new Error(`Description must not exceed ${config.descriptionMaxLength} characters`);
            }
            
            updates.push('description = ?');
            values.push(trimmedDescription);
        }

        // Нормализация completed (как в getAllTodos)
        if (completed !== undefined) {
            const normalizedCompleted = 
                completed === true ||
                completed === 'true' ||
                completed === 1 ||
                completed === '1'
                ? 1
                : completed === false ||
                  completed === 'false' ||
                  completed === 0 ||
                  completed === '0'
                ? 0
                : null;
            if (normalizedCompleted === null) {
                throw new Error('completed must be a boolean value');
            }
            
            updates.push('completed = ?');
            values.push(normalizedCompleted);
        }

        // Валидация и нормализация priority
        if (priority !== undefined) {
            let normalizedPriority;
            
            if (priority === null || priority === '') {
                normalizedPriority = config.defaultPriority;
            } else {
                normalizedPriority = Number(priority);
                if (
                    !Number.isInteger(normalizedPriority) ||
                    normalizedPriority < config.priorityMin ||
                    normalizedPriority > config.priorityMax
                ) {
                    throw new Error(`Priority must be a number between ${config.priorityMin} and ${config.priorityMax}`);
                }
            }
            
            updates.push('priority = ?');
            values.push(normalizedPriority);
        }

        // Проверка, что есть поля для обновления
        if (updates.length === 0) {
            // Если ничего не обновляется, возвращаем существующую задачу
            return existingTodo;
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(normalizedId);

        // Вызов модели
        const todo = await Todo.update(normalizedId, { updates, values });
        
        logger.info('Todo updated', { id: todo.id, title: todo.title });

        return todo;
    }

    static async deleteTodo(id) {
        // Валидация ID
        const normalizedId = Number(id);
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId)) {
            throw new Error('ID must be a positive integer');
        }

        // Вызов модели (модель сама проверяет существование и возвращает null, если не найдено)
        const todo = await Todo.delete(normalizedId);
        if (!todo) {
            throw new Error('Todo not found');
        }
        
        logger.info('Todo deleted', { id: todo.id, title: todo.title });
        
        return todo;
    }

    static async batchDeleteTodos(ids) {
        // Валидация: ids должен быть непустым массивом
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('ids must be a non-empty array');
        }

        // Нормализация и валидация каждого ID
        const normalizedIds = ids.map(id => Number(id));

        // Проверяем, что все ID валидны
        const invalidIds = normalizedIds.filter(id => isNaN(id) || id < 1 || !Number.isInteger(id));
        if (invalidIds.length > 0) {
            throw new Error(`Invalid IDs: [${invalidIds.join(', ')}]. All IDs must be positive integers`);
        }

        // Удаляем дубликаты (если пользователь случайно передал один ID дважды)
        const uniqueIds = [...new Set(normalizedIds)];

        // Вызов модели (модель сама проверяет существование всех задач)
        const todos = await Todo.batchDelete(uniqueIds);

        // Логируем успешное удаление
        const deletedIds = todos.map(t => t.id);
        logger.info('Todos batch deleted', { count: todos.length, ids: deletedIds });

        return todos;
    }

    static async batchSoftDeleteTodos(ids) {
         // Валидация: ids должен быть непустым массивом
         if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('ids must be a non-empty array');
        }

        // Нормализация и валидация каждого ID
        const normalizedIds = ids.map(id => Number(id));

        // Проверяем, что все ID валидны
        const invalidIds = normalizedIds.filter(id => isNaN(id) || id < 1 || !Number.isInteger(id));
        if (invalidIds.length > 0) {
            throw new Error(`Invalid IDs: [${invalidIds.join(', ')}]. All IDs must be positive integers`);
        }

        // Удаляем дубликаты (если пользователь случайно передал один ID дважды)
        const uniqueIds = [...new Set(normalizedIds)];

        // Вызов модели (модель сама проверяет существование всех задач)
        const todos = await Todo.batchSoftDelete(uniqueIds);

        // Логируем успешное удаление
        const deletedIds = todos.map(t => t.id);
        logger.info('Todos batch deleted', { count: todos.length, ids: deletedIds });

        return todos;
    }

    static async batchSoftDeleteRestoreTodos(ids) {
        // Валидация: ids должен быть непустым массивом
        if (!Array.isArray(ids) || ids.length === 0) {
           throw new Error('ids must be a non-empty array');
       }

       // Нормализация и валидация каждого ID
       const normalizedIds = ids.map(id => Number(id));

       // Проверяем, что все ID валидны
       const invalidIds = normalizedIds.filter(id => isNaN(id) || id < 1 || !Number.isInteger(id));
       if (invalidIds.length > 0) {
           throw new Error(`Invalid IDs: [${invalidIds.join(', ')}]. All IDs must be positive integers`);
       }

       // Удаляем дубликаты (если пользователь случайно передал один ID дважды)
       const uniqueIds = [...new Set(normalizedIds)];

       // Вызов модели (модель сама проверяет существование всех задач)
       const todos = await Todo.batchSoftDeleteRestore(uniqueIds);

       // Логируем успешное удаление
       const deletedIds = todos.map(t => t.id);
       logger.info('Todos batch deleted', { count: todos.length, ids: deletedIds });

       return todos;
   }

   static async searchTodos(q) {
        const normalizedQ = q.trim();
        if (normalizedQ === '') {
            throw new Error('q cannot be empty');
        }

        // Вызов модели
        const result = await Todo.searchTodos({
            q: normalizedQ
        });

        return result;
   }

   static async addCategoryToTodo(id, categoryId) {
        // Нормализация и валидация ID
        const normalizedId = Number(id);
        const normalizedCategoryId = Number(categoryId);
        
        // Валидация: ID должен быть положительным числом
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId) || isNaN(normalizedCategoryId) || normalizedCategoryId < 1 || !Number.isInteger(normalizedCategoryId)) {
            throw new Error('ID and categoryId must be a positive integer');
        }

        // Проверка существования задачи
        const existingTodo = await Todo.getById(normalizedId);
        if (!existingTodo) {
            throw new Error('Todo not found');
        }

        // Вызов модели
        const todo = await Todo.addCategoryToTodo(normalizedId, normalizedCategoryId);

        logger.info('Category added to todo', { id: todo.id, categoryId: normalizedCategoryId });
        
        return todo;
   }

   static async removeCategoryFromTodo(id, categoryId) {
        // Нормализация и валидация ID
        const normalizedId = Number(id);
        const normalizedCategoryId = Number(categoryId);
        
        // Валидация: ID должен быть положительным числом
        if (isNaN(normalizedId) || normalizedId < 1 || !Number.isInteger(normalizedId) || isNaN(normalizedCategoryId) || normalizedCategoryId < 1 || !Number.isInteger(normalizedCategoryId)) {
            throw new Error('ID and categoryId must be a positive integer');
        }
        
        // Проверка существования задачи
        const existingTodo = await Todo.getById(normalizedId);
        if (!existingTodo) {
            throw new Error('Todo not found');
        }
        
        // Вызов модели
        const todo = await Todo.removeCategoryFromTodo(normalizedId, normalizedCategoryId);

        logger.info('Category removed from todo', { id: todo.id, categoryId: normalizedCategoryId });
        
        return todo;
   }
}

export default TodoService;