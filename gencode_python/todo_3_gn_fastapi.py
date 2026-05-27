from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Todo API")

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class Todo(TodoBase):
    id: int

todos_db: List[Todo] = []
current_id = 1

@app.post("/todos/", response_model=Todo)
def create_todo(todo: TodoBase):
    global current_id
    new_todo = Todo(id=current_id, **todo.model_dump())
    todos_db.append(new_todo)
    current_id += 1
    return new_todo

@app.get("/todos/", response_model=List[Todo])
def get_todos():
    return todos_db

@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: int):
    for todo in todos_db:
        if todo.id == todo_id:
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")

@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, updated_todo: TodoBase):
    for i, todo in enumerate(todos_db):
        if todo.id == todo_id:
            todos_db[i] = Todo(id=todo_id, **updated_todo.model_dump())
            return todos_db[i]
    raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    for i, todo in enumerate(todos_db):
        if todo.id == todo_id:
            del todos_db[i]
            return {"message": "Todo deleted"}
    raise HTTPException(status_code=404, detail="Todo not found")
