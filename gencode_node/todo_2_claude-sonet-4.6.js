import http from "http";

let todos = [];
let nextId = 1;

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/|\/$/g, "").split("/");
  const method = req.method;

  // GET /todos
  if (method === "GET" && parts[0] === "todos" && !parts[1]) {
    return json(res, 200, todos);
  }

  // GET /todos/:id
  if (method === "GET" && parts[0] === "todos" && parts[1]) {
    const todo = todos.find((t) => t.id === Number(parts[1]));
    return todo ? json(res, 200, todo) : json(res, 404, { error: "Not found" });
  }

  // POST /todos
  if (method === "POST" && parts[0] === "todos" && !parts[1]) {
    try {
      const body = await readBody(req);
      if (!body.title?.trim()) {
        return json(res, 400, { error: "title is required" });
      }
      const todo = { id: nextId++, title: body.title.trim(), completed: false };
      todos.push(todo);
      return json(res, 201, todo);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }

  // PATCH /todos/:id
  if (method === "PATCH" && parts[0] === "todos" && parts[1]) {
    const idx = todos.findIndex((t) => t.id === Number(parts[1]));
    if (idx === -1) return json(res, 404, { error: "Not found" });
    try {
      const body = await readBody(req);
      if (body.title !== undefined) todos[idx].title = body.title.trim();
      if (body.completed !== undefined) todos[idx].completed = Boolean(body.completed);
      return json(res, 200, todos[idx]);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }

  // DELETE /todos/:id
  if (method === "DELETE" && parts[0] === "todos" && parts[1]) {
    const idx = todos.findIndex((t) => t.id === Number(parts[1]));
    if (idx === -1) return json(res, 404, { error: "Not found" });
    todos.splice(idx, 1);
    return json(res, 204, null);
  }

  // DELETE /todos  (clear all)
  if (method === "DELETE" && parts[0] === "todos" && !parts[1]) {
    todos = [];
    return json(res, 204, null);
  }

  json(res, 404, { error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Todo server running on http://localhost:${PORT}`));
