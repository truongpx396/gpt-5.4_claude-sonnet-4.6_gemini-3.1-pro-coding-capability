# Verdict: Node.js Todo API — Model Comparison

**Ranking:** `todo_1_gpt-5.4.js` > `todo_2_claude-sonet-4.6.js` > `todo_3_gemini-3.1-pro.js`

---

## 1. `todo_1_gpt-5.4.js` — Best

### Why It Wins

- **UUID IDs** ([line 35](todo_1_gpt-5.4.js#L35)) — no collision risk; the other two use a `nextId++` counter that resets on every restart and would clash in a multi-instance setup.
- **Single `send()` helper** ([lines 6–14](todo_1_gpt-5.4.js#L6)) sets status, headers, CORS, and content-type in one call — no repetition. `todo_3` calls `res.writeHead` + `res.end` separately at every branch (10+ times).
- **Strict input validation on `PATCH`** ([lines 45–46](todo_1_gpt-5.4.js#L45)) — `typeof text === 'string'`, `typeof completed === 'boolean'`. `todo_3` does `{ ...todos[index], ...data, id }` which lets clients inject any field or break the schema (e.g. `completed: "yes"`).
- **Correct HTTP semantics** — uses `PATCH` for partial updates. `todo_3` uses `PUT` but implements partial-update behavior, which is semantically wrong (`PUT` means full replace).
- **CORS + OPTIONS preflight handled** ([line 30](todo_1_gpt-5.4.js#L30)) — `todo_2` lacks CORS entirely, so a browser frontend would fail.
- **Top-level `try/catch`** ([lines 56–58](todo_1_gpt-5.4.js#L56)) returns `400` for bad JSON, which is correct. `todo_3` returns `500` for the same case ([line 79](todo_3_gemini-3.1-pro.js#L79)), masking a client error as a server error.

---

## 2. `todo_2_claude-sonet-4.6.js` — Good but Incomplete

### Strengths

- Per-route JSON parse error handling is clean and explicit ([lines 51–53](todo_2_claude-sonet-4.6.js#L51)).
- Correct `204 No Content` for `DELETE` ([line 75](todo_2_claude-sonet-4.6.js#L75)).
- Trims input ([line 45](todo_2_claude-sonet-4.6.js#L45)).

### Main Miss

- No CORS — unusable from a browser frontend without a proxy.

---

## 3. `todo_3_gemini-3.1-pro.js` — Weakest

### Problems

- **No input validation on `PUT`** — spreads raw client JSON into the stored todo.
- **`PUT` used as `PATCH`** — wrong REST semantic.
- **`500` on bad JSON** instead of `400`.
- **CommonJS `require`** — the other two use ESM `import`, which matches modern Node + the repo's stack.
- No trim on title, so `" "` becomes a valid todo.
- Most verbose: every response is a manual `writeHead`/`end` pair.

### One Thing It Does Nicely

`for await (const chunk of req)` ([line 22](todo_3_gemini-3.1-pro.js#L22)) is more idiomatic than the event-listener body readers in the other two — but that's a small win against the larger issues.

---

## TL;DR

`todo_1` has the cleanest abstraction (`send()`), strongest validation, correct semantics (`PATCH`, UUIDs, CORS, `400` vs `500`), and the least repetition. It's the one to ship.
