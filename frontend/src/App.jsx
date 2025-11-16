import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [page, setPage] = useState(1)
  const pageRef = useRef(1)
  const [limit] = useState(3)
  const [hasMore, setHasMore] = useState(false)
  const [pagination, setPagination] = useState(null)

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = useCallback(async (overrides = {}, append = false) => {
    const nextPriority = overrides.priority ?? priorityFilter
    const nextCompleted = overrides.completed ?? completedFilter
    
    if (!append) {
      setLoading(true)
    }
    setError(null)

    try {
      const currentPage = append ? pageRef.current + 1 : 1
      
      if (append) {
        pageRef.current = currentPage
        setPage(currentPage)
      } else {
        pageRef.current = 1
        setPage(1)
      }
      
      const result = await getAllTodos({
        priority: !nextPriority || nextPriority === 'all' ? undefined : nextPriority,
        completed: !nextCompleted || nextCompleted === 'all' ? undefined : nextCompleted,
        page: currentPage,
        limit,
      })
      
      // Проверяем, вернулся ли объект с pagination или просто массив
      if (result.pagination) {
        // Объект с data и pagination
        const todosData = result.data
        if (append) {
          setTodos(prev => [...prev, ...todosData])
        } else {
          setTodos(todosData)
        }
        setPagination(result.pagination)
        // Проверяем, есть ли еще страницы
        setHasMore(result.pagination.page < result.pagination.totalPages)
      } else {
        // Просто массив (пагинация не использовалась)
        if (append) {
          setTodos(prev => [...prev, ...result])
        } else {
          setTodos(result)
        }
        setPagination(null)
        setHasMore(false)
      }
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [priorityFilter, completedFilter, limit])

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
          loadTodos({ priority: value }, false)
        }}>
          <option value="">All</option>
          <option value="1">Low</option>
          <option value="2">Medium</option>
          <option value="3">High</option>
        </select>

        <select onChange={(e) => {
          const value = e.target.value
          setCompletedFilter(value)
          loadTodos({ completed: value }, false)
        }}>
          <option value="">All</option>
          <option value="true">Completed</option>
          <option value="false">Not Completed</option>
        </select>
      </div>

      <div className="todos-container">
        {loading && page === 1 && <div className="loading">Загрузка...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <>
            <TodoList
              todos={todos}
              onTodoUpdated={loadTodos}
              onEdit={handleEdit}
              onDelete={loadTodos}
            />
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  onClick={() => loadTodos({}, true)}
                  disabled={loading}
                  style={{ padding: '10px 20px', fontSize: '16px' }}
                >
                  {loading ? 'Загрузка...' : 'Загрузить еще'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App

