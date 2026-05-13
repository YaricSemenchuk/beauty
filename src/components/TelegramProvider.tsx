"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTg } from "@/lib/telegram-client";

export interface Me {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  role: "EMPLOYEE" | "ADMIN";
}

interface Ctx {
  me: Me | null;
  loading: boolean;
  error: string | null;
}

const TgCtx = createContext<Ctx>({ me: null, loading: true, error: null });
export const useMe = () => useContext(TgCtx);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = getTg();
    tg?.ready();
    tg?.expand();
    tg?.setBackgroundColor?.("#fbf6f1");
    tg?.setHeaderColor?.("#fbf6f1");

    const initData = tg?.initData ?? "";
    // Dev fallback: if running outside Telegram, send empty — server will reject.
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "auth failed");
        return r.json();
      })
      .then((data) => setMe(data.user))
      .catch((e) => setError(e.message ?? "Ошибка авторизации"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <TgCtx.Provider value={{ me, loading, error }}>{children}</TgCtx.Provider>
  );
}
