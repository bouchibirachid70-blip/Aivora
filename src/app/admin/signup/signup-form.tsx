"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminSignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      });
      const data = (await res.json()) as { error?: string; user?: { email: string } };
      if (!res.ok) {
        const message = data.error || "Unable to create the admin account.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Admin account created", { description: data.user?.email });
      router.replace("/admin/settings");
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <Card className="relative z-10 w-full max-w-md border-border/60 bg-card/80 shadow-xl backdrop-blur">
        <CardHeader>
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
            <Link href="/admin/settings"><ArrowLeft className="size-4" />Back to settings</Link>
          </Button>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow"><Sparkles className="size-5" /></div>
            <div>
              <CardTitle className="text-xl">Add admin account</CardTitle>
              <CardDescription>Create an account for a trusted administrator.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldPlus className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Only an authenticated administrator can access this page. The new account receives the same administrator access.</span>
          </div>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-describedby="password-help" /><p id="password-help" className="text-xs text-muted-foreground">Use 12+ characters with uppercase, lowercase, and a number.</p></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
            {error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? <><Loader2 className="size-4 animate-spin" />Creating…</> : "Create admin account"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
