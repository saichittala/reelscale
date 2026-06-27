import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedScript: string | null = null;

export function getDashboardScript() {
  if (process.env.NODE_ENV === "production" && cachedScript) {
    return cachedScript;
  }

  const html = readFileSync(join(process.cwd(), "dashboard", "dashboard.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  const mainScript = scripts.find((script) => script.includes("async function init()")) ?? "";

  const script = mainScript
    .replace(/window\.location\.href = "login\.html";/g, 'window.location.href = "/dashboard/login";')
    .replace(/href="login\.html"/g, 'href="/dashboard/login"')
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/styles\.css/g, '/styles.css')
    .replace(/\.\.\/dashboard\.css/g, '/dashboard/dashboard.css')
    .replace(/\.\.\/fonts\.css/g, '/fonts.css')
    .replace(
      /(init\(\);)/g,
      `try { $1 } catch(e) { console.error("Dashboard init failed:", e); }`
    );

  cachedScript = script;
  return script;
}
