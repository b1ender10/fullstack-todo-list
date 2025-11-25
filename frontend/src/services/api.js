// API базовый URL
const API_URL = 'http://localhost:3000/api/todos'

// Вспомогательная функция для обработки ответов
async function handleResponse(response) {
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.message || 'Ошибка при выполнении запроса')
  }
  
  return result
}

// Получить все задачи
export async function getAllTodos(filters) {
  const filterWithoutUndefined = Object.fromEntries(Object.entries(filters).filter(([key, value]) => value !== undefined))
  const response = await fetch(API_URL + '?' + new URLSearchParams(filterWithoutUndefined).toString())
  const result = await handleResponse(response)
  
  // Если есть pagination, возвращаем объект, иначе просто data (массив)
  if (result.pagination) {
    return result
  }
  return result.data
}

// Получить задачу по ID
export async function getTodoById(id) {
  const response = await fetch(`${API_URL}/${id}`)
  return handleResponse(response)
}

// Создать новую задачу
export async function createTodo(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return handleResponse(response)
}

// Обновить задачу
export async function updateTodo(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return handleResponse(response)
}

// Удалить задачу
export async function deleteTodo(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
  return handleResponse(response)
}

// Массовое удаление задач
export async function batchDeleteTodos(ids) {
  const response = await fetch(`${API_URL}/batch`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  })
  return handleResponse(response)
}

// Массовое мягкое удаление задач
export async function batchSoftDeleteTodos(ids) {
  const response = await fetch(`${API_URL}/batch/soft`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  })
  return handleResponse(response)
}

// Получить все удаленные задачи
export async function getAllDeletedTodos(filters) {
  const filterWithoutUndefined = Object.fromEntries(Object.entries(filters).filter(([key, value]) => value !== undefined))
  const response = await fetch(`${API_URL}/deleted?` + new URLSearchParams(filterWithoutUndefined).toString())
  const result = await handleResponse(response)
  
  // Если есть pagination, возвращаем объект, иначе просто data (массив)
  if (result.pagination) {
    return result
  }
  return result.data
}

// Массовое восстановление задач
export async function batchRestoreTodos(ids) {
  const response = await fetch(`${API_URL}/batch/soft/restore`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  })
  return handleResponse(response)
}

// Поиск задач
export async function searchTodos(query) {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`)
  const result = await handleResponse(response)
  return result.data
}

