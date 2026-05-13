"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/components/TelegramProvider";
import { Loader } from "@/components/Loader";
import { Ornament, Ring, BotanicalTR, BotanicalBL } from "@/components/Deco";
import { Plus, Users } from "lucide-react";
import { addDays, iso, startOfWeek, WEEKDAYS_RU } from "@/lib/week";
import { fmtHours, minutesToHm } from "@/lib/time";

interface Shift {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  minutes: number;
  note: string | null;
}

const WEEK_TARGET_MIN = 48 * 60;

export default function HomePage() {
  const { me, loading, error } = useMe();
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const todayKey = iso(today);

  useEffect(() => {
    if (!me) return;
    fetch(`/api/shifts?from=${iso(weekStart)}&to=${iso(weekEnd)}`)
      .then((r) => r.json())
      .then((d) => setShifts(d.shifts));
  }, [me, weekStart, weekEnd]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--danger)] font-medium">Ошибка авторизации</p>
        <p className="text-sm text-[var(--ink-soft)] mt-2">{error}</p>
        <p className="text-xs text-[var(--ink-soft)] mt-4">
          Откройте приложение через бота в Telegram.
        </p>
      </div>
    );
  if (!me) return null;

  const byDay = new Map<string, Shift[]>();
  for (const s of shifts ?? []) {
    const arr = byDay.get(s.date) ?? [];
    arr.push(s);
    byDay.set(s.date, arr);
  }
  const totalMin = (shifts ?? []).reduce((a, s) => a + s.minutes, 0);
  const totalDays = byDay.size;
  const remaining = Math.max(0, WEEK_TARGET_MIN - totalMin);
  const ringValue = Math.min(1, totalMin / WEEK_TARGET_MIN);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  })();

  const firstName = me.firstName || me.username || "красавица";
  const lastName = me.lastName ?? "";
  const initial = firstName[0]?.toUpperCase() ?? "?";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.22em]">
            {greeting}
          </p>
          <h1 className="font-display text-4xl text-[var(--accent-deep)] font-semibold leading-none mt-1">
            {firstName}
            {lastName && <span className="ital"> {lastName}</span>}
          </h1>
        </div>
        <div className="avatar-ring" style={{ width: 44, height: 44 }}>
          <div className="av-inner" style={{ fontSize: 18 }}>
            {me.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photoUrl} alt="" />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>

      <section className="card card-peachy p-5 relative">
        <svg
          aria-hidden
          className="absolute -right-5 -bottom-8 w-40 opacity-40 pointer-events-none"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="#fff" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#fff" strokeWidth="1" />
        </svg>
        <div className="flex items-center gap-4 relative">
          <Ring value={ringValue} label={fmtHours(totalMin)} hint="часов" />
          <div className="flex-1">
            <div className="eyebrow !text-[var(--accent-deep)] opacity-70">Эта неделя</div>
            <div className="font-display text-4xl font-semibold mt-1 text-[var(--accent-deep)]">
              {fmtHours(totalMin)} <span className="ital">из 48</span>
            </div>
            <div className="text-[var(--accent-deep)]/80 text-sm mt-1">
              {totalDays} {dayWord(totalDays)}
              {remaining > 0 && (
                <>
                  {" "}· ещё <strong>{fmtHours(remaining)} ч</strong> до плана
                </>
              )}
            </div>
            <div className="flex gap-2 mt-2.5">
              <span className="chip chip-gold chip-dot">
                {ringValue >= 1 ? "план выполнен" : "в графике"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <Ornament />

      <section className="card p-2">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(weekStart, i);
          const key = iso(d);
          const items = byDay.get(key) ?? [];
          const min = items.reduce((a, s) => a + s.minutes, 0);
          const isToday = key === todayKey;
          const hasShifts = items.length > 0;
          return (
            <div key={key}>
              <Link href={`/shift?date=${key}`} className="row block">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={
                        "day-pill " +
                        (isToday ? "today" : hasShifts ? "" : "empty")
                      }
                    >
                      <span>{WEEKDAYS_RU[i]}</span>
                      <span className="num">{d.getUTCDate()}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      {hasShifts ? (
                        items.map((s) => (
                          <span
                            key={s.id}
                            className="text-sm text-[var(--ink)] truncate"
                          >
                            {minutesToHm(s.startMin)} – {minutesToHm(s.endMin)}
                            {s.note && (
                              <span className="block text-[11px] text-[var(--ink-soft)] truncate">
                                {s.note}
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--ink-faint)] italic">
                          не отмечено
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {min > 0 ? (
                      <div className="row-hours">
                        {fmtHours(min)}
                        <small>ч</small>
                      </div>
                    ) : (
                      <span className="chip chip-gold">+ добавить</span>
                    )}
                  </div>
                </div>
              </Link>
              {i < 6 && <div className="hairline" />}
            </div>
          );
        })}
      </section>

      <Link href={`/shift?date=${todayKey}`} className="btn-primary w-full">
        <Plus size={18} /> Добавить смену
      </Link>

      <Link href="/stats" className="btn-soft w-full">
        Подробная статистика
      </Link>

      {me.role === "ADMIN" && (
        <Link href="/admin" className="btn-soft w-full">
          <Users size={16} /> Кабинет администратора
        </Link>
      )}
    </div>
  );
}

function dayWord(n: number): string {
  const m = n % 10;
  const k = n % 100;
  if (k >= 11 && k <= 14) return "дней";
  if (m === 1) return "день";
  if (m >= 2 && m <= 4) return "дня";
  return "дней";
}

// suppress unused imports warning — keep botanical pieces available for layout future
void BotanicalTR;
void BotanicalBL;
