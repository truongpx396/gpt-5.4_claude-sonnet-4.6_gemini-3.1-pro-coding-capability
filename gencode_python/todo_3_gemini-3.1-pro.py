import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse

todos = []
current_id = 1

class TodoHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _send_response(self, status, payload=None):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        if payload is not None:
            self.wfile.write(json.dumps(payload).encode('utf-8'))

    def _get_id(self):
        path_parts = self.path.split('/')
        if len(path_parts) > 2 and path_parts[2].isdigit():
            return int(path_parts[2])
        return None

    def do_GET(self):
        if self.path == '/todos' or self.path == '/todos/':
            self._send_response(200, todos)
        elif self.path.startswith('/todos/'):
            todo_id = self._get_id()
            todo = next((t for t in todos if t['id'] == todo_id), None)
            if todo:
                self._send_response(200, todo)
            else:
                self._send_response(404, {'error': 'Not found'})
        else:
            self._send_response(404, {'error': 'Not found'})

    def do_POST(self):
        if self.path == '/todos' or self.path == '/todos/':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            global current_id
            todo = {
                'id': current_id,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'completed': data.get('completed', False)
            }
            todos.append(todo)
            current_id += 1
            self._send_response(201, todo)
        else:
            self._send_response(404, {'error': 'Not found'})

    def do_PUT(self):
        if self.path.startswith('/todos/'):
            todo_id = self._get_id()
            todo = next((t for t in todos if t['id'] == todo_id), None)
            if todo:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                
                todo['title'] = data.get('title', todo['title'])
                todo['description'] = data.get('description', todo['description'])
                todo['completed'] = data.get('completed', todo['completed'])
                
                self._send_response(200, todo)
            else:
                self._send_response(404, {'error': 'Not found'})
        else:
            self._send_response(404, {'error': 'Not found'})

    def do_DELETE(self):
        if self.path.startswith('/todos/'):
            todo_id = self._get_id()
            global todos
            initial_len = len(todos)
            todos = [t for t in todos if t['id'] != todo_id]
            if len(todos) < initial_len:
                self._send_response(200, {'message': 'Deleted'})
            else:
                self._send_response(404, {'error': 'Not found'})
        else:
            self._send_response(404, {'error': 'Not found'})

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, TodoHandler)
    print('Starting server on port 8000...')
    httpd.serve_forever()
