import { useState } from 'react'
import { updateTodo, deleteTodo } from '../services/api'

function TodoItem({ todo, isSelected, onToggle, onEdit, onDelete, onSelect, categories = [] }) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async (e) => {
    const completed = e.target.checked
    setIsToggling(true)

    try {
      await updateTodo(todo.id, { completed })
      onToggle()
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
      // Возвращаем чекбокс в исходное состояние
      e.target.checked = !completed
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return
    }

    try {
      await deleteTodo(todo.id)
      onDelete()
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Категории теперь приходят как массив todo.categories
  const todoCategories = Array.isArray(todo.categories) ? todo.categories : []

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-header">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(todo.id)}
          style={{ marginRight: '10px' }}
        />
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          disabled={isToggling}
        />
        <div className="todo-content">
          <div className="todo-title">
            {todo.title}
            {todoCategories.length > 0 && (
              <span style={{ marginLeft: '10px', display: 'inline-flex', gap: '5px', flexWrap: 'wrap' }}>
                {todoCategories.map(cat => (
                  <span
                    key={cat.id}
                    style={{ 
                      padding: '2px 8px', 
                      backgroundColor: cat.color || '#e0e0e0', 
                      borderRadius: '4px', 
                      fontSize: '0.85em',
                      color: '#000'
                    }}
                  >
                    {cat.name}
                  </span>
                ))}
              </span>
            )}
          </div>
          {todo.description && (
            <div className="todo-description">{todo.description}</div>
          )}
        </div>
      </div>
      <div className="todo-meta">
        <div>
          Создано: {formatDate(todo.created_at)}
          {todo.updated_at !== todo.created_at && (
            <> • Обновлено: {formatDate(todo.updated_at)}</>
          )}
        </div>
        <div className="todo-actions">
          <button className="btn-edit" onClick={() => onEdit(todo)}>
            ✏️ Редактировать
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            🗑️ Удалить
          </button>
        </div>
      </div>
    </li>
  )
}

export default TodoItem

