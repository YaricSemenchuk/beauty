"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/components/TelegramProvider";
import { Loader } from "@/components/Loader";
import { Ornament, Ring } from "@/components/Deco";
import {
  ChevronLeft,
  Download,
  Plus,
  BarChart3,
  Trash2,
} from "lucide-react";
import {
  addDays,
  endOfMonth,
  iso,
  startOfMonth,
  startOfWeek,
  WEEKDAYS_RU,
} from "@/lib/week";
import { fmtHours, minutesToHm } from "@/lib/time";

interface Shift {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  minutes: number;
  note: string | null;
}

interface Summary {
  totalMinutes: number;
  totalDays: number;
  byDay: { date: string; minutes: number }[];
}

const WEEK_TARGET_MIN = 48 * 60;
const MONTH_TARGET_MIN = 180 * 60;

export default function AdminUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { me, loading } = useMe();
  const [mode, setMode] = useState<"week" | "month">("week");
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    photoUrl: string | null;
    role: string;
  } | null>(null);

  const now = new Date();
  const range =
    mode === "week"
      ? { from: startOfWeek(now), to: addDays(startOfWeek(now), 6) }
      : { from: startOfMonth(now), to: endOfMonth(now) };

  useEffect(() => {
    if (!me || me.role !== "ADMIN") return;
    const q = new URLSearchParams({
      from: iso(range.from),
      to: iso(range.to),
      userId,
    });
    fetch(`/api/shifts?${q}`)
      .then((r) => r.json())
      .then((d) => setShifts(d.shifts));
    fetch(`/api/reports/summary?${q}`)
      .then((r) => r.json())
      .then(setSummary);
    fetch(`/api/users`)
      .then((r) => r.json())
      .then((d) => {
        const u = d.users.find((x: { id: string }) => x.id === userId);
        if (u)
          setUserInfo({
            name:
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              u.username ||
              "Сотрудник",
            photoUrl: u.photoUrl,
            role: u.role,
          });
      });
  }, [me, mode, range.from, range.to, userId]);

  if (loading) return <Loader />;
  if (!me || me.role !== "ADMIN") return null;

  async function remove(id: string) {
    if (!confirm("Удалить смену?")) return;
    await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    setShifts((s) => (s ?? []).filter((x) => x.id !== id));
  }

  const target = mode === "week" ? WEEK_TARGET_MIN : MONTH_TARGET_MIN;
  const ringValue = Math.min(1, (summary?.totalMinutes ?? 0) / target);
  const initial = userInfo?.name?.[0]?.toUpperCase() ?? "?";
  const firstName = userInfo?.name.split(" ")[0] ?? "Сотрудник";
  const lastNameShort = userInfo?.name.split(" ")[1]?.[0]
    ? `${userInfo!.name.split(" ")[1][0]}.`
    : "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="back-btn">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="avatar-ring" style={{ width: 46, height: 46 }}>
            <div className="av-inner" style={{ fontSize: 20 }}>
              {userInfo?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userInfo.photoUrl} alt="" />
              ) : (
                initial
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.22em]">
              {userInfo?.role === "ADMIN" ? "Администратор" : "Сотрудник"}
            </p>
            <h1 className="font-display text-3xl text-[var(--accent-deep)] font-semibold leading-none">
              {firstName}{" "}
              {lastNameShort && <span className="ital">{lastNameShort}</span>}
            </h1>
          </div>
        </div>
      </div>

      <div className="seg">
        <button
          className={mode === "week" ? "active" : ""}
          onClick={() => setMode("week")}
        >
          Неделя
        </button>
        <button
          className={mode === "month" ? "active" : ""}
          onClick={() => setMode("month")}
        >
          Месяц
        </button>
      </div>

      <section className="card card-peachy p-5 relative">
        <svg
          aria-hidden
          className="absolute -right-7 -top-5 w-40 opacity-30 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="#7a4b43" strokeWidth=".5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#7a4b43" strokeWidth=".5" />
        </svg>
        <div className="flex items-center gap-4 relative">
          <Ring value={ringValue} label={fmtHours(summary?.totalMinutes ?? 0)} hint="ч" />
          <div className="flex-1">
            <div className="eyebrow !text-[var(--accent-deep)] opacity-70">
              Итого за {mode === "week" ? "неделю" : "месяц"}
            </div>
            <div className="font-display text-4xl font-semibold mt-1 text-[var(--accent-deep)]">
              {fmtHours(summary?.totalMinutes ?? 0)}
              <span className="ital"> ч</span>
            </div>
            <div className="text-[var(--accent-deep)]/85 text-sm mt-1">
              {summary?.totalDays ?? 0} дней
              {(summary?.totalDays ?? 0) > 0 && (
                <>
                  {" "}
                  · средняя смена{" "}
                  {fmtHours(
                    Math.round(
                      (summary?.totalMinutes ?? 0) /
                        Math.max(1, summary?.totalDays ?? 1),
                    ),
                  )}{" "}
                  ч
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-2">
        <p className="eyebrow px-3.5 pt-3 pb-1.5">Смены</p>
        {(shifts ?? []).length === 0 ? (
          <p className="text-center py-8 text-[var(--ink-soft)] italic">
            Нет смен за этот период
          </p>
        ) : (
          shifts!.map((s, i) => {
            const dt = new Date(s.date + "T00:00:00Z");
            const wdIdx = (dt.getUTCDay() + 6) % 7;
            return (
              <div key={s.id}>
                <div className="row">
                  <Link
                    href={`/shift?date=${s.date}&userId=${userId}`}
                    className="flex-1 flex items-center gap-3.5 min-w-0"
                  >
                    <div className="day-pill">
                      <span>{WEEKDAYS_RU[wdIdx]}</span>
                      <span className="num">{dt.getUTCDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {minutesToHm(s.startMin)} – {minutesToHm(s.endMin)}
                      </p>
                      {s.note && (
                        <p className="text-[11px] text-[var(--ink-soft)] truncate">
                          {s.note}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="row-hours">
                      {fmtHours(s.minutes)}
                      <small>ч</small>
                    </div>
                    <button
                      onClick={() => remove(s.id)}
                      className="size-9 rounded-full hover:bg-[var(--surface-soft)] flex items-center justify-center text-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {i < shifts!.length - 1 && <div className="hairline" />}
              </div>
            );
          })
        )}
      </section>

      <Ornament />

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/shift?date=${iso(new Date())}&userId=${userId}`}
          className="btn-soft"
        >
          <Plus size={14} /> Добавить
        </Link>
        <Link href={`/stats?userId=${userId}`} className="btn-soft">
          <BarChart3 size={14} /> Все периоды
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/api/reports/export?format=xlsx&userId=${userId}&from=${iso(range.from)}&to=${iso(range.to)}`}
          className="btn-primary"
        >
          <Download size={14} /> Excel
        </a>
        <a
          href={`/api/reports/export?format=pdf&userId=${userId}&from=${iso(range.from)}&to=${iso(range.to)}`}
          className="btn-primary gold"
        >
          <Download size={14} /> PDF
        </a>
      </div>
    </div>
  );
}
