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
    try { tg?.ready(); } catch {}
    try { tg?.expand(); } catch {}
    try { tg?.setBackgroundColor?.("#fbf6f1"); } catch {}
    try { tg?.setHeaderColor?.("#fbf6f1"); } catch {}

    const initData = tg?.initData ?? "";

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      credentials: "include",
    })
      .then(async (r) => {
        const text = await r.text();
        let data: { user?: Me; error?: string } = {};
        try { data = JSON.parse(text); } catch {}
        if (!r.ok) throw new Error(data.error ?? `auth failed (${r.status})`);
        return data;
      })
      .then((data) => { if (data.user) setMe(data.user); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Ошибка авторизации");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <TgCtx.Provider value={{ me, loading, error }}>{children}</TgCtx.Provider>
  );
}
