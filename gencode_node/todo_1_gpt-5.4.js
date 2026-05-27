import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const todos = []

const send = (res, status, data) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  })
  res.end(JSON.stringify(data))
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body ? JSON.parse(body) : {}))
    req.on('error', reject)
  })

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  const id = url.pathname.split('/')[2]
  const todo = todos.find((item) => item.id === id)

  try {
    if (req.method === 'OPTIONS') return send(res, 204, {})
    if (url.pathname === '/todos' && req.method === 'GET') return send(res, 200, todos)
    if (url.pathname === '/todos' && req.method === 'POST') {
      const { text = '' } = await readBody(req)
      if (!text.trim()) return send(res, 400, { error: 'text is required' })
      const newTodo = { id: randomUUID(), text: text.trim(), completed: false, createdAt: Date.now() }
      todos.push(newTodo)
      return send(res, 201, newTodo)
    }
    if (url.pathname.startsWith('/todos/') && req.method === 'GET') {
      return todo ? send(res, 200, todo) : send(res, 404, { error: 'todo not found' })
    }
    if (url.pathname.startsWith('/todos/') && req.method === 'PATCH') {
      if (!todo) return send(res, 404, { error: 'todo not found' })
      const { text, completed } = await readBody(req)
      if (typeof text === 'string') todo.text = text.trim() || todo.text
      if (typeof completed === 'boolean') todo.completed = completed
      return send(res, 200, todo)
    }
    if (url.pathname.startsWith('/todos/') && req.method === 'DELETE') {
      const index = todos.findIndex((item) => item.id === id)
      if (index === -1) return send(res, 404, { error: 'todo not found' })
      const [deleted] = todos.splice(index, 1)
      return send(res, 200, deleted)
    }
    return send(res, 404, { error: 'route not found' })
  } catch {
    return send(res, 400, { error: 'invalid request body' })
  }
}).listen(3001, () => console.log('Todo API running on http://localhost:3001'))