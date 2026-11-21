import { Client } from "../types";

export function normalizeDate(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return trimmed;
}

export function getMonthYearKey(dateStr?: string): string {
  if (!dateStr) return "";
  const normalized = normalizeDate(dateStr);
  const parts = normalized.split("-");
  if (parts.length >= 2 && parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, "0")}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthYearLabel(monthKey?: string): string {
  if (!monthKey || monthKey === "all") return "All Months";
  const [yStr, mStr] = monthKey.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return monthKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getPreviousMonthKey(monthKey: string): string {
  if (!monthKey || monthKey === "all") return "";
  const [yStr, mStr] = monthKey.split("-");
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return "";
  m -= 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function isClientActiveInMonth(c: Client, monthKey: string): boolean {
  if (!monthKey || monthKey === "all") return true;
  // If no date is set, client is active by default unless marked churned
  if (!c.date) return c.status !== "Churned";

  const clientStartMonth = normalizeDate(c.date).slice(0, 7); // e.g. "2026-06"

  // If client was onboarded AFTER this month, they are not active in this month yet
  if (clientStartMonth && clientStartMonth > monthKey) return false;

  // If client churned and ended prior to this month, they are not active
  if (c.status === "Churned" && c.endDate) {
    const endMonth = normalizeDate(c.endDate).slice(0, 7);
    if (endMonth && endMonth < monthKey) return false;
  }
  return true;
}

export function generateAvailableMonths(clients: Client[]): { key: string; label: string }[] {
  let minYear = 2026;
  let minMonth = 6;
  let maxYear = 2026;
  let maxMonth = 12;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  if (nowYear > maxYear || (nowYear === maxYear && nowMonth > maxMonth)) {
    maxYear = nowYear;
    maxMonth = nowMonth + 1;
  }

  clients.forEach((c) => {
    if (c.date) {
      const normalized = normalizeDate(c.date);
      const parts = normalized.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          if (y < minYear || (y === minYear && m < minMonth)) {
            minYear = y;
            minMonth = m;
          }
          if (y > maxYear || (y === maxYear && m > maxMonth)) {
            maxYear = y;
            maxMonth = m;
          }
        }
      }
    }
  });

  const list: { key: string; label: string }[] = [];
  let currY = minYear;
  let currM = minMonth;

  while (currY < maxYear || (currY === maxYear && currM <= maxMonth)) {
    const key = `${currY}-${String(currM).padStart(2, "0")}`;
    const d = new Date(currY, currM - 1, 1);
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    list.push({ key, label });
    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
  }
  return list;
}
