import { useState } from "react";

type Todo = { id: number; text: string; done: boolean };

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

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

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Todos</h1>

      <div style={s.row}>
        <input
          style={s.input}
          value={input}
          placeholder="What needs to be done?"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={s.btn} onClick={add}>Add</button>
      </div>

      <ul style={s.list}>
        {visible.length === 0 && (
          <li style={s.empty}>No todos here.</li>
        )}
        {visible.map((t) => (
          <li key={t.id} style={s.item}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ ...s.text, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>
              {t.text}
            </span>
            <button style={s.del} onClick={() => remove(t.id)}>✕</button>
          </li>
        ))}
      </ul>

      <div style={s.footer}>
        <span style={s.count}>{todos.filter((t) => !t.done).length} left</span>
        <div style={s.filters}>
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} style={{ ...s.fBtn, fontWeight: filter === f ? "bold" : "normal" }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button style={s.fBtn} onClick={clearDone}>Clear done</button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap:   { maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif", padding: "0 16px" },
  title:  { textAlign: "center", fontSize: 32, marginBottom: 20 },
  row:    { display: "flex", gap: 8, marginBottom: 12 },
  input:  { flex: 1, padding: "8px 12px", fontSize: 16, borderRadius: 4, border: "1px solid #ccc" },
  btn:    { padding: "8px 16px", fontSize: 16, borderRadius: 4, border: "none", background: "#0070f3", color: "#fff", cursor: "pointer" },
  list:   { listStyle: "none", padding: 0, margin: 0 },
  item:   { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #eee" },
  text:   { flex: 1, fontSize: 16 },
  del:    { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 },
  empty:  { color: "#aaa", textAlign: "center", padding: 20 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 13, color: "#666" },
  count:  { minWidth: 50 },
  filters:{ display: "flex", gap: 4 },
  fBtn:   { background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 13 },
};
