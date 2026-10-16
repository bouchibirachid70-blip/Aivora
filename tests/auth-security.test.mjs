import assert from "node:assert/strict";
import { emailSchema, passwordSchema, registerSchema } from "../src/lib/auth-validation.ts";
import { consumeRateLimit, isSameOrigin } from "../src/lib/security-core.ts";

assert.equal(emailSchema.safeParse("Admin@Example.com").success, true);
assert.equal(emailSchema.parse("Admin@Example.com"), "admin@example.com");
assert.equal(passwordSchema.safeParse("short").success, false);
assert.equal(passwordSchema.safeParse("alllowercasepassword").success, false);
assert.equal(passwordSchema.safeParse("StrongPassword123").success, true);
assert.equal(registerSchema.safeParse({ email: "admin@example.com", name: "Admin", password: "StrongPassword123" }).success, true);

const crossSite = isSameOrigin(new Request("https://app.example/api/auth/login", {
  method: "POST",
  headers: { origin: "https://evil.example", host: "app.example", "x-forwarded-proto": "https" },
}));
assert.equal(crossSite, false);
assert.equal(isSameOrigin(new Request("https://app.example/api/auth/login", {
  method: "POST",
  headers: { origin: "https://app.example", host: "app.example", "x-forwarded-proto": "https" },
})), true);

const key = `test-${Date.now()}`;
assert.equal(consumeRateLimit(key, 2, 60_000).allowed, true);
assert.equal(consumeRateLimit(key, 2, 60_000).allowed, true);
assert.equal(consumeRateLimit(key, 2, 60_000).allowed, false);

console.log("auth security tests: all passed");
