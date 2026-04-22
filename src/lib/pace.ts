// Pace math + types. Ported verbatim from design_files/data.jsx.

export type RepId = string;

export interface ActivityToday {
  calls: number;
  texts: number;
  set: number;
  shown: number;
}

export interface Rep {
  id: RepId;
  name: string;
  short: string;
  color: string;
  isYou?: boolean;

  sold: number;
  newSold: number;
  usedSold: number;
  gross: number;

  goalUnits: number;
  goalGross: number;

  streak: number;
  daysSinceSale: number;
  lastActivity: string;

  activityToday: ActivityToday;
  badges: string[];
}

export interface MonthCtx {
  label: string;
  day: number;
  daysTotal: number;
  daysRemaining: number;
  daysElapsed: number;
}

export interface Ratios {
  close: number;
  show: number;
  set: number;
  contact: number;
}

export type PaceStatus = "ahead" | "onpace" | "behind";

export interface PaceResult {
  expectedByNow: number;
  paceDelta: number;
  unitsToGo: number;
  grossToGo: number;
  daysLeft: number;
  dailyUnitsNeeded: number;
  shownNeeded: number;
  setNeeded: number;
  contactsNeeded: number;
  outboundNeeded: number;
  daily: { outbound: number; contacts: number; set: number; shown: number };
  status: PaceStatus;
  goalPct: number;
  grossPct: number;
  apptsShownMonth: number;
  closeRate: number;
}

// League-average defaults — spec §README Core Math
export const RATIOS: Ratios = {
  close: 0.2,
  show: 0.65,
  set: 0.15,
  contact: 0.3,
};

// Derived from the current date in the store's timezone. For client-side rendering
// where tz isn't known, we pass no tz and fall back to local tz (good enough for v1).
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export function buildMonth(now: Date = new Date(), tz?: string): MonthCtx {
  // Get year/month/day in the given timezone (or local if not provided).
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const monthIdx = Number(parts.month) - 1;
  const day = Number(parts.day);
  // Last day of month
  const daysTotal = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const daysElapsed = Math.max(1, day); // day-of-month, inclusive
  const daysRemaining = Math.max(1, daysTotal - day + 1); // including today

  return {
    label: `${MONTH_LABELS[monthIdx]} ${year}`,
    day,
    daysTotal,
    daysRemaining,
    daysElapsed,
  };
}

// Back-compat default export — dynamic; recomputed on module load.
// (Server-rendered pages always get fresh evaluation; client reads snapshot.)
export const MONTH: MonthCtx = buildMonth();

// Sample roster — spec: "You" is Todd Ramirez, behind pace.
export const INITIAL_REPS: Rep[] = [
  {
    id: "marcus",
    name: "Marcus Hale",
    short: "MH",
    color: "#2b6cb0",
    sold: 14,
    newSold: 8,
    usedSold: 6,
    gross: 31200,
    goalUnits: 12,
    goalGross: 26000,
    streak: 11,
    daysSinceSale: 1,
    lastActivity: "today",
    activityToday: { calls: 28, texts: 44, set: 3, shown: 2 },
    badges: ["first-sale", "three-deal", "perfect-week"],
  },
  {
    id: "jessica",
    name: "Jessica Tran",
    short: "JT",
    color: "#6b4fb8",
    sold: 11,
    newSold: 4,
    usedSold: 7,
    gross: 24800,
    goalUnits: 10,
    goalGross: 22000,
    streak: 7,
    daysSinceSale: 0,
    lastActivity: "today",
    activityToday: { calls: 22, texts: 38, set: 2, shown: 2 },
    badges: ["first-sale", "comeback"],
  },
  {
    id: "you",
    name: "Todd Ramirez",
    short: "YOU",
    color: "#0d0e10",
    isYou: true,
    sold: 7,
    newSold: 3,
    usedSold: 4,
    gross: 14200,
    goalUnits: 12,
    goalGross: 28000,
    streak: 4,
    daysSinceSale: 3,
    lastActivity: "today",
    activityToday: { calls: 18, texts: 27, set: 2, shown: 1 },
    badges: ["first-sale"],
  },
  {
    id: "derek",
    name: "Derek Okafor",
    short: "DO",
    color: "#b8842a",
    sold: 6,
    newSold: 2,
    usedSold: 4,
    gross: 11400,
    goalUnits: 12,
    goalGross: 26000,
    streak: 0,
    daysSinceSale: 5,
    lastActivity: "2 days ago",
    activityToday: { calls: 0, texts: 0, set: 0, shown: 0 },
    badges: ["first-sale"],
  },
  {
    id: "priya",
    name: "Priya Shah",
    short: "PS",
    color: "#17a058",
    sold: 10,
    newSold: 5,
    usedSold: 5,
    gross: 22100,
    goalUnits: 11,
    goalGross: 24000,
    streak: 6,
    daysSinceSale: 1,
    lastActivity: "today",
    activityToday: { calls: 19, texts: 31, set: 2, shown: 1 },
    badges: ["first-sale", "three-deal"],
  },
  {
    id: "mike",
    name: "Mike Delacroix",
    short: "MD",
    color: "#d43f3a",
    sold: 9,
    newSold: 3,
    usedSold: 6,
    gross: 18600,
    goalUnits: 11,
    goalGross: 24000,
    streak: 3,
    daysSinceSale: 2,
    lastActivity: "today",
    activityToday: { calls: 15, texts: 22, set: 1, shown: 1 },
    badges: ["first-sale"],
  },
  {
    id: "aaron",
    name: "Aaron Webb",
    short: "AW",
    color: "#3a8a7a",
    sold: 5,
    newSold: 1,
    usedSold: 4,
    gross: 9800,
    goalUnits: 10,
    goalGross: 22000,
    streak: 0,
    daysSinceSale: 4,
    lastActivity: "yesterday",
    activityToday: { calls: 6, texts: 12, set: 0, shown: 0 },
    badges: ["first-sale"],
  },
  {
    id: "leah",
    name: "Leah Park",
    short: "LP",
    color: "#c25c8f",
    sold: 8,
    newSold: 4,
    usedSold: 4,
    gross: 17400,
    goalUnits: 10,
    goalGross: 22000,
    streak: 5,
    daysSinceSale: 1,
    lastActivity: "today",
    activityToday: { calls: 20, texts: 29, set: 2, shown: 1 },
    badges: ["first-sale", "comeback"],
  },
];

