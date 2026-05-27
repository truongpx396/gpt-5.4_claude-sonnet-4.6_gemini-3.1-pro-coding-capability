import { useEffect, useState } from 'react'

type Todo = { id: number; text: string; done: boolean }

export default function TodoApp() {
  const [text, setText] = useState('')
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todo-app-items')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('todo-app-items', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    const value = text.trim()
    if (!value) return
    setTodos([{ id: Date.now(), text: value, done: false }, ...todos])
    setText('')
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Todo List</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() =>
                setTodos(todos.map((item) => item.id === todo.id ? { ...item, done: !item.done } : item))
              }
            />
            <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => setTodos(todos.filter((item) => item.id !== todo.id))}>Delete</button>
          </li>
        ))}
      </ul>

      {!!todos.length && (
        <button onClick={() => setTodos(todos.filter((todo) => !todo.done))}>Clear completed</button>
      )}
    </div>
  )
}