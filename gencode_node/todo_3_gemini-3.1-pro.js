const http = require('http');

let todos = [];
let nextId = 1;

const server = http.createServer(async (req, res) => {
  // Setup basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  res.setHeader('Content-Type', 'application/json');

  // Helper to read request body
  const getBody = async () => {
    let body = '';
    for await (const chunk of req) body += chunk.toString();
    return body ? JSON.parse(body) : {};
  };

  const path = req.url.split('?')[0];

  try {
    // GET /api/todos - List all todos
    if (path === '/api/todos' && req.method === 'GET') {
      res.writeHead(200);
      return res.end(JSON.stringify(todos));
    }

    // POST /api/todos - Create new todo
    if (path === '/api/todos' && req.method === 'POST') {
      const data = await getBody();
      if (!data.title) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Title is required' }));
      }
      const newTodo = { id: nextId++, title: data.title, completed: false };
      todos.push(newTodo);
      res.writeHead(201);
      return res.end(JSON.stringify(newTodo));
    }

    // Capture ID for PUT/DELETE /api/todos/:id
    const idMatch = path.match(/^\/api\/todos\/(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const index = todos.findIndex(t => t.id === id);

      if (index === -1) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Todo not found' }));
      }

      // PUT /api/todos/:id - Update todo
      if (req.method === 'PUT') {
        const data = await getBody();
        todos[index] = { ...todos[index], ...data, id }; // id stays the same
        res.writeHead(200);
        return res.end(JSON.stringify(todos[index]));
      }

      // DELETE /api/todos/:id - Delete todo
      if (req.method === 'DELETE') {
        const deleted = todos.splice(index, 1);
        res.writeHead(200);
        return res.end(JSON.stringify(deleted[0]));
      }
    }

    // 404 Not Found for any other route
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});