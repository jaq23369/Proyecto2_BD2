export function detectType(value) {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (Array.isArray(value)) return "list";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
  return "string";
}

export function fmt(value) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function shortId(s, n = 18) {
  if (!s) return "—";
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export const cx = classNames;

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function avatarColor(seed = "") {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-orange-500 to-amber-500",
    "from-purple-500 to-fuchsia-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-purple-500",
  ];
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export function initials(name = "?") {
  const s = String(name).trim();
  if (!s) return "?";
  const parts = s.split(/[\s_]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || s[0].toUpperCase();
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

export function compactNumber(n) {
  const x = Number(n) || 0;
  if (x >= 1e6) return (x / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (x >= 1e3) return (x / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(x);
}

export function extractHashtags(text = "") {
  const out = new Set();
  for (const m of String(text).matchAll(/#([\p{L}0-9_]{2,30})/giu)) out.add(m[1].toLowerCase());
  return [...out];
}
