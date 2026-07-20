"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "pending" | "in_progress" | "completed";

export type Todo = {
  id: string;
  title: string;
  status: Status;
  created_at: string;
};

const NEXT_STATUS: Record<Status, Status> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Offen",
  in_progress: "Läuft",
  completed: "Erledigt",
};

function sortTodos(list: Todo[]) {
  // Erledigte nach unten, sonst nach Erstellzeit.
  const rank: Record<Status, number> = {
    in_progress: 0,
    pending: 1,
    completed: 2,
  };
  return [...list].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      a.created_at.localeCompare(b.created_at)
  );
}

export default function CockpitTodos({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(sortTodos(initial));
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const supabase = useRef(createClient()).current;

  // Live-Sync: Änderungen der anderen Session landen sofort hier.
  useEffect(() => {
    const channel = supabase
      .channel("cockpit_todos_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cockpit_todos" },
        (payload) => {
          setTodos((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as Todo).id);
            }
            const row = payload.new as Todo;
            const rest = prev.filter((t) => t.id !== row.id);
            return sortTodos([...rest, row]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || adding) return;
    setAdding(true);
    setTitle("");

    const { data, error } = await supabase
      .from("cockpit_todos")
      .insert({ title: value })
      .select("id, title, status, created_at")
      .single();

    if (!error && data) {
      // Optimistisch: eigene Session sofort aktualisieren (Realtime kommt zusätzlich).
      setTodos((prev) =>
        prev.some((t) => t.id === data.id)
          ? prev
          : sortTodos([...prev, data as Todo])
      );
    }
    setAdding(false);
  }

  async function cycleStatus(todo: Todo) {
    const next = NEXT_STATUS[todo.status];
    setTodos((prev) =>
      sortTodos(prev.map((t) => (t.id === todo.id ? { ...t, status: next } : t)))
    );
    await supabase
      .from("cockpit_todos")
      .update({ status: next })
      .eq("id", todo.id);
  }

  async function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("cockpit_todos").delete().eq("id", id);
  }

  const openCount = todos.filter((t) => t.status !== "completed").length;

  return (
    <div className="panel todos">
      <div className="todos-head">
        <div>
          <div className="panel-title">Was liegt an</div>
          <div className="panel-sub">
            Gemeinsame Liste – live zwischen euch beiden synchron.
          </div>
        </div>
        <span className="todos-count mono">{openCount} offen</span>
      </div>

      <form className="todo-add" onSubmit={addTodo}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aufgabe hinzufügen …"
          aria-label="Neue Aufgabe"
        />
        <button type="submit" disabled={!title.trim() || adding}>
          Hinzufügen
        </button>
      </form>

      {todos.length === 0 ? (
        <div className="empty">
          <div className="icon">✓</div>
          <h3>Nichts offen</h3>
          <p>Füge oben die erste Aufgabe hinzu.</p>
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map((t) => (
            <li key={t.id} className={`todo-item ${t.status}`}>
              <button
                type="button"
                className={`todo-dot ${t.status}`}
                onClick={() => cycleStatus(t)}
                aria-label={`Status: ${STATUS_LABEL[t.status]} – klicken zum Wechseln`}
                title={STATUS_LABEL[t.status]}
              >
                {t.status === "completed" ? "✓" : ""}
              </button>
              <span className="todo-title">{t.title}</span>
              <span className={`todo-status ${t.status}`}>
                {STATUS_LABEL[t.status]}
              </span>
              <button
                type="button"
                className="todo-del"
                onClick={() => removeTodo(t.id)}
                aria-label="Aufgabe löschen"
                title="Löschen"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
