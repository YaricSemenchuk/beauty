import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { shiftMinutes } from "@/lib/time";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        shifts: { where: { date: { gte: monthStart } } },
      },
    });
    return NextResponse.json({
      users: users.map((u) => {
        const minutes = u.shifts.reduce(
          (a, s) => a + shiftMinutes(s.startMin, s.endMin),
          0,
        );
        const days = new Set(
          u.shifts.map((s) => s.date.toISOString().slice(0, 10)),
        ).size;
        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          photoUrl: u.photoUrl,
          role: u.role,
          monthMinutes: minutes,
          monthDays: days,
        };
      }),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
