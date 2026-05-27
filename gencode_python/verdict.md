# Verdict: Python Todo API — Model Comparison

**Ranking:** `todo_1_gpt-5.4.py` > `todo_2_claude-sonet-4.6.py` > `todo_3_gemini-3.1-pro.py`

---

## Comparison Table

| Dimension | `todo_1_gpt-5.4.py` | `todo_2_claude-sonet-4.6.py` | `todo_3_gemini-3.1-pro.py` |
|---|---|---|---|
| Storage | `list` (O(n) lookup) | `dict` (O(1) lookup) ✅ | `list` (O(n) lookup) |
| ID strategy | `uuid.uuid4().hex` ✅ | `str(uuid.uuid4())` ✅ | `int` autoincrement via global ❌ |
| Field model | `text`, `completed`, `createdAt` | `title`, `completed` | `title`, `description`, `completed` |
| Update verb | `PATCH` (true partial) ✅ | `PUT` (used as partial — semantically wrong) | `PUT` (partial via `.get(..., old)`) |
| CORS | Per-response in `send()` | Per-response in `send()` | `end_headers` override ✅ (DRY) |
| OPTIONS status | `204` ✅ | `204` ✅ | `200` ❌ |
| Missing `Content-Length` | Safe (`.get(..., "0")`) ✅ | Safe (`.get(..., 0)`) ✅ | Crashes (`int(None)`) ❌ |
| Empty-title validation | `400` ✅ | `400` ✅ | Silently stores `""` ❌ |
| Request log spam | Silenced ✅ | Silenced ✅ | Default stderr logging ❌ |
| `GET` by id | ❌ missing | ✅ | ✅ |
| `DELETE` behavior | In-place `list.remove` ✅ | `dict.pop` ✅ | Rebinds global list ❌ |
| Lines of code | ~80 | ~85 | ~100 |

---

## Rankings

### 1. `todo_1_gpt-5.4.py` — Best Overall

Cleanest semantics (true `PATCH`), safest input handling (`Content-Length` guard, empty-title check), UUIDs, `createdAt` timestamps, `204` on `OPTIONS`, silenced logs.

**Only real misses:** no `GET /todos/{id}` and linear list lookup.

---

### 2. `todo_2_claude-sonet-4.6.py` — Best Data Model, Weaker Semantics

`dict` storage is the right call (O(1) lookups, clean `pop` on delete), and it includes a helpful startup banner.

**Issues:**
- Labeling partial updates as `PUT` is semantically wrong (`PUT` means full replace per RFC 7231).
- The bare `body["title"].strip()` ([line 61](todo_2_claude-sonet-4.6.py#L61)) will raise `AttributeError` if `title` isn't a string.

---

### 3. `todo_3_gemini-3.1-pro.py` — Last

**One genuinely good idea:** CORS via `end_headers` override ([lines 9–13](todo_3_gemini-3.1-pro.py#L9)) — worth stealing.

**Everything else is a regression:**
- Predictable `int` IDs.
- No input validation.
- Crashes on missing `Content-Length` or invalid JSON.
- Rebinds the global list on `DELETE`.
- Wrong `OPTIONS` status (`200` instead of `204`).
- Spams stderr with request logs.


