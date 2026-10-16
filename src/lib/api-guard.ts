import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** Returns the session user or a 401 NextResponse. */
export async function adminGuard() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const user = await db.adminUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session: user, error: null };
}
