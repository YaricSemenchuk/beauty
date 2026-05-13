"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/components/TelegramProvider";
import { Loader } from "@/components/Loader";
import { Sparkline } from "@/components/Deco";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtHours } from "@/lib/time";

interface UserRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  role: "EMPLOYEE" | "ADMIN";
  monthMinutes: number;
  monthDays: number;
}

const RING_VARIANTS = ["", "cocoa", "sage", "rose", ""] as const;

export default function AdminHome() {
  const { me, loading } = useMe();
  const [users, setUsers] = useState<UserRow[] | null>(null);

  useEffect(() => {
    if (!me || me.role !== "ADMIN") return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users));
  }, [me]);

  if (loading) return <Loader />;
  if (!me) return null;
  if (me.role !== "ADMIN")
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--danger)] font-medium">Доступ закрыт</p>
        <p className="text-sm text-[var(--ink-soft)] mt-2">
          Этот раздел доступен только администратору
        </p>
      </div>
    );

  const totalMin = (users ?? []).reduce((a, u) => a + u.monthMinutes, 0);

  // crude sparkline data: distribute users' monthMinutes across 9 points
  const sparkData =
    users && users.length > 0
      ? Array.from({ length: 9 }, (_, i) =>
          Math.min(
            1,
            (users[(i * users.length) % users.length]?.monthMinutes ?? 0) /
              Math.max(1, ...(users ?? []).map((u) => u.monthMinutes)),
          ),
        )
      : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="back-btn">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.22em]">
              Студия
            </p>
            <h1 className="font-display text-3xl text-[var(--accent-deep)] font-semibold leading-none">
              Сотруд<span className="ital">ники</span>
            </h1>
          </div>
        </div>
        <span className="chip chip-gold">
          {users?.length ?? 0} человек
        </span>
      </div>

      {users === null ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="card p-6 text-center text-[var(--ink-soft)]">
          Пока никто не подключился. Когда сотрудники зайдут в мини-приложение,
          они появятся здесь.
        </div>
      ) : (
        <>
          <section className="card card-peachy p-5 flex justify-between items-center">
            <div>
              <p className="eyebrow !text-[var(--accent-deep)] opacity-60">
                Студия · этот месяц
              </p>
              <div className="font-display text-3xl text-[var(--accent-deep)] font-semibold mt-0.5">
                {fmtHours(totalMin)} <span className="ital">часов</span>
              </div>
            </div>
            <Sparkline data={sparkData} />
          </section>

          <section className="card p-2">
            {users.map((u, i) => {
              const name =
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.username ||
                "Без имени";
              const initial = name[0]?.toUpperCase() ?? "?";
              const ringVar = RING_VARIANTS[i % RING_VARIANTS.length];
              return (
                <div key={u.id}>
                  <Link
                    href={`/admin/${u.id}`}
                    className="flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-[rgba(245,235,226,.55)] transition"
                  >
                    <div className={`avatar-ring ${ringVar}`}>
                      <div className="av-inner">
                        {u.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.photoUrl} alt="" />
                        ) : (
                          initial
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate">{name}</span>
                        {u.role === "ADMIN" && (
                          <span className="chip !text-[9px] !py-0.5 !px-2 !bg-[var(--accent-deep)] !text-white !border-0">
                            admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] mt-0.5 flex items-center gap-2">
                        <span>{fmtHours(u.monthMinutes)} ч</span>
                        <span className="size-[3px] rounded-full bg-[var(--gold)]" />
                        <span>{u.monthDays} дн в этом месяце</span>
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-[var(--ink-faint)]"
                    />
                  </Link>
                  {i < users.length - 1 && <div className="hairline" />}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
