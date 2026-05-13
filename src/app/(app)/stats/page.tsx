"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMe } from "@/components/TelegramProvider";
import { Loader } from "@/components/Loader";
import { ChevronLeft, Download } from "lucide-react";
import {
  addDays,
  endOfMonth,
  iso,
  MONTHS_RU,
  startOfMonth,
  startOfWeek,
} from "@/lib/week";
import { fmtHours } from "@/lib/time";

interface Summary {
  totalMinutes: number;
  totalDays: number;
  byDay: { date: string; minutes: number }[];
}

function StatsView() {
  const sp = useSearchParams();
  const { me, loading } = useMe();
  const userId = sp.get("userId") ?? undefined;
  const [mode, setMode] = useState<"week" | "month">("month");
  const [data, setData] = useState<Summary | null>(null);

  const range = useMemo(() => {
    const now = new Date();
    if (mode === "week") {
      const from = startOfWeek(now);
      return { from, to: addDays(from, 6) };
    }
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }, [mode]);

  useEffect(() => {
    if (!me) return;
    const q = new URLSearchParams({ from: iso(range.from), to: iso(range.to) });
    if (userId) q.set("userId", userId);
    fetch(`/api/reports/summary?${q}`)
      .then((r) => r.json())
      .then(setData);
  }, [me, range, userId]);

  if (loading) return <Loader />;
  if (!me) return null;

  const periodLabel =
    mode === "week"
      ? `Неделя ${range.from.getUTCDate()}–${range.to.getUTCDate()} ${MONTHS_RU[range.to.getUTCMonth()]}`
      : `${MONTHS_RU[range.from.getUTCMonth()]} ${range.from.getUTCFullYear()}`;

  const days = Math.round(
    (range.to.getTime() - range.from.getTime()) / 86400000,
  ) + 1;
  const minByDay = new Map<string, number>();
  for (const d of data?.byDay ?? []) minByDay.set(d.date, d.minutes);
  const maxMin = Math.max(8 * 60, ...(data?.byDay ?? []).map((d) => d.minutes));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={userId ? `/admin/${userId}` : "/home"}
          className="back-btn"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="font-display text-3xl text-[var(--accent-deep)] font-semibold">
          Стати<span className="ital">стика</span>
        </h1>
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

      <section className="card card-cocoa p-5 relative">
        <svg
          aria-hidden
          className="absolute -top-6 -right-4 w-40 opacity-[0.12] pointer-events-none"
          viewBox="0 0 100 100"
        >
          <path
            d="M50 0 Q65 35 100 50 Q65 65 50 100 Q35 65 0 50 Q35 35 50 0Z"
            fill="#fff"
          />
        </svg>
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: "#e6c587" }}
        >
          — {periodLabel} —
        </p>
        <div className="flex items-baseline gap-6 mt-3">
          <div>
            <div className="font-display text-[64px] leading-none font-semibold text-white">
              {fmtHours(data?.totalMinutes ?? 0)}
            </div>
            <div
              className="text-[11px] uppercase tracking-[0.18em] mt-1.5"
              style={{ color: "#e6c587" }}
            >
              часов всего
            </div>
          </div>
          <div>
            <div
              className="font-display text-4xl font-semibold leading-none"
              style={{ color: "#f6d6b8" }}
            >
              {data?.totalDays ?? 0}{" "}
              <span
                className="text-sm font-medium font-sans italic"
                style={{ color: "#e6c587" }}
              >
                дней
              </span>
            </div>
            <div
              className="text-[11px] uppercase tracking-[0.18em] mt-1.5"
              style={{ color: "#e6c587" }}
            >
              рабочих
            </div>
          </div>
        </div>
      </section>

      {mode === "month" && (
        <section className="card p-5">
          <p className="eyebrow">Часы по дням</p>
          <div className="barchart mt-2">
            {Array.from({ length: days }, (_, i) => {
              const d = addDays(range.from, i);
              const min = minByDay.get(iso(d)) ?? 0;
              const h = Math.max(6, (min / maxMin) * 100);
              const cls = min === 0 ? "faint" : min >= 8 * 60 ? "cocoa" : "gold";
              return (
                <div
                  key={iso(d)}
                  className={`bar ${cls}`}
                  style={{ height: `${h}%` }}
                  title={`${d.getUTCDate()} · ${fmtHours(min)} ч`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[var(--ink-soft)] mt-2 tracking-wider">
            <span>1</span>
            <span>{Math.round(days / 3)}</span>
            <span>{Math.round((2 * days) / 3)}</span>
            <span>{days}</span>
          </div>
        </section>
      )}

      <section className="card p-2">
        {(data?.byDay ?? []).length === 0 ? (
          <p className="text-center py-10 text-[var(--ink-soft)] italic">
            Пока нет смен за этот период
          </p>
        ) : (
          data!.byDay.map((d, i) => {
            const dt = new Date(d.date + "T00:00:00Z");
            const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][dt.getUTCDay()];
            return (
              <div key={d.date}>
                <div className="row">
                  <div className="flex items-center gap-3.5">
                    <div className="day-pill">
                      <span>{wd}</span>
                      <span className="num">{dt.getUTCDate()}</span>
                    </div>
                    <div>
                      <p className="text-[var(--ink)]">
                        {dt.getUTCDate()} {MONTHS_RU[dt.getUTCMonth()]}
                      </p>
                    </div>
                  </div>
                  <div className="row-hours">
                    {fmtHours(d.minutes)}
                    <small>ч</small>
                  </div>
                </div>
                {i < data!.byDay.length - 1 && <div className="hairline" />}
              </div>
            );
          })
        )}
      </section>

      {me.role === "ADMIN" && userId && (
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
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <StatsView />
    </Suspense>
  );
}
