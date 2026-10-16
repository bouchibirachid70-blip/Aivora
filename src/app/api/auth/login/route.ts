import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/auth-validation";
import { consumeRateLimit, getClientAddress, rejectCrossSiteMutation, tooManyRequests } from "@/lib/security";

// Keeps failed-login timing similar when the email does not exist.
const DUMMY_PASSWORD_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req: Request) {
  const csrfError = rejectCrossSiteMutation(req);
  if (csrfError) return csrfError;
  const address = getClientAddress(req);
  const rate = consumeRateLimit(`login:${address}`, 10, 15 * 60 * 1000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfter);
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const user = await db.adminUser.findUnique({ where: { email } });
    const passwordMatches = await verifyPassword(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setSessionCookie({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
