import { useState, useEffect, useCallback } from 'react'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import { getAllTodos } from './services/api'
import './styles.css'

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingTodo, setEditingTodo] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [completedFilter, setCompletedFilter] = useState('all')

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = useCallback(async (overrides = {}) => {
    const nextPriority = overrides.priority ?? priorityFilter
    const nextCompleted = overrides.completed ?? completedFilter
    setLoading(true)
    setError(null)

    try {
      const data = await getAllTodos({
        priority: !nextPriority || nextPriority === 'all' ? undefined : nextPriority,
        completed: !nextCompleted || nextCompleted === 'all' ? undefined : nextCompleted,
      })
      setTodos(data)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [priorityFilter, completedFilter])

  const handleTodoCreated = () => {
    loadTodos()
    setEditingTodo(null)
  }

  const handleTodoUpdated = () => {
    loadTodos()
    setEditingTodo(null)
  }

  const handleEdit = (todo) => {
    setEditingTodo(todo)
    // Прокрутка к форме
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingTodo(null)
  }

  return (
    <div className="container">
      <header>
        <h1>📝 Мои Задачи</h1>
        <p className="subtitle">Простое CRUD приложение</p>
      </header>

      <TodoForm
        editingTodo={editingTodo}
        onTodoCreated={handleTodoCreated}
        onTodoUpdated={handleTodoUpdated}
        onCancel={handleCancelEdit}
      />

      <div>
        <select onChange={(e) => {
          const value = e.target.value
          setPriorityFilter(value)
          loadTodos({ priority: value })
        }}>
          <option value="">All</option>
          <option value="1">Low</option>
          <option value="2">Medium</option>
          <option value="3">High</option>
        </select>

        <select onChange={(e) => {
          const value = e.target.value
          setCompletedFilter(value)
          loadTodos({ completed: value })
        }}>
          <option value="">All</option>
          <option value="true">Completed</option>
          <option value="false">Not Completed</option>
        </select>
      </div>

      <div className="todos-container">
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <TodoList
            todos={todos}
            onTodoUpdated={loadTodos}
            onEdit={handleEdit}
            onDelete={loadTodos}
          />
        )}
      </div>
    </div>
  )
}

export default App

