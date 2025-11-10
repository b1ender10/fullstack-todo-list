import TodoItem from './TodoItem'

function TodoList({ todos, onTodoUpdated, onEdit, onDelete }) {
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
          onToggle={onTodoUpdated}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TodoList

