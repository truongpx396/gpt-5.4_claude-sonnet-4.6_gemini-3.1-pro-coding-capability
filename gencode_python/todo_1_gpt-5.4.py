import json
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

TODOS = []


def send(handler, status, payload=None):
    body = b"" if payload is None else json.dumps(payload).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
    handler.end_headers()
    if body:
        handler.wfile.write(body)


def read_json(handler):
    size = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(size) if size else b"{}"
    return json.loads(raw)


class TodoHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        send(self, 204)

    def do_GET(self):
        if self.path == "/todos":
            return send(self, 200, TODOS)
        send(self, 404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/todos":
            return send(self, 404, {"error": "Not found"})
        data = read_json(self)
        text = str(data.get("text", "")).strip()
        if not text:
            return send(self, 400, {"error": "text is required"})
        todo = {
            "id": uuid.uuid4().hex,
            "text": text,
            "completed": False,
            "createdAt": int(time.time() * 1000),
        }
        TODOS.insert(0, todo)
        send(self, 201, todo)

    def do_PATCH(self):
        todo = self.find_todo()
        if not todo:
            return send(self, 404, {"error": "Todo not found"})
        data = read_json(self)
        if "text" in data:
            todo["text"] = str(data["text"]).strip() or todo["text"]
        if "completed" in data:
            todo["completed"] = bool(data["completed"])
        send(self, 200, todo)

    def do_DELETE(self):
        todo = self.find_todo()
        if not todo:
            return send(self, 404, {"error": "Todo not found"})
        TODOS.remove(todo)
        send(self, 200, {"deleted": todo["id"]})

    def find_todo(self):
        parts = self.path.strip("/").split("/")
        if len(parts) != 2 or parts[0] != "todos":
            return None
        return next((item for item in TODOS if item["id"] == parts[1]), None)

    def log_message(self, *_):
        return


if __name__ == "__main__":
    print("Serving todos at http://127.0.0.1:8000")
    HTTPServer(("127.0.0.1", 8000), TodoHandler).serve_forever()