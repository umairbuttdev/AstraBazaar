export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
  }
  return "http://127.0.0.1:3000";
}
