"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
