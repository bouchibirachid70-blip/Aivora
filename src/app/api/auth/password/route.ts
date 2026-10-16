import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/auth-validation";
import { adminGuard } from "@/lib/api-guard";
import {
  consumeRateLimit,
  getClientAddress,
  rejectCrossSiteMutation,
  tooManyRequests,
} from "@/lib/security";

export async function PUT(req: Request) {
  const csrfError = rejectCrossSiteMutation(req);
  if (csrfError) return csrfError;
  const address = getClientAddress(req);
  const rate = consumeRateLimit(`password-change:${address}`, 8, 15 * 60 * 1000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfter);

  const { session, error } = await adminGuard();
  if (error || !session) return error;

  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid password details." },
        { status: 400 },
      );
    }
    const user = await db.adminUser.findUnique({ where: { id: session.id } });
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return NextResponse.json({ error: "New password must be different." }, { status: 400 });
    }
    await db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to change the password." }, { status: 500 });
  }
}
