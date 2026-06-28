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

  const prefix = "";

  const script = mainScript
    .replace(/window\.location\.href = "login\.html";/g, `window.location.href = "${prefix}/dashboard/login";`)
    .replace(/href="login\.html"/g, `href="${prefix}/dashboard/login"`)
    .replace(/\.\.\/assets\//g, `${prefix}/assets/`)
    .replace(/\.\.\/styles\.css/g, `${prefix}/styles.css`)
    .replace(/\.\.\/dashboard\.css/g, `${prefix}/dashboard/dashboard.css`)
    .replace(/\.\.\/fonts\.css/g, `${prefix}/fonts.css`)
    .replace(
      /const useLocalAPI = window\.location\.hostname === "localhost" \|\| window\.location\.hostname === "127.0.0.1";/g,
      `const useLocalAPI = ${process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true"};`
    )
    .replace(
      /(init\(\);)/g,
      `try { $1 } catch(e) { console.error("Dashboard init failed:", e); }`
    );

  cachedScript = script;
  return script;
}
