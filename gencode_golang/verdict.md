# Verdict: Go Todo API — Model Comparison

**Ranking:** `todo_2_claude-sonet-4.6.go` > `todo_1_gpt-5.4.go` > `todo_3_gemini-3.1-pro.go`

---

## 1. `todo_2_claude-sonet-4.6.go` — Best

### Strengths

- Modern Go 1.22+ routing with `mux.HandleFunc("/todos/{id}", ...)` + `r.PathValue("id")` — no manual `strings.TrimPrefix` hacks.
- `jsonResponse()` helper ([line 24](todo_2_claude-sonet-4.6.go#L24)) removes duplication of `Content-Type` + `WriteHeader` + `Encode`.
- Structured JSON error responses (`{"error": "..."}`) instead of plain text — frontends can parse them.
- `switch r.Method` ([line 79](todo_2_claude-sonet-4.6.go#L79)) is cleaner than chained `if`s.
- Pointer fields on the PUT body ([lines 84–87](todo_2_claude-sonet-4.6.go#L84)) → real partial updates (omitted ≠ zeroed).
- Validates input (`body.Title == ""`).
- Uses an explicit `http.NewServeMux()` instead of the default mux (avoids accidental handler collisions if imported as a package).
- Includes useful metadata (`CreatedAt`).
- Supports `GET /todos/{id}` for single-resource fetch.

### Minor Issues

- Holds `mu` during JSON encode on list (small contention).
- `ListenAndServe` error is ignored.

---

## 2. `todo_1_gpt-5.4.go` — Decent but Dated

### Good

- Validates input with `strings.TrimSpace` ([line 41](todo_1_gpt-5.4.go#L41)).
- Uses `PATCH` with pointer fields (semantically correct for partial updates).
- Logs the listening port.

### Bad

- Manual path parsing via `strings.TrimPrefix(r.URL.Path, "/todos/")` ([line 59](todo_1_gpt-5.4.go#L59)) — pre-1.22 style, fragile.
- Plain-text errors via `http.Error`.
- Loop-and-branch inside iteration ([lines 66–91](todo_1_gpt-5.4.go#L66)) mixes lookup with method dispatch and is hard to read.
- No `GET /todos/{id}`.

---

## 3. `todo_3_gemini-3.1-pro.go` — Worst

### Critical Problems

- **Silently ignored errors** — `strconv.Atoi(r.PathValue("id"))` ([line 53](todo_3_gemini-3.1-pro.go#L53), [line 71](todo_3_gemini-3.1-pro.go#L71)) and `json.NewDecoder(r.Body).Decode(&t)` ([line 62](todo_3_gemini-3.1-pro.go#L62)) — bad input produces `id=0` or partial state instead of a `400`.
- **Non-deterministic list order** — `todos` is a `map[int]Todo` ([line 17](todo_3_gemini-3.1-pro.go#L17)), so `GET /todos` returns items in random order every call. Awful API contract.
- **No input validation** — empty/garbage body is accepted on POST.
- **PUT clobbers everything** — the body fully overwrites the record ([line 64](todo_3_gemini-3.1-pro.go#L64)); omitting `completed` silently flips it to `false`.
- All handlers as anonymous funcs inside `main` — hard to test.
- `ListenAndServe` error is dropped.
- No content-type helper; repeated `w.Header().Set` everywhere.

### One Thing It Does Well

Uses Go 1.22+ method-aware routing (`"GET /todos"`) — but `todo_2_claude-sonet-4.6.go` uses the same routing without any of the other problems.

---

## Bottom Line

`todo_2_claude-sonet-4.6.go` wins because it pairs modern routing, proper partial updates, structured JSON errors, and input validation in a layout that's easy to maintain. `todo_1_gpt-5.4.go` has the right semantics (`PATCH`, validation) but uses old-style routing and plaintext errors. `todo_3_gemini-3.1-pro.go` looks modern but fails the basics — error handling, validation, and a stable list order — making it the least production-ready of the three.
