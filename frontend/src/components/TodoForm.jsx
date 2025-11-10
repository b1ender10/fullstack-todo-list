import { useState, useEffect } from 'react'
import { createTodo, updateTodo } from '../services/api'

function TodoForm({ editingTodo, onTodoCreated, onTodoUpdated, onCancel }) {
  const [priority, setPriority] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title)
      setDescription(editingTodo.description || '')
      setPriority(editingTodo.priority)
    } else {
      resetForm()
    }
  }, [editingTodo])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setError(null)
    setPriority('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Название задачи обязательно')
      return
    }

    setSubmitting(true)

    try {
      if (editingTodo) {
        await updateTodo(editingTodo.id, {
          title: trimmedTitle,
          description: description.trim(),
          priority: Number(priority)
        })
        onTodoUpdated()
      } else {
        await createTodo({
          title: trimmedTitle,
          description: description.trim(),
          priority: Number(priority)
        })
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

