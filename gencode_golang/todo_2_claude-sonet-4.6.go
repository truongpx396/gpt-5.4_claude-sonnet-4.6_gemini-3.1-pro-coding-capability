package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type Todo struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"createdAt"`
}

var (
	todos  []Todo
	nextID = 1
	mu     sync.Mutex
)

func jsonResponse(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func todosHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.Lock()
		defer mu.Unlock()
		jsonResponse(w, http.StatusOK, todos)

	case http.MethodPost:
		var body struct {
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
			return
		}
		mu.Lock()
		t := Todo{ID: nextID, Title: body.Title, CreatedAt: time.Now()}
		nextID++
		todos = append(todos, t)
		mu.Unlock()
		jsonResponse(w, http.StatusCreated, t)

	default:
		jsonResponse(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func todoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	idx := -1
	for i, t := range todos {
		if t.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		jsonResponse(w, http.StatusOK, todos[idx])

	case http.MethodPut:
		var body struct {
			Title     *string `json:"title"`
			Completed *bool   `json:"completed"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
			return
		}
		if body.Title != nil {
			todos[idx].Title = *body.Title
		}
		if body.Completed != nil {
			todos[idx].Completed = *body.Completed
		}
		jsonResponse(w, http.StatusOK, todos[idx])

	case http.MethodDelete:
		todos = append(todos[:idx], todos[idx+1:]...)
		w.WriteHeader(http.StatusNoContent)

	default:
		jsonResponse(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/todos", todosHandler)
	mux.HandleFunc("/todos/{id}", todoHandler)
	http.ListenAndServe(":8080", mux)
}
