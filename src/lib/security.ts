import { NextResponse } from "next/server";
import { consumeRateLimit, getClientAddress, isSameOrigin } from "@/lib/security-core";

export { consumeRateLimit, getClientAddress } from "@/lib/security-core";

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function rejectCrossSiteMutation(req: Request): NextResponse | null {
  if (isSameOrigin(req)) return null;
  return NextResponse.json(
    { error: "Invalid request origin." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
