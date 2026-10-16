import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/auth-validation";
import { adminGuard } from "@/lib/api-guard";
import {
  consumeRateLimit,
  getClientAddress,
  rejectCrossSiteMutation,
  tooManyRequests,
} from "@/lib/security";

export async function POST(req: Request) {
  const csrfError = rejectCrossSiteMutation(req);
  if (csrfError) return csrfError;
  const address = getClientAddress(req);
  const rate = consumeRateLimit(`admin-register:${address}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfter);

  const { session, error } = await adminGuard();
  if (error || !session) return error;

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration details." },
        { status: 400 },
      );
    }
    const { email, name, password } = parsed.data;
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await db.adminUser.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create the admin account." }, { status: 500 });
  }
}
