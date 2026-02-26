import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signOutAction } from "@/lib/actions/auth";
import Link from "next/link";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  const [user] = await db
    .select({
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              >
                AI Guidebook
              </Link>
              <nav className="ml-10 flex space-x-8">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Dashboard
                </Link>
                {/* <Link
                  href="/courses"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Courses
                </Link> */}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {user.name}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">
                  {user.role}
                </div>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
