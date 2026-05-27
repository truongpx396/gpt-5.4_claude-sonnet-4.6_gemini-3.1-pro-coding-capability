from http.server import BaseHTTPRequestHandler, HTTPServer
import json, uuid

todos: dict = {}

def make_todo(title: str) -> dict:
    tid = str(uuid.uuid4())
    todos[tid] = {"id": tid, "title": title, "completed": False}
    return todos[tid]

def send(handler, status: int, body):
    data = json.dumps(body).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(data)

def read_body(handler) -> dict:
    length = int(handler.headers.get("Content-Length", 0))
    return json.loads(handler.rfile.read(length)) if length else {}

class TodoHandler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass  # silence default logs

    def do_OPTIONS(self):
        send(self, 204, {})

    def do_GET(self):
        if self.path == "/todos":
            send(self, 200, list(todos.values()))
        elif self.path.startswith("/todos/"):
            tid = self.path.split("/")[-1]
            todo = todos.get(tid)
            send(self, 200, todo) if todo else send(self, 404, {"error": "Not found"})
        else:
            send(self, 404, {"error": "Not found"})

    def do_POST(self):
        if self.path == "/todos":
            body = read_body(self)
            title = (body.get("title") or "").strip()
            if not title:
                send(self, 400, {"error": "title is required"})
                return
            send(self, 201, make_todo(title))
        else:
            send(self, 404, {"error": "Not found"})

    def do_PUT(self):
        if self.path.startswith("/todos/"):
            tid = self.path.split("/")[-1]
            todo = todos.get(tid)
            if not todo:
                send(self, 404, {"error": "Not found"})
                return
            body = read_body(self)
            if "title" in body:
                todo["title"] = body["title"].strip() or todo["title"]
            if "completed" in body:
                todo["completed"] = bool(body["completed"])
            send(self, 200, todo)
        else:
            send(self, 404, {"error": "Not found"})

    def do_DELETE(self):
        if self.path.startswith("/todos/"):
            tid = self.path.split("/")[-1]
            todo = todos.pop(tid, None)
            send(self, 200, todo) if todo else send(self, 404, {"error": "Not found"})
        else:
            send(self, 404, {"error": "Not found"})

if __name__ == "__main__":
    server = HTTPServer(("localhost", 8000), TodoHandler)
    print("Todo API running at http://localhost:8000")
    print("  GET    /todos         — list all")
    print("  GET    /todos/:id     — get one")
    print("  POST   /todos         — create  { title }")
    print("  PUT    /todos/:id     — update  { title?, completed? }")
    print("  DELETE /todos/:id     — delete")
    server.serve_forever()
