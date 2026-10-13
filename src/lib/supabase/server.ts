import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qlfuwodxlfxirfvarczd.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZnV3b2R4bGZ4aXJmdmFyY3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTkyMjMsImV4cCI6MjEwNzM3NTIyM30.bFqpqDib-9u5j19ftLjhYY-FtCpWXzCLJyGMEGfRxoc",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component içindeyken cookie yazma yok sayılır
          }
        },
      },
    }
  );
}
