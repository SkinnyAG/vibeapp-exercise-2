import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/permissions";

export default async function Home() {
  const session = await getSession(await headers());

  // Redirect based on authentication status
  if (session?.user) {
    // Redirect authenticated users to dashboard
    redirect("/dashboard");
  } else {
    // Redirect unauthenticated users to login
    redirect("/login");
  }
}
