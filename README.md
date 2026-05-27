# 🤖 GPT-5.4 vs Claude Sonnet 4.6 vs Gemini 3.1 Pro — Coding Capability in Four Real Scenarios

A head-to-head comparison of three frontier coding models writing the *same* small product from scratch — a TODO REST API plus a TODO UI — in four stacks: Go, Python, Node.js (vanilla `http`), and React + TypeScript.

This is not a synthetic benchmark. Each model was given the same plain-English prompt and produced one file. The output was then judged on the same axes a senior reviewer would use on a PR: correctness, HTTP semantics, error handling, validation, idiomatic style, and maintainability.

---

## 📋 Table of Contents

- [🗣️ The Prompt](#the-prompt)
- [⚙️ Setup](#setup)
- [🐹 Scenario 1 — Go REST API](#scenario-1--go-rest-api)
- [🐍 Scenario 2 — Python REST API](#scenario-2--python-rest-api-stdlib-httpserver)
- [🟨 Scenario 3 — Node.js REST API](#scenario-3--nodejs-rest-api-vanilla-nodehttp)
- [⚛️ Scenario 4 — React + TypeScript UI](#scenario-4--react--typescript-ui)
- [🏆 Aggregate Scoreboard](#aggregate-scoreboard)
- [🔍 Patterns That Emerged](#patterns-that-emerged)
- [🎯 What This Means for Picking a Model](#what-this-means-for-picking-a-model)

---

## 🗣️ The Prompt

Every model in every scenario received the exact same one-line instruction, with only the language token swapped:

> *"write me a [golang / python / nodejs / reactjs] file that serves todo features within 100 code lines"*

That's it. No spec, no list of endpoints, no hints about validation, CORS, REST semantics, or accessibility. The 100-line cap was deliberate — it forces the model to make taste calls about *what to include and what to skip*, which is where models reveal their priors. There's no room to add everything; you have to pick.


---

## ⚙️ Setup

> **Source repository:** [truongpx396/gpt-5.4\_claude-sonnet-4.6\_gemini-3.1-pro-coding-capability](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability.git) — all generated files are organised under `gencode_golang/`, `gencode_python/`, `gencode_node/`, and `gencode_reactjs/`.

All three contender models were accessed through **GitHub Copilot**, each on its default reasoning setting:

| Model | Reasoning mode | Context window | Generation speed* | Access |
|---|---|---|---|---|
| **GPT-5.4** | medium (default) | **400k** | ~24 tok/s | GitHub Copilot |
| **Claude Sonnet 4.6** | medium | **160k** | ~34 tok/s | GitHub Copilot |
| **Gemini 3.1 Pro** (preview) | default only | **173k** | ~30 tok/s | GitHub Copilot |

\* Measured during this test — each task produced ~100 lines / ~700 output tokens. Claude Sonnet 4.6 was the fastest by a clear margin, arriving ~42% faster than GPT-5.4 and ~13% faster than Gemini 3.1 Pro. In practice this means the difference between a 20-second wait and a 29-second wait — noticeable but not decisive for one-shot generation. It would compound significantly in agentic loops with many sequential calls.

The verdicts themselves — the senior-reviewer pass over each output — were produced by **Claude Sonnet 4.7 with the 1M-token context window**, running inside Claude Code. That model never wrote any of the code being judged; it only read and graded.

The prompt given to the review model was identical for every scenario, with only the folder name swapped:

> *"Please check 3 files in the `gencode_golang` / `gencode_python` / `gencode_node` / `gencode_reactjs` folder, and let me know what code is better and why?"*

The "context window" column matters less than you'd think for this exercise — each task fits in a few hundred tokens. It matters more for what it implies about how each vendor positions its model in Copilot: GPT-5.4 is the heavyweight, Sonnet 4.6 is the workhorse, Gemini 3.1 Pro is the preview tier.

### Isolation & Bias Prevention

Each file was generated in a **dedicated, clean, fresh context** — a separate repo with no prior conversation history, no shared chat session, and no cross-references between models. Once generated, each output was moved to a separate destination repository for review. Critically, **no preset rules, custom instructions, system prompts, or `.github/copilot-instructions.md` files** were in place during generation — every model ran on its bare defaults. This means:

- No model saw another model's output before or during generation.
- No shared context window could leak style, structure, or decisions between contenders.
- No custom system prompt steered any model toward or away from particular patterns.
- The reviewer (Sonnet 4.7) received only the raw files — no hints about which model wrote which file.

The goal was to eliminate as many sources of bias as possible: anchoring bias (seeing one solution before writing another), context bleed, and model self-favoritism.

---

## 🐹 Scenario 1 — Go REST API

**Ranking:** Sonnet 4.6 > GPT-5.4 > Gemini 3.1 Pro

> 📄 [Full verdict → gencode_golang/verdict.md](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_golang/verdict.md)

### Winner: Claude Sonnet 4.6

Sonnet 4.6 was the only model that *combined* Go 1.22+ method-aware routing with the rest of the basics. It used `mux.HandleFunc("/todos/{id}", ...)` with `r.PathValue("id")`, a `jsonResponse()` helper that removed the usual `Content-Type` / `WriteHeader` / `Encode` triplet, structured JSON error bodies, a `switch r.Method` for dispatch, and — most importantly — pointer fields for partial updates so an omitted field doesn't get silently zeroed:

[gencode_golang/todo_2_claude-sonet-4.6.go:83-97](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_golang/todo_2_claude-sonet-4.6.go#L83-L97)

```go
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
```

Also notable: it validates `body.Title == ""`, uses an explicit `http.NewServeMux()` instead of the default mux, and exposes a real `GET /todos/{id}` route.

### Runner-up: GPT-5.4 — correct semantics, dated routing

GPT-5.4 got the *meaning* right — `PATCH` with pointer fields for partial updates, `strings.TrimSpace` validation — but used pre-Go-1.22 patterns: manual `strings.TrimPrefix(r.URL.Path, "/todos/")` for path parsing, `http.Error` with plain-text error bodies, and a single big handler that interleaves lookup with method dispatch. Reads as Go from 2020.

### Last: Gemini 3.1 Pro — modern surface, broken fundamentals

Gemini 3.1 Pro's file *looked* the most modern (`"GET /todos"`-style routing) but fails the basics:

- Ignored errors from `strconv.Atoi(r.PathValue("id"))` and `json.NewDecoder(r.Body).Decode(&t)` → bad input becomes `id=0` instead of a 400.
- Storage as `map[int]Todo` → `GET /todos` returns items in **random order** every call. That's not an API; it's a slot machine.
- No input validation, no empty-title guard.
- PUT clobbers the whole record — omitting `completed` flips it to `false`.

A modern syntax wrapped around classic foot-guns.

---

## 🐍 Scenario 2 — Python REST API (stdlib `http.server`)

**Ranking:** GPT-5.4 > Sonnet 4.6 > Gemini 3.1 Pro

> 📄 [Full verdict → gencode_python/verdict.md](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_python/verdict.md)

This is the one scenario where **GPT-5.4 took first place outright**.

### Winner: GPT-5.4 — safest input handling

GPT-5.4 nailed the boring-but-important details: a `send()` helper that always emits CORS headers, a `read_json()` that *guards against missing `Content-Length`* (the others crash on `int(None)`), UUID IDs, `createdAt` timestamps, `204 No Content` on `OPTIONS`, silenced default request logs, and **true `PATCH` semantics**:

[gencode_python/todo_1_gpt-5.4.py:21-24](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_python/todo_1_gpt-5.4.py#L21-L24)

```python
def read_json(handler):
    size = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(size) if size else b"{}"
    return json.loads(raw)
```

[gencode_python/todo_1_gpt-5.4.py:52-61](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_python/todo_1_gpt-5.4.py#L52-L61)

```python
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
```

Only real miss: no `GET /todos/{id}`, and storage is a list rather than a dict (O(n) lookups).

### Runner-up: Sonnet 4.6 — better data model, weaker semantics

Sonnet 4.6 picked the *right* data structure — `dict` storage gives O(1) lookups and a clean `dict.pop()` on delete — and added a useful startup banner. But it labels its partial updates as **`PUT`**, which is semantically wrong per RFC 7231 (PUT means full replace). It also has a latent `AttributeError` waiting in `body["title"].strip()` if `title` isn't a string.

### Last: Gemini 3.1 Pro — one good idea, lots of regressions

Gemini 3.1 Pro contributed exactly one genuinely good idea — CORS via an `end_headers` override, which is the most DRY approach of the three. Everything else regresses: predictable int IDs from a global counter, no validation (empty `""` titles silently stored), a crash on missing `Content-Length` (`int(None)` → TypeError), **`DELETE` rebinds the global list** instead of mutating in place (breaks any other reference), wrong status on `OPTIONS` (200 instead of 204), and default stderr log spam.

---

## 🟨 Scenario 3 — Node.js REST API (vanilla `node:http`)

**Ranking:** GPT-5.4 > Sonnet 4.6 > Gemini 3.1 Pro

> 📄 [Full verdict → gencode_node/verdict.md](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_node/verdict.md)

### Winner: GPT-5.4 — cleanest abstraction

GPT-5.4's Node version is the one I'd actually ship. It uses ESM imports (matching modern Node), `randomUUID()` for collision-free IDs, a single `send()` helper that emits status + CORS + content-type in one call, strict per-field type validation on `PATCH`, and a top-level `try/catch` that returns **400** (not 500) for malformed JSON:

[gencode_node/todo_1_gpt-5.4.js:42-48](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_node/todo_1_gpt-5.4.js#L42-L48)

```javascript
if (url.pathname.startsWith('/todos/') && req.method === 'PATCH') {
  if (!todo) return send(res, 404, { error: 'todo not found' })
  const { text, completed } = await readBody(req)
  if (typeof text === 'string') todo.text = text.trim() || todo.text
  if (typeof completed === 'boolean') todo.completed = completed
  return send(res, 200, todo)
}
```

That `typeof completed === 'boolean'` check is the kind of thing that separates a toy from production-ish code — Gemini's spread-and-pray approach (`{ ...todos[index], ...data, id }`) lets a client write `completed: "yes"` and break the schema for everyone.

### Runner-up: Sonnet 4.6 — clean but unusable from a browser

Sonnet 4.6's Node code has the best per-route JSON parse error handling and correctly returns `204 No Content` on `DELETE`. But it ships **no CORS headers at all**, which makes it unusable from a browser frontend without a proxy. For a TODO app, that's a fatal product miss.

### Last: Gemini 3.1 Pro — verbose and semantically wrong

Same pattern as Go: `PUT` is used where `PATCH` is meant, malformed JSON returns 500 instead of 400, no input validation, no `trim()` on titles (so `" "` is a valid TODO), and `require` instead of ESM imports — odd for a 2025-vintage Node example. The one nice touch: `for await (const chunk of req)` is the most idiomatic body reader of the three. Small win, lots of losses.

---

## ⚛️ Scenario 4 — React + TypeScript UI

**Ranking:** Sonnet 4.6 > Gemini 3.1 Pro > GPT-5.4

> 📄 [Full verdict → gencode_reactjs/verdict.md](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_reactjs/verdict.md)

This is the most interesting scenario because there's **no single winner across all dimensions**. Each model brought something the others lacked.

### Winner overall: Sonnet 4.6 — best architecture and feature set

Sonnet 4.6 produced the most complete TODO: add, toggle, delete, **filter (all/active/done)**, **items-left counter**, **empty state**, and **clear-completed**. It also factored its handlers into small named functions and pulled all styling into a single `s` object so the JSX reads like structure, not styling noise. Filter logic is a derived value, not state — the idiomatic React move:

[gencode_reactjs/todo_2_claude-sonet-4.6.tsx:10-26](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_reactjs/todo_2_claude-sonet-4.6.tsx#L10-L26)

```tsx
const add = () => {
  const text = input.trim();
  if (!text) return;
  setTodos([...todos, { id: Date.now(), text, done: false }]);
  setInput("");
};

const toggle = (id: number) =>
  setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

const remove = (id: number) => setTodos(todos.filter((t) => t.id !== id));

const clearDone = () => setTodos(todos.filter((t) => !t.done));

const visible = todos.filter(
  (t) => filter === "all" || (filter === "done" ? t.done : !t.done)
);
```

### Second: Gemini 3.1 Pro — best fundamentals (accessibility)

Gemini 3.1 Pro was the **only one** of the three that wrapped its input in a `<form onSubmit>`:

[gencode_reactjs/todo_3_gemini-3.1-pro.tsx:35-46](https://github.com/truongpx396/gpt-5.4_claude-sonnet-4.6_gemini-3.1-pro-coding-capability/blob/main/gencode_reactjs/todo_3_gemini-3.1-pro.tsx#L35-L46)

```tsx
<form onSubmit={addTodo} style={{ display: 'flex', marginBottom: '1rem' }}>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="What needs to be done?"
    style={{ flex: 1, padding: '8px', fontSize: '16px' }}
  />
  <button type="submit" style={{ padding: '8px 16px', marginLeft: '6px', cursor: 'pointer' }}>
    Add
  </button>
</form>
```

Enter-to-submit works for free, screen readers announce it as a form, and the submit button is keyboard-accessible by default. The other two re-implement this with `onKeyDown` listeners on the input — works, but worse. Gemini lost the top spot only on feature scope.

### Third: GPT-5.4 — one unique feature, messier code

GPT-5.4 was the **only model that persisted state to `localStorage`** — a real product feature the others skipped. But its toggle/delete logic is inlined inside the JSX (duplicated and hard to scan), and it reads `todos` from closure inside the setters rather than using functional `setTodos(prev => ...)` updates. A latent batching footgun rather than a current bug.

### Shared weaknesses (all three)

All three used `Date.now()` for IDs (will collide on rapid additions — `crypto.randomUUID()` is the right call), and none used `useCallback` / memoization (fine at this scale).

> If you combined Sonnet 4.6's structure + Gemini 3.1 Pro's `<form>` pattern + GPT-5.4's `localStorage` persistence, you'd have the ideal version.

---

## 🏆 Aggregate Scoreboard

| Scenario | 1st | 2nd | 3rd |
|---|---|---|---|
| Go API | **Sonnet 4.6** | GPT-5.4 | Gemini 3.1 Pro |
| Python API | **GPT-5.4** | Sonnet 4.6 | Gemini 3.1 Pro |
| Node.js API | **GPT-5.4** | Sonnet 4.6 | Gemini 3.1 Pro |
| React UI | **Sonnet 4.6** | Gemini 3.1 Pro | GPT-5.4 |

Across four scenarios:

- **Sonnet 4.6** — 2 firsts, 2 seconds. Most consistent across the board, never finished last.
- **GPT-5.4** — 2 firsts, 1 second, 1 third. Strongest where validation and error handling matter most (Python, Node); weakest where component architecture matters (React).
- **Gemini 3.1 Pro** — 0 firsts, 1 second, 3 thirds. Modern-looking surface, weak fundamentals — except in React, where its accessibility instinct (`<form>`) was the cleanest move any model made all day.

---

## 🔍 Patterns That Emerged

A few things were consistent enough across all four scenarios to read as **model traits**, not random variance:

**Sonnet 4.6 thinks in *structure*.** It reaches for helpers (`jsonResponse`, the `s` style object), small named functions, derived values over state. The result is code that's easy to extend. The weakness: semantics sometimes slip (`PUT` used where `PATCH` is correct, in both Python and Node).

**GPT-5.4 thinks in *contracts*.** It cares about input validation, error codes (400 vs 500), HTTP method semantics, missing-header guards, and content negotiation. It produces the code most likely to survive a fuzz test. The weakness: the *shape* of the code can be uglier — handlers inside JSX in React, monolithic Go handlers — even when the behavior is right.

**Gemini 3.1 Pro thinks in *syntax surfaces*.** It often picks the most modern-looking construct (`for await (const chunk of req)`, Go 1.22+ method routing, `<form onSubmit>`). But it skips validation, ignores errors, and confuses `PUT` with `PATCH` in three out of four scenarios. The lone exception is React, where its choice of `<form>` is genuinely the best move any model made — suggesting Gemini's training leans hardest on idiomatic web fundamentals.

**The biggest single failure pattern** — across every backend scenario, by every model except GPT-5.4 in Node — was confusing `PUT` (full replace) with `PATCH` (partial update). It's the single most-violated REST semantic in the wild, and frontier LLMs replicate the mistake at the same rate humans do.

---

## 🎯 What This Means for Picking a Model

For a one-shot coding task in Copilot today:

- If you're writing **API surface code where bad input is a real risk** (auth, payments, anything user-facing), GPT-5.4's contract-first instincts pay off.
- If you're writing **UI or anything where you'll come back to extend it**, Sonnet 4.6's structural sense saves more time downstream than its occasional REST-semantic slip costs.
- **Gemini 3.1 Pro (preview)** isn't ready to be the default. It writes the most fashionable code in the room and the least defensible.

The context-size advantage GPT-5.4 has on paper (400k vs 160k/173k) didn't change anything in this test — every task fit in a few hundred tokens. Where it would matter is multi-file refactors and long agentic loops, neither of which this exercise touched.

And finally: the verdicts were produced by **Sonnet 4.7 (1M context, via Claude Code)** — a stronger model used deliberately to judge weaker ones. The principle is simple: if you want an honest code review, you ask a better reviewer. Sonnet 4.7 was not a contender in this test; it was the judge. Using a model to evaluate its own output — or outputs from peers at the same capability tier — tends to produce charitable, undifferentiated feedback. Stepping up a generation removes that bias.
