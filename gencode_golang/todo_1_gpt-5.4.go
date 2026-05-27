package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

type Todo struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

var (
	mu    sync.Mutex
	next  = 1
	todos = []Todo{}
)

func main() {
	http.HandleFunc("/todos", todosHandler)
	http.HandleFunc("/todos/", todoHandler)
	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func todosHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodGet {
		mu.Lock()
		defer mu.Unlock()
		json.NewEncoder(w).Encode(todos)
		return
	}
	if r.Method == http.MethodPost {
		var in struct{ Text string `json:"text"` }
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil || strings.TrimSpace(in.Text) == "" {
			http.Error(w, "invalid todo", http.StatusBadRequest)
			return
		}
		mu.Lock()
		todo := Todo{ID: next, Text: in.Text}
		next++
		todos = append(todos, todo)
		mu.Unlock()
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(todo)
		return
	}
	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

func todoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/todos/"))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	mu.Lock()
	defer mu.Unlock()
	for i := range todos {
		if todos[i].ID != id {
			continue
		}
		if r.Method == http.MethodPatch {
			var in struct {
				Text *string `json:"text"`
				Done *bool   `json:"done"`
			}
			if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
				http.Error(w, "invalid todo", http.StatusBadRequest)
				return
			}
			if in.Text != nil { todos[i].Text = *in.Text }
			if in.Done != nil { todos[i].Done = *in.Done }
			json.NewEncoder(w).Encode(todos[i])
			return
		}
		if r.Method == http.MethodDelete {
			todos = append(todos[:i], todos[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.NotFound(w, r)
}