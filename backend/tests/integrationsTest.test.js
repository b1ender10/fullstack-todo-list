import request from "supertest";
import express from 'express';
import app from '../server.js';


describe("GET /api/todos/ - получить все задачи", () => {
    it("должен вернуть все задачи со статусом 200 и правильной структурой", async () => {
        const response = await request(app)
            .get('/api/todos')
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        
        if (response.body.data.length > 0) {
            expect(response.body.data[0].id).toBeGreaterThan(0);
            expect(response.body.data[0].title).toBeDefined();
            expect(response.body.data[0].priority).toBeGreaterThan(0);
            expect(response.body.data[0].priority).toBeLessThan(4);
        }
    });
});

describe("GET /api/todos/:id - получить задачу по ID", () => {
    let createdTodoId;

    beforeAll(async () => {
        // Создаем задачу для тестирования
        const createResponse = await request(app)
            .post('/api/todos')
            .send({
                title: "Test Todo for GET",
                description: "Test Description",
                priority: 1
            });
        createdTodoId = createResponse.body.data;
    });

    it("должен вернуть задачу по ID со статусом 200 и правильной структурой", async () => {
        const response = await request(app)
            .get(`/api/todos/${createdTodoId}`)
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe(createdTodoId);
        expect(response.body.data.title).toBe("Test Todo for GET");
        expect(response.body.data.priority).toBeGreaterThan(0);
        expect(response.body.data.priority).toBeLessThan(4);
    });

    it("должен вернуть 404 для несуществующего ID", async () => {
        const response = await request(app)
            .get('/api/todos/999999')
            .expect(404);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 для невалидного ID", async () => {
        const response = await request(app)
            .get('/api/todos/invalid')
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("GET /api/todos/search - поиск задач по заголовку или описанию", () => {
    it("должен вернуть результаты поиска со статусом 200", async () => {
        const response = await request(app)
            .get('/api/todos/search?q=test')
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        
        if (response.body.data.length > 0) {
            expect(response.body.data[0].id).toBeGreaterThan(0);
            expect(response.body.data[0].title).toBeDefined();
        }
    });

    it("должен вернуть 400 при отсутствии параметра q", async () => {
        const response = await request(app)
            .get('/api/todos/search')
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("GET /api/todos/deleted - получить все удаленные задачи", () => {
    it("должен вернуть удаленные задачи со статусом 200", async () => {
        const response = await request(app)
            .get('/api/todos/deleted')
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        
        if (response.body.data.length > 0) {
            expect(response.body.data[0].id).toBeGreaterThan(0);
            expect(response.body.data[0].title).toBeDefined();
            expect(response.body.data[0].deleted_at).toBeDefined();
        }
    });
});

describe("POST /api/todos - создать новую задачу", () => {
    it("должен создать задачу со статусом 201 и вернуть ID", async () => {
        const response = await request(app)
            .post('/api/todos')
            .send({
                title: "Test Create",
                description: "Test Description Create",
                priority: 1
            })
            .expect(201);
        
        expect(response.body.data).toBeGreaterThan(0);
        expect(response.body.success).toBe(true);

        // Проверяем, что задача действительно создана
        const getResponse = await request(app)
            .get(`/api/todos/${response.body.data}`)
            .expect(200);
        
        expect(getResponse.body.success).toBe(true);
        expect(getResponse.body.data.id).toBe(response.body.data);
        expect(getResponse.body.data.title).toBe("Test Create");
        expect(getResponse.body.data.description).toBe("Test Description Create");
        expect(getResponse.body.data.priority).toBe(1);
    });

    it("должен вернуть 400 при отсутствии title", async () => {
        const response = await request(app)
            .post('/api/todos')
            .send({
                description: "Test Description",
                priority: 1
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 при пустом title", async () => {
        const response = await request(app)
            .post('/api/todos')
            .send({
                title: "",
                description: "Test Description",
                priority: 1
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 при невалидном priority", async () => {
        const response = await request(app)
            .post('/api/todos')
            .send({
                title: "Test Title",
                description: "Test Description",
                priority: 5
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("PUT /api/todos/:id - обновить задачу", () => {
    let createdTodoId;

    beforeAll(async () => {
        const createResponse = await request(app)
            .post('/api/todos')
            .send({
                title: "Test Todo for UPDATE",
                description: "Original Description",
                priority: 1
            });
        createdTodoId = createResponse.body.data;
    });

    it("должен обновить задачу со статусом 200", async () => {
        const response = await request(app)
            .put(`/api/todos/${createdTodoId}`)
            .send({
                title: "Updated Title",
                description: "Updated Description",
                priority: 2
            })
            .expect(200);
        
        expect(response.body.success).toBe(true);

        // Проверяем, что задача действительно обновлена
        const getResponse = await request(app)
            .get(`/api/todos/${createdTodoId}`)
            .expect(200);
        
        expect(getResponse.body.data.title).toBe("Updated Title");
        expect(getResponse.body.data.description).toBe("Updated Description");
        expect(getResponse.body.data.priority).toBe(2);
    });

    it("должен вернуть 404 для несуществующего ID", async () => {
        const response = await request(app)
            .put('/api/todos/999999')
            .send({
                title: "Updated Title",
                priority: 1
            })
            .expect(404);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 при невалидном ID", async () => {
        const response = await request(app)
            .put('/api/todos/invalid')
            .send({
                title: "Updated Title"
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("DELETE /api/todos/:id - удалить задачу", () => {
    let createdTodoId;

    beforeEach(async () => {
        const createResponse = await request(app)
            .post('/api/todos')
            .send({
                title: "Test Todo for DELETE",
                description: "Test Description",
                priority: 1
            });
        createdTodoId = createResponse.body.data;
    });

    it("должен удалить задачу со статусом 200", async () => {
        const response = await request(app)
            .delete(`/api/todos/${createdTodoId}`)
            .expect(200);
        
        expect(response.body.success).toBe(true);

        // Проверяем, что задача действительно удалена
        await request(app)
            .get(`/api/todos/${createdTodoId}`)
            .expect(404);
    });

    it("должен вернуть 404 для несуществующего ID", async () => {
        const response = await request(app)
            .delete('/api/todos/999999')
            .expect(404);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 при невалидном ID", async () => {
        const response = await request(app)
            .delete('/api/todos/invalid')
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("GET /api/categories - получить все категории", () => {
    it("должен вернуть все категории со статусом 200 и правильной структурой", async () => {
        const response = await request(app)
            .get('/api/categories')
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        // Структура: Model -> { data: array }, Service -> { data: { data: array } }, Controller -> { success: true, data: { data: { data: array } } }
        expect(response.body.data.data).toBeDefined();
        expect(response.body.data.data.data).toBeDefined();
        expect(Array.isArray(response.body.data.data.data)).toBe(true);
    });
});

describe("POST /api/categories - создать новую категорию", () => {
    it("должен создать категорию со статусом 200", async () => {
        const response = await request(app)
            .post('/api/categories')
            .send({
                name: "Test Category",
                color: "#FF0000"
            })
            .expect(200);
        
        expect(response.body.success).toBe(true);
        // Сервис возвращает { data: category }, где category - объект с id
        expect(response.body.data).toBeDefined();
        expect(response.body.data.data).toBeDefined();
        expect(response.body.data.data.id).toBeGreaterThan(0);
    });

    it("должен вернуть 400 при отсутствии name", async () => {
        const response = await request(app)
            .post('/api/categories')
            .send({
                color: "#FF0000"
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });

    it("должен вернуть 400 при отсутствии color", async () => {
        const response = await request(app)
            .post('/api/categories')
            .send({
                name: "Test Category"
            })
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

describe("DELETE /api/categories/:id - удалить категорию", () => {
    let createdCategoryId;

    beforeEach(async () => {
        const createResponse = await request(app)
            .post('/api/categories')
            .send({
                name: "Test Category for DELETE",
                color: "#FF0000"
            });
        // Сервис возвращает { data: category }, где category - объект с id
        createdCategoryId = createResponse.body.data.data.id;
    });

    it("должен удалить категорию со статусом 200", async () => {
        const response = await request(app)
            .delete(`/api/categories/${createdCategoryId}`)
            .expect(200);
        
        expect(response.body.success).toBe(true);
    });

    it("должен вернуть 200 для несуществующего ID (сервис не выбрасывает ошибку)", async () => {
        const response = await request(app)
            .delete('/api/categories/999999')
            .expect(200);
        
        // Сервис возвращает false, но не выбрасывает ошибку
        expect(response.body.success).toBe(true);
    });

    it("должен вернуть 400 при невалидном ID", async () => {
        const response = await request(app)
            .delete('/api/categories/invalid')
            .expect(400);
        
        expect(response.body.success).toBe(false);
    });
});

