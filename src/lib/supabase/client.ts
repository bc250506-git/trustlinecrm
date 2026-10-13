import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qlfuwodxlfxirfvarczd.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZnV3b2R4bGZ4aXJmdmFyY3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTkyMjMsImV4cCI6MjEwNzM3NTIyM30.bFqpqDib-9u5j19ftLjhYY-FtCpWXzCLJyGMEGfRxoc"
  );
}
