package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
)

type Todo struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

var (
	todos = make(map[int]Todo)
	mu    sync.Mutex
	idSeq = 1
)

func main() {
	// Using Go 1.22+ enhanced routing features
	http.HandleFunc("GET /todos", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		list := make([]Todo, 0, len(todos))
		for _, t := range todos {
			list = append(list, t)
		}
		json.NewEncoder(w).Encode(list)
	})

	http.HandleFunc("POST /todos", func(w http.ResponseWriter, r *http.Request) {
		var t Todo
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		t.ID = idSeq
		todos[idSeq] = t
		idSeq++
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(t)
	})

	http.HandleFunc("PUT /todos/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(r.PathValue("id"))
		mu.Lock()
		defer mu.Unlock()
		if _, ok := todos[id]; !ok {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		
		var t Todo
		json.NewDecoder(r.Body).Decode(&t)
		t.ID = id
		todos[id] = t
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(t)
	})

	http.HandleFunc("DELETE /todos/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(r.PathValue("id"))
		mu.Lock()
		defer mu.Unlock()
		delete(todos, id)
		w.WriteHeader(http.StatusNoContent)
	})

	http.ListenAndServe(":8080", nil)
}
