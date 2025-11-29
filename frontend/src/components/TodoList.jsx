import TodoItem from './TodoItem'

function TodoList({ todos, selectedIds, onTodoUpdated, onEdit, onDelete, onSelect, categories = [] }) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>Нет задач. Создайте первую!</p>
      </div>
    )
  }

  return (
    <ul className="todos-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isSelected={selectedIds.has(todo.id)}
          onToggle={onTodoUpdated}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          categories={categories}
        />
      ))}
    </ul>
  )
}

export default TodoList

