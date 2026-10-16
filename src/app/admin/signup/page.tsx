import type { Metadata } from "next";
import { AdminSignupForm } from "@/app/admin/signup/signup-form";

export const metadata: Metadata = { title: "Add admin account" };

export default function AdminSignupPage() {
  return <AdminSignupForm />;
}
