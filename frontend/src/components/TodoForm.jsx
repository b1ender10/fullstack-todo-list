import { useState, useEffect } from 'react'
import { createTodo, updateTodo, addCategoryToTodo, removeCategoryFromTodo } from '../services/api'

function TodoForm({ editingTodo, onTodoCreated, onTodoUpdated, onCancel, categories = [] }) {
  const [priority, setPriority] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title)
      setDescription(editingTodo.description || '')
      setPriority(editingTodo.priority)
      setCategoryId(editingTodo.category_id || '')
    } else {
      resetForm()
    }
  }, [editingTodo])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setError(null)
    setPriority('')
    setCategoryId('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Название задачи обязательно')
      return
    }

    if (!categoryId) {
      setError('Категория обязательна')
      return
    }

    setSubmitting(true)

    try {
      if (editingTodo) {
        // Сначала обновляем саму задачу
        await updateTodo(editingTodo.id, {
          title: trimmedTitle,
          description: description.trim(),
          priority: Number(priority)
        })
        
        // Затем обновляем категорию через отдельный эндпоинт
        const oldCategoryId = editingTodo.category_id
        const newCategoryId = Number(categoryId)
        
        if (oldCategoryId && oldCategoryId !== newCategoryId) {
          // Удаляем старую категорию и добавляем новую
          await removeCategoryFromTodo(editingTodo.id, oldCategoryId)
          await addCategoryToTodo(editingTodo.id, newCategoryId)
        } else if (!oldCategoryId) {
          // Если категории не было, просто добавляем
          await addCategoryToTodo(editingTodo.id, newCategoryId)
        }
        
        onTodoUpdated()
      } else {
        // Сначала создаем задачу
        const result = await createTodo({
          title: trimmedTitle,
          description: description.trim(),
          priority: Number(priority)
        })
        
        // Получаем ID созданной задачи из ответа
        const todoId = result?.data
        
        if (!todoId) {
          console.error('Не удалось получить ID созданной задачи. Структура ответа:', result)
          setError('Задача создана, но не удалось добавить категорию')
          setSubmitting(false)
          return
        }
        
        // Добавляем категорию через отдельный эндпоинт
        await addCategoryToTodo(todoId, Number(categoryId))
        onTodoCreated()
      }
      resetForm()
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Выберите приоритет</option>
          <option value="1">Низкий</option>
          <option value="2">Средний</option>
          <option value="3">Высокий</option>
        </select>
        <select 
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)}
          required
          disabled={submitting}
        >
          <option value="">Выберите категорию *</option>
          {Array.isArray(categories) && categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название задачи..."
          disabled={submitting}
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)..."
          rows="3"
          disabled={submitting}
        />
        {error && <div className="error">{error}</div>}
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {editingTodo ? 'Сохранить изменения' : 'Создать задачу'}
          </button>
          {editingTodo && (
            <button type="button" onClick={handleCancel} disabled={submitting}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default TodoForm

