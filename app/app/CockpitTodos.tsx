"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "pending" | "in_progress" | "completed";

export type Todo = {
  id: string;
  title: string;
  status: Status;
  due_at: string | null;
  assignee: string | null;
  created_at: string;
};

export type StaffMember = { user_id: string; name: string };

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
  const rank: Record<Status, number> = {
    in_progress: 0,
    pending: 1,
    completed: 2,
  };
  return [...list].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      // innerhalb einer Statusgruppe: mit Frist zuerst, dann nach Frist/Datum
      (a.due_at ? 0 : 1) - (b.due_at ? 0 : 1) ||
      (a.due_at ?? "").localeCompare(b.due_at ?? "") ||
      a.created_at.localeCompare(b.created_at)
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function formatDue(due: string) {
  const d = new Date(due + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function isOverdue(due: string | null, status: Status) {
  if (!due || status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due + "T00:00:00") < today;
}

export default function CockpitTodos({
  initial,
  staff,
}: {
  initial: Todo[];
  staff: StaffMember[];
}) {
  const [todos, setTodos] = useState<Todo[]>(sortTodos(initial));
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [adding, setAdding] = useState(false);
  const supabase = useRef(createClient()).current;

  const nameFor = (uid: string | null) =>
    uid ? staff.find((s) => s.user_id === uid)?.name ?? null : null;

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

    const { data, error } = await supabase
      .from("cockpit_todos")
      .insert({
        title: value,
        due_at: due || null,
        assignee: assignee || null,
      })
      .select("id, title, status, due_at, assignee, created_at")
      .single();

    if (!error && data) {
      setTodos((prev) =>
        prev.some((t) => t.id === data.id)
          ? prev
          : sortTodos([...prev, data as Todo])
      );
      setTitle("");
      setDue("");
      setAssignee("");
    }
    setAdding(false);
  }

  function patchLocal(id: string, patch: Partial<Todo>) {
    setTodos((prev) =>
      sortTodos(prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    );
  }

  async function cycleStatus(todo: Todo) {
    const next = NEXT_STATUS[todo.status];
    patchLocal(todo.id, { status: next });
    await supabase
      .from("cockpit_todos")
      .update({ status: next })
      .eq("id", todo.id);
  }

  async function setDueDate(id: string, value: string) {
    patchLocal(id, { due_at: value || null });
    await supabase
      .from("cockpit_todos")
      .update({ due_at: value || null })
      .eq("id", id);
  }

  async function setAssigneeFor(id: string, value: string) {
    patchLocal(id, { assignee: value || null });
    await supabase
      .from("cockpit_todos")
      .update({ assignee: value || null })
      .eq("id", id);
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
        <div className="todo-add-row">
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
        </div>
        <div className="todo-add-meta">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Fällig am"
            title="Fällig am"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            aria-label="Zuständig"
            title="Zuständig"
          >
            <option value="">Wer?</option>
            {staff.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {firstName(s.name)}
              </option>
            ))}
          </select>
        </div>
      </form>

      {todos.length === 0 ? (
        <div className="empty">
          <div className="icon">✓</div>
          <h3>Nichts offen</h3>
          <p>Füge oben die erste Aufgabe hinzu.</p>
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map((t) => {
            const overdue = isOverdue(t.due_at, t.status);
            return (
              <li key={t.id} className={`todo-item ${t.status}`}>
                <div className="todo-row">
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
                  <button
                    type="button"
                    className="todo-del"
                    onClick={() => removeTodo(t.id)}
                    aria-label="Aufgabe löschen"
                    title="Löschen"
                  >
                    ×
                  </button>
                </div>
                <div className="todo-meta">
                  <label className={`meta-chip due ${overdue ? "overdue" : ""}`}>
                    <span className="meta-ic" aria-hidden="true">
                      ⏱
                    </span>
                    {t.due_at ? formatDue(t.due_at) : "Frist"}
                    <input
                      type="date"
                      value={t.due_at ?? ""}
                      onChange={(e) => setDueDate(t.id, e.target.value)}
                      aria-label="Fällig am ändern"
                    />
                  </label>
                  <label className="meta-chip who">
                    <span className="meta-ic" aria-hidden="true">
                      ◍
                    </span>
                    {nameFor(t.assignee) ? firstName(nameFor(t.assignee)!) : "Wer?"}
                    <select
                      value={t.assignee ?? ""}
                      onChange={(e) => setAssigneeFor(t.id, e.target.value)}
                      aria-label="Zuständig ändern"
                    >
                      <option value="">—</option>
                      {staff.map((s) => (
                        <option key={s.user_id} value={s.user_id}>
                          {firstName(s.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className={`todo-status ${t.status}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
