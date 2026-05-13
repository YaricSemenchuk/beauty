"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/components/TelegramProvider";
import { Loader } from "@/components/Loader";
import { ChevronLeft, Trash2, Check, Clock } from "lucide-react";
import { minutesToHm, shiftMinutes, fmtHours } from "@/lib/time";
import { MONTHS_RU } from "@/lib/week";

interface Shift {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  note: string | null;
}

function ShiftEditor() {
  const router = useRouter();
  const sp = useSearchParams();
  const { me, loading } = useMe();
  const date = sp.get("date") ?? new Date().toISOString().slice(0, 10);
  const userId = sp.get("userId") ?? undefined;

  const [dayShifts, setDayShifts] = useState<Shift[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({ from: date, to: date });
    if (userId) q.set("userId", userId);
    fetch(`/api/shifts?${q}`)
      .then((r) => r.json())
      .then((d) => setDayShifts(d.shifts));
  }, [date, userId]);

  if (loading) return <Loader />;
  if (!me) return null;

  function startEdit(s: Shift) {
    setEditId(s.id);
    setStart(minutesToHm(s.startMin));
    setEnd(minutesToHm(s.endMin));
    setNote(s.note ?? "");
    setErr(null);
  }
  function resetForm() {
    setEditId(null);
    setStart("09:00");
    setEnd("18:00");
    setNote("");
    setErr(null);
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = { date, start, end, note };
      if (userId) body.userId = userId;
      const url = editId ? `/api/shifts/${editId}` : "/api/shifts";
      const method = editId ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Не удалось сохранить");
      }
      router.push(userId ? `/admin/${userId}` : "/home");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Удалить смену?")) return;
    await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    setDayShifts((s) => (s ?? []).filter((x) => x.id !== id));
    if (editId === id) resetForm();
  }

  const startMin = parseHm(start);
  const endMin = parseHm(end);
  const previewMin = shiftMinutes(startMin, endMin);
  const dt = new Date(date + "T00:00:00Z");
  const weekday = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][dt.getUTCDay()];

  // overlap precheck
  const hasOverlap = (dayShifts ?? []).some((s) => {
    if (s.id === editId) return false;
    const aStart = s.startMin;
    const aEnd = s.endMin > s.startMin ? s.endMin : s.startMin + 1;
    const bStart = startMin;
    const bEnd = endMin > startMin ? endMin : startMin + 1;
    return aStart < bEnd && bStart < aEnd;
  });

  const tlGradient = `linear-gradient(to right, #f5ebe2 0%, #f5ebe2 ${(startMin / 1440) * 100}%, #d4a29c ${(startMin / 1440) * 100}%, #c9a36b ${(endMin / 1440) * 100}%, #f5ebe2 ${(endMin / 1440) * 100}%)`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={userId ? `/admin/${userId}` : "/home"}
            className="back-btn"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.22em]">
              {weekday}
            </p>
            <h1 className="font-display text-3xl text-[var(--accent-deep)] font-semibold leading-none">
              {dt.getUTCDate()} <span className="ital">{MONTHS_RU[dt.getUTCMonth()]}</span>
            </h1>
          </div>
        </div>
        <span className="chip chip-gold">
          {editId ? "редактировать" : "новая"}
        </span>
      </div>

      <section className="card card-elev p-5 space-y-4 relative">
        <svg
          aria-hidden
          className="absolute -top-8 -right-8 w-32 opacity-20 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <path d="M50 10 Q70 30 50 50 Q30 30 50 10Z" fill="#c9a36b" />
          <path d="M50 50 Q70 70 50 90 Q30 70 50 50Z" fill="#c9a36b" />
        </svg>

        <div className="relative">
          <label className="block text-[10px] text-[var(--ink-soft)] uppercase tracking-[0.18em] mb-1.5">
            Дата
          </label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              const params = new URLSearchParams(sp.toString());
              params.set("date", e.target.value);
              router.replace(`/shift?${params.toString()}`);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 relative">
          <div>
            <label className="block text-[10px] text-[var(--ink-soft)] uppercase tracking-[0.18em] mb-1.5">
              Начало
            </label>
            <input
              type="time"
              className="input input-time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--ink-soft)] uppercase tracking-[0.18em] mb-1.5">
              Конец
            </label>
            <input
              type="time"
              className="input input-time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="relative pt-2">
          <div
            className="h-2 rounded-full shadow-inner"
            style={{ background: tlGradient }}
          />
          <div className="flex justify-between text-[9px] text-[var(--ink-soft)] mt-1.5 tracking-wider">
            <span>00</span>
            <span>06</span>
            <span className="text-[var(--accent-deep)] font-semibold">
              {minutesToHm(startMin).slice(0, 2)}
            </span>
            <span>14</span>
            <span className="text-[var(--accent-deep)] font-semibold">
              {minutesToHm(endMin).slice(0, 2)}
            </span>
            <span>24</span>
          </div>
        </div>

        <div className="relative">
          <label className="block text-[10px] text-[var(--ink-soft)] uppercase tracking-[0.18em] mb-1.5">
            Заметка
          </label>
          <input
            type="text"
            className="input"
            placeholder="клиенты, замены…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
          />
        </div>

        <div className="flex items-center justify-between relative">
          <span className="chip chip-gold !text-[13px] !py-2 !px-3.5">
            <Clock size={12} /> {fmtHours(previewMin)} часов
          </span>
          {hasOverlap ? (
            <span className="text-sm text-[var(--danger)]">пересекается</span>
          ) : (
            <span className="chip chip-sage chip-dot">без пересечений</span>
          )}
        </div>

        {err && (
          <p className="text-sm text-[var(--danger)] relative">{err}</p>
        )}

        <div className="flex gap-2 relative">
          <button
            disabled={saving || hasOverlap}
            onClick={save}
            className="btn-primary gold flex-1 disabled:opacity-60"
          >
            {saving ? "Сохраняем…" : "Сохранить смену"}
            <Check size={16} />
          </button>
          {editId && (
            <button onClick={resetForm} className="btn-soft">
              Отмена
            </button>
          )}
        </div>
      </section>

      {(dayShifts?.length ?? 0) > 0 && (
        <section className="card p-2">
          <p className="eyebrow px-3.5 pt-3 pb-1.5">Смены за этот день</p>
          {dayShifts!.map((s, i) => (
            <div key={s.id}>
              <div className="row">
                <button
                  onClick={() => startEdit(s)}
                  className="flex-1 flex items-center gap-3.5 text-left min-w-0"
                >
                  <div className="day-pill" style={{ width: 56 }}>
                    <span>смена</span>
                    <span className="num">{minutesToHm(s.startMin).slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--ink)] truncate">
                      {minutesToHm(s.startMin)} – {minutesToHm(s.endMin)}
                    </p>
                    {s.note && (
                      <p className="text-[11px] text-[var(--ink-soft)] truncate">
                        {s.note}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <div className="row-hours">
                    {fmtHours(shiftMinutes(s.startMin, s.endMin))}
                    <small>ч</small>
                  </div>
                  <button
                    onClick={() => remove(s.id)}
                    className="size-9 rounded-full hover:bg-[var(--surface-soft)] flex items-center justify-center text-[var(--danger)]"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {i < dayShifts!.length - 1 && <div className="hairline" />}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <ShiftEditor />
    </Suspense>
  );
}