// The product. Given a rep + month + ratios, back-solve required daily activity.
export function computePace(
  rep: Rep,
  month: MonthCtx = MONTH,
  ratios: Ratios = RATIOS,
): PaceResult {
  const expectedByNow = (rep.goalUnits * month.daysElapsed) / month.daysTotal;
  const paceDelta = rep.sold - expectedByNow;
  const unitsToGo = Math.max(0, rep.goalUnits - rep.sold);
  const grossToGo = Math.max(0, rep.goalGross - rep.gross);
  const daysLeft = month.daysRemaining;

  const dailyUnitsNeeded = unitsToGo / daysLeft;
  const shownNeeded = unitsToGo / ratios.close;
  const setNeeded = shownNeeded / ratios.show;
  const contactsNeeded = setNeeded / ratios.set;
  const outboundNeeded = contactsNeeded / ratios.contact;

  const daily = {
    outbound: Math.ceil(outboundNeeded / daysLeft),
    contacts: Math.ceil(contactsNeeded / daysLeft),
    set: Math.ceil(setNeeded / daysLeft),
    shown: Math.ceil(shownNeeded / daysLeft),
  };

  const status: PaceStatus =
    paceDelta >= 0.5 ? "ahead" : paceDelta <= -1.0 ? "behind" : "onpace";

  const goalPct = Math.min(100, Math.round((rep.sold / rep.goalUnits) * 100));
  const grossPct = Math.min(100, Math.round((rep.gross / rep.goalGross) * 100));

  const apptsShownMonth = Math.max(
    rep.sold + 3,
    Math.round(rep.sold / ratios.close),
  );
  const closeRate = rep.sold / apptsShownMonth;

  return {
    expectedByNow,
    paceDelta,
    unitsToGo,
    grossToGo,
    daysLeft,
    dailyUnitsNeeded,
    shownNeeded,
    setNeeded,
    contactsNeeded,
    outboundNeeded,
    daily,
    status,
    goalPct,
    grossPct,
    apptsShownMonth,
    closeRate,
  };
}

export type RankMetric = "sold" | "gross" | "close";

export function rankReps(reps: Rep[], metric: RankMetric = "sold"): Rep[] {
  const getter: Record<RankMetric, (r: Rep) => number> = {
    sold: (r) => r.sold,
    gross: (r) => r.gross,
    close: (r) => computePace(r).closeRate,
  };
  return [...reps].sort((a, b) => getter[metric](b) - getter[metric](a));
}

// ── Formatters ──────────────────────────────────────────────
export const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString();
export const fmtUSDk = (n: number) =>
  n >= 1000
    ? "$" +
      (n / 1000).toFixed(n >= 10000 ? 1 : 1).replace(/\.0$/, "") +
      "k"
    : "$" + n;
export const fmtPct = (n: number) => Math.round(n * 100) + "%";
export const fmtDelta = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1);
