
# Verdict: React Todo App — Model Comparison

**Ranking:** `todo_2_claude-sonet-4.6.tsx` > `todo_3_gemini-3.1-pro.tsx` > `todo_1_gpt-5.4.tsx`

---

## Feature Scope

| Feature | `todo_1_gpt-5.4` | `todo_2_claude-sonet-4.6` | `todo_3_gemini-3.1-pro` |
|---|:---:|:---:|:---:|
| Add / toggle / delete | ✅ | ✅ | ✅ |
| Clear completed | ✅ | ✅ | ❌ |
| Filter (all / active / done) | ❌ | ✅ | ❌ |
| "Items left" counter | ❌ | ✅ | ❌ |
| Empty state | ❌ | ✅ | ✅ |
| `localStorage` persistence | ✅ | ❌ | ❌ |
| Semantic `<form onSubmit>` | ❌ | ❌ | ✅ |

---

## Rankings

### 1. `todo_2_claude-sonet-4.6.tsx` — Best Overall

- Handlers extracted into small named functions ([lines 10–22](todo_2_claude-sonet-4.6.tsx#L10)) — keeps JSX clean.
- Styles pulled into a single `s` object ([lines 78–93](todo_2_claude-sonet-4.6.tsx#L78)) — JSX reads as structure, not styling noise.
- Most complete feature set (filter + counter + empty state + clear).
- Filter logic is a single derived value ([lines 24–26](todo_2_claude-sonet-4.6.tsx#L24)) rather than state — idiomatic React.

---

### 2. `todo_3_gemini-3.1-pro.tsx` — Best Fundamentals

- Uses `<form onSubmit>` ([line 35](todo_3_gemini-3.1-pro.tsx#L35)) — the only accessibility-correct approach. Enter-to-submit works for free, screen readers announce it as a form, and the submit button is keyboard-accessible by default.
- Clean handler decomposition, readable JSX.
- Loses points only on feature scope.

---

### 3. `todo_1_gpt-5.4.tsx` — Unique Strength, Messier Code

- `localStorage` persistence ([lines 7–14](todo_1_gpt-5.4.tsx#L7)) is a real feature the others lack.
- Toggle/delete logic is inlined in JSX ([lines 46–53](todo_1_gpt-5.4.tsx#L46)) — duplication and harder to scan.
- Uses `todos` from closure inside setters instead of functional updates (`setTodos(prev => ...)`) — minor footgun if React batches.

---

## Shared Weaknesses (All Three)

- `Date.now()` for IDs can collide on rapid additions — prefer `crypto.randomUUID()`.
- No `useCallback`/memoization, but at this scale that's fine.

---

## TL;DR

`todo_2` wins on architecture and features; `todo_3` wins on accessibility/idiom (the `<form>` pattern); `todo_1` wins on persistence. The ideal version would combine `todo_2_claude-sonet-4.6`'s structure + `todo_3_gemini-3.1-pro`'s `<form>` + `todo_1_gpt-5.4`'s `localStorage`.