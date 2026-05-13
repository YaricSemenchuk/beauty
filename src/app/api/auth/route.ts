import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminTelegramId, validateInitData } from "@/lib/telegram";
import { setSessionCookie, signSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { initData } = await req.json().catch(() => ({}));
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token)
    return NextResponse.json({ error: "BOT_TOKEN missing" }, { status: 500 });

  const parsed = validateInitData(String(initData ?? ""), token);
  if (!parsed)
    return NextResponse.json({ error: "Invalid initData" }, { status: 401 });

  const tg = parsed.user;
  const isAdmin = isAdminTelegramId(tg.id);

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tg.id) },
    create: {
      telegramId: BigInt(tg.id),
      firstName: tg.first_name,
      lastName: tg.last_name,
      username: tg.username,
      photoUrl: tg.photo_url,
      role: isAdmin ? "ADMIN" : "EMPLOYEE",
    },
    update: {
      firstName: tg.first_name,
      lastName: tg.last_name,
      username: tg.username,
      photoUrl: tg.photo_url,
      role: isAdmin ? "ADMIN" : undefined,
    },
  });

  const jwt = await signSession({
    uid: user.id,
    tid: String(user.telegramId),
    role: user.role,
  });
  await setSessionCookie(jwt);

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      role: user.role,
    },
  });
}
