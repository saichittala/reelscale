export function fmt(n: number): string {
  if (n >= 100000) {
    return (n / 100000).toFixed(1) + "L";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + "K";
  }
  return String(n);
}

export function fmtFull(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(str: string): string {
  if (!str) return "";
  const parts = str.split("-");
  if (parts.length !== 3) return str;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  return `${months[monthIdx] || parts[1]} ${day}, ${year}`;
}

export function createWhatsAppLink(phone: string): string {
  const message = `Hey 👋\n\nWe came across your brand and instantly saw huge potential 🚀\n\nHonestly, with the right content and visual presentation, your brand could stand out on a whole new level 📈\n\nWe're ReelScale — a premium cinematic reel brand creating high-performing content that makes brands look more premium, more trusted, and more impactful ✨\n\nFeel like we could really elevate your brand's online presence 🔥\n\nWe'd genuinely love to collaborate and create something visually powerful together.\n\n— Team ReelScale`;
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}
