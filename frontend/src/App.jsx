import { useState, useEffect, useCallback, useRef } from 'react'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import { getAllTodos, getAllDeletedTodos, batchDeleteTodos, batchSoftDeleteTodos, batchRestoreTodos, searchTodos, getAllCategories } from './services/api'
import './styles.css'

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingTodo, setEditingTodo] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [completedFilter, setCompletedFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const pageRef = useRef(1)
  const [limit] = useState(3)
  const [hasMore, setHasMore] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState('main')
  
  // Состояния для поиска
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const searchTimeoutRef = useRef(null)
  
  // Состояния для страницы удаленных задач
  const [deletedTodos, setDeletedTodos] = useState([])
  const [deletedLoading, setDeletedLoading] = useState(false)
  const [deletedError, setDeletedError] = useState(null)
  const [deletedPage, setDeletedPage] = useState(1)
  const deletedPageRef = useRef(1)
  const [deletedHasMore, setDeletedHasMore] = useState(false)
  const [deletedPagination, setDeletedPagination] = useState(null)
  const [deletedSelectedIds, setDeletedSelectedIds] = useState(new Set())

  // Загрузка категорий при монтировании
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getAllCategories()
        const categoriesData = result?.data?.data?.data || result?.data?.data || result?.data || []
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (err) {
        console.error('Ошибка загрузки категорий:', err)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    setSearchQuery('')
    setSearchResults([])
    if (currentPage === 'main') {
      loadTodos()
    } else {
      loadDeletedTodos()
    }
  }, [currentPage])

  // Debounce для поиска
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim() === '') {
      setSearchResults([])
      setSearchError(null)
      setSelectedIds(new Set())
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTodos(searchQuery.trim())
        setSearchResults(results)
        setSelectedIds(new Set())
      } catch (err) {
        setSearchError(`Ошибка поиска: ${err.message}`)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const loadTodos = useCallback(async (overrides = {}, append = false) => {
    const nextPriority = overrides.priority ?? priorityFilter
    const nextCompleted = overrides.completed ?? completedFilter
    const nextCategory = overrides.categoryId ?? categoryFilter
    const nextSortBy = overrides.sortBy ?? sortBy
    const nextSortOrder = overrides.sortOrder ?? sortOrder
    
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
        categoryId: !nextCategory || nextCategory === 'all' ? undefined : nextCategory,
        page: currentPage,
        limit,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      })
      
      // Проверяем, вернулся ли объект с pagination или просто массив
      if (result.pagination) {
        // Объект с data и pagination
        const todosData = result.data
      if (append) {
        setTodos(prev => [...prev, ...todosData])
      } else {
        setTodos(todosData)
        setSelectedIds(new Set())
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
          setSelectedIds(new Set())
        }
        setPagination(null)
        setHasMore(false)
      }
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [priorityFilter, completedFilter, categoryFilter, sortBy, sortOrder, limit])

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

  const handleSelectTodo = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === todos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(todos.map(t => t.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    
    const idsArray = Array.from(selectedIds).map(id => Number(id))
    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedIds.size} задач?`)) {
      return
    }

    try {
      await batchDeleteTodos(idsArray)
      setSelectedIds(new Set())
      loadTodos()
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  const handleBatchSoftDelete = async () => {
    if (selectedIds.size === 0) return
    
    const idsArray = Array.from(selectedIds).map(id => Number(id))
    if (!window.confirm(`Вы уверены, что хотите пометить как удаленные ${selectedIds.size} задач?`)) {
      return
    }

    try {
      await batchSoftDeleteTodos(idsArray)
      setSelectedIds(new Set())
      loadTodos()
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  const loadDeletedTodos = useCallback(async (append = false) => {
    if (!append) {
      setDeletedLoading(true)
    }
    setDeletedError(null)

    try {
      const currentPage = append ? deletedPageRef.current + 1 : 1
      
      if (append) {
        deletedPageRef.current = currentPage
        setDeletedPage(currentPage)
      } else {
        deletedPageRef.current = 1
        setDeletedPage(1)
      }
      
      const result = await getAllDeletedTodos({
        page: currentPage,
        limit,
      })
      
      if (result.pagination) {
        const todosData = result.data
        if (append) {
          setDeletedTodos(prev => [...prev, ...todosData])
        } else {
          setDeletedTodos(todosData)
          setDeletedSelectedIds(new Set())
        }
        setDeletedPagination(result.pagination)
        setDeletedHasMore(result.pagination.page < result.pagination.totalPages)
      } else {
        if (append) {
          setDeletedTodos(prev => [...prev, ...result])
        } else {
          setDeletedTodos(result)
          setDeletedSelectedIds(new Set())
        }
        setDeletedPagination(null)
        setDeletedHasMore(false)
      }
    } catch (err) {
      setDeletedError(`Ошибка: ${err.message}`)
    } finally {
      setDeletedLoading(false)
    }
  }, [limit])

  const handleSelectDeletedTodo = (id) => {
    setDeletedSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAllDeleted = () => {
    if (deletedSelectedIds.size === deletedTodos.length) {
      setDeletedSelectedIds(new Set())
    } else {
      setDeletedSelectedIds(new Set(deletedTodos.map(t => t.id)))
    }
  }

  const handleBatchRestore = async () => {
    if (deletedSelectedIds.size === 0) return
    
    const idsArray = Array.from(deletedSelectedIds).map(id => Number(id))
    if (!window.confirm(`Вы уверены, что хотите восстановить ${deletedSelectedIds.size} задач?`)) {
      return
    }

    try {
      await batchRestoreTodos(idsArray)
      setDeletedSelectedIds(new Set())
      loadDeletedTodos()
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>📝 Мои Задачи</h1>
        <p className="subtitle">Простое CRUD приложение</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCurrentPage('main')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentPage === 'main' ? '#007bff' : '#f0f0f0',
              color: currentPage === 'main' ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Основные задачи
          </button>
          <button
            onClick={() => setCurrentPage('deleted')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentPage === 'deleted' ? '#007bff' : '#f0f0f0',
              color: currentPage === 'deleted' ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Удаленные задачи
          </button>
        </div>
      </header>

      {currentPage === 'main' ? (
        <>
          <TodoForm
            editingTodo={editingTodo}
            onTodoCreated={handleTodoCreated}
            onTodoUpdated={handleTodoUpdated}
            onCancel={handleCancelEdit}
            categories={categories}
          />

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Поиск по заголовку или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {searchQuery.trim() ? (
            <div className="todos-container">
              {searchLoading && <div className="loading">Поиск...</div>}
              {searchError && <div className="error">{searchError}</div>}
              {!searchLoading && !searchError && (
                <>
                  {searchResults.length > 0 && (
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === searchResults.length && searchResults.length > 0}
                        onChange={() => {
                          if (selectedIds.size === searchResults.length) {
                            setSelectedIds(new Set())
                          } else {
                            setSelectedIds(new Set(searchResults.map(t => t.id)))
                          }
                        }}
                      />
                      <span>Выбрать все ({searchResults.length} найдено)</span>
                      {selectedIds.size > 0 && (
                        <>
                          <button
                            onClick={handleBatchSoftDelete}
                            style={{ padding: '8px 16px', fontSize: '14px', marginLeft: '10px' }}
                          >
                            Пометить удаленными ({selectedIds.size})
                          </button>
                          <button
                            onClick={handleBatchDelete}
                            style={{ padding: '8px 16px', fontSize: '14px', marginLeft: '10px' }}
                          >
                            Удалить выбранные ({selectedIds.size})
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <TodoList
                    todos={searchResults}
                    selectedIds={selectedIds}
                    onTodoUpdated={() => {
                      setSearchQuery('')
                      loadTodos()
                    }}
                    onEdit={handleEdit}
                    onDelete={() => {
                      setSearchQuery('')
                      loadTodos()
                    }}
                    onSelect={handleSelectTodo}
                    categories={categories}
                  />
                  {searchResults.length === 0 && !searchLoading && (
                    <div className="empty-state">
                      <p>Ничего не найдено</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
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

                <select onChange={(e) => {
                  const value = e.target.value
                  setCategoryFilter(value)
                  loadTodos({ categoryId: value }, false)
                }}>
                    <option value="all">Все категории</option>
                    {Array.isArray(categories) && categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select onChange={(e) => {
                  const value = e.target.value
                  setSortBy(value)
                  loadTodos({ sortBy: value }, false)
                }} value={sortBy}>
                  <option value="created_at">По дате создания</option>
                  <option value="updated_at">По дате обновления</option>
                  <option value="title">По заголовку</option>
                  <option value="description">По описанию</option>
                  <option value="priority">По приоритету</option>
                </select>

                <select onChange={(e) => {
                  const value = e.target.value
                  setSortOrder(value)
                  loadTodos({ sortOrder: value }, false)
                }} value={sortOrder}>
                  <option value="desc">По убыванию</option>
                  <option value="asc">По возрастанию</option>
                </select>
              </div>

              <div className="todos-container">
                {loading && page === 1 && <div className="loading">Загрузка...</div>}
                {error && <div className="error">{error}</div>}
                {!loading && !error && (
                  <>
                    {todos.length > 0 && (
                      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === todos.length && todos.length > 0}
                          onChange={handleSelectAll}
                        />
                        <span>Выбрать все</span>
                        {selectedIds.size > 0 && (
                          <>
                            <button
                              onClick={handleBatchSoftDelete}
                              style={{ padding: '8px 16px', fontSize: '14px', marginLeft: '10px' }}
                            >
                              Пометить удаленными ({selectedIds.size})
                            </button>
                            <button
                              onClick={handleBatchDelete}
                              style={{ padding: '8px 16px', fontSize: '14px', marginLeft: '10px' }}
                            >
                              Удалить выбранные ({selectedIds.size})
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <TodoList
                      todos={todos}
                      selectedIds={selectedIds}
                      onTodoUpdated={loadTodos}
                      onEdit={handleEdit}
                      onDelete={loadTodos}
                      onSelect={handleSelectTodo}
                      categories={categories}
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
            </>
          )}
        </>
      ) : (
        <div className="todos-container">
          {deletedLoading && deletedPage === 1 && <div className="loading">Загрузка...</div>}
          {deletedError && <div className="error">{deletedError}</div>}
          {!deletedLoading && !deletedError && (
            <>
              {deletedTodos.length > 0 && (
                <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={deletedSelectedIds.size === deletedTodos.length && deletedTodos.length > 0}
                    onChange={handleSelectAllDeleted}
                  />
                  <span>Выбрать все</span>
                  {deletedSelectedIds.size > 0 && (
                    <button
                      onClick={handleBatchRestore}
                      style={{ padding: '8px 16px', fontSize: '14px', marginLeft: '10px' }}
                    >
                      Восстановить выбранные ({deletedSelectedIds.size})
                    </button>
                  )}
                </div>
              )}
              <TodoList
                todos={deletedTodos}
                selectedIds={deletedSelectedIds}
                onTodoUpdated={loadDeletedTodos}
                onEdit={() => {}}
                onDelete={loadDeletedTodos}
                onSelect={handleSelectDeletedTodo}
                categories={categories}
              />
              {deletedHasMore && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button 
                    onClick={() => loadDeletedTodos(true)}
                    disabled={deletedLoading}
                    style={{ padding: '10px 20px', fontSize: '16px' }}
                  >
                    {deletedLoading ? 'Загрузка...' : 'Загрузить еще'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App

