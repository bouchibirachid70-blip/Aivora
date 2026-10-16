/**
 * Operator-only recovery for an admin who has forgotten the current password.
 *
 * Usage:
 *   DIRECT_URL=<postgres-url> \
 *   ADMIN_EMAIL=<existing-admin-email> \
 *   ADMIN_PASSWORD=<new-strong-password> \
 *   CONFIRM_ADMIN_PASSWORD_RESET=YES \
 *   bun run scripts/reset-admin-password.ts
 *
 * This never exposes a reset token or password through the web app and refuses
 * to create accounts or change an account unless the explicit confirmation is
 * present. It preserves the existing AdminUser row and only replaces its hash.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url || url.startsWith("file:")) {
    throw new Error("DIRECT_URL (or DATABASE_URL) must point to PostgreSQL.");
  }
  if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== "YES") {
    throw new Error("Set CONFIRM_ADMIN_PASSWORD_RESET=YES to confirm this recovery operation.");
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("ADMIN_EMAIL and a strong ADMIN_PASSWORD (12+ chars with upper/lowercase and a number) are required.");
  }
  const db = new PrismaClient({ log: ["warn", "error"], datasources: { db: { url } } });
  try {
    const existing = await db.adminUser.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!existing) throw new Error("No existing admin account matches that email. Recovery never creates accounts.");
    await db.adminUser.update({
      where: { id: existing.id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Password reset for existing admin (id=${existing.id}, email=${existing.email}).`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("Admin password recovery failed:", error?.message || error);
  process.exit(1);
});
