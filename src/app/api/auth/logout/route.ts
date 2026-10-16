import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { rejectCrossSiteMutation } from "@/lib/security";

export async function POST(req: Request) {
  const csrfError = rejectCrossSiteMutation(req);
  if (csrfError) return csrfError;
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
