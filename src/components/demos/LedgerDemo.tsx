"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * MoneyMate’s client-side filtering, live: thousands of generated transactions, filtered and
 * aggregated on every keystroke, with the real time it took shown next to the result.
 */

const CATS = ["Food", "Transport", "Shopping", "Bills", "Fun", "Health"] as const;
type Cat = (typeof CATS)[number];
const MERCHANTS: Record<Cat, string[]> = {
  Food: ["Swiggy", "Zomato", "Blinkit", "Chai Point", "Domino’s", "Haldiram’s", "BigBasket"],
  Transport: ["Uber", "Ola", "Rapido", "Metro card", "IndianOil", "IRCTC"],
  Shopping: ["Amazon", "Flipkart", "Myntra", "Decathlon", "Croma", "Nykaa"],
  Bills: ["Airtel", "Jio", "Electricity", "Broadband", "Rent", "Gas cylinder"],
  Fun: ["BookMyShow", "Spotify", "Netflix", "Steam", "PVR", "Bowling"],
  Health: ["Apollo Pharmacy", "Cult.fit", "1mg", "Practo", "Dentist"],
};
const SPAN: Record<Cat, [number, number]> = {
  Food: [60, 900], Transport: [30, 1200], Shopping: [300, 6000], Bills: [199, 18000], Fun: [99, 1500], Health: [150, 4000],
};
const RANGES = [{ label: "30 days", days: 30 }, { label: "90 days", days: 90 }, { label: "1 year", days: 365 }];
const DAY = 86_400_000;

type Ledger = { n: number; day: Int16Array; cat: Uint8Array; amount: Float64Array; merchant: string[]; hay: string[] };

function generate(n: number): Ledger {
  // Seeded, so every visitor sees the same data.
  let s = 20260601;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const day = new Int16Array(n), cat = new Uint8Array(n), amount = new Float64Array(n);
  const merchant: string[] = new Array(n), hay: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const c = Math.floor(rand() * CATS.length);
    const name = CATS[c];
    const list = MERCHANTS[name];
    const [lo, hi] = SPAN[name];
    day[i] = Math.floor(rand() * 365);
    cat[i] = c;
    amount[i] = Math.round(lo + (hi - lo) * rand() ** 2.2);
    merchant[i] = list[Math.floor(rand() * list.length)];
    hay[i] = `${merchant[i]} ${name}`.toLowerCase();
  }
  return { n, day, cat, amount, merchant, hay };
}

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

export default function LedgerDemo() {
  const [size, setSize] = useState(10_000);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<number | null>(null);
  const [range, setRange] = useState(365);
  const [genMs, setGenMs] = useState(0);
  const genTime = useRef(0);

  const ledger = useMemo(() => {
    const t = performance.now();
    const l = generate(size);
    genTime.current = performance.now() - t;
    return l;
  }, [size]);
  useEffect(() => setGenMs(genTime.current), [ledger]);

  const result = useMemo(() => {
    const t0 = performance.now();
    const q = query.trim().toLowerCase();
    const byCat = new Float64Array(CATS.length);
    const byMonth = new Float64Array(12);
    let count = 0, total = 0;
    const recent: number[] = [];
    for (let i = 0; i < ledger.n; i++) {
      if (ledger.day[i] >= range) continue;
      if (cat !== null && ledger.cat[i] !== cat) continue;
      if (q && !ledger.hay[i].includes(q)) continue;
      count++;
      total += ledger.amount[i];
      byCat[ledger.cat[i]] += ledger.amount[i];
      byMonth[11 - Math.min(11, Math.floor(ledger.day[i] / 30.42))] += ledger.amount[i];
      if (recent.length < 4 || ledger.day[i] < ledger.day[recent[recent.length - 1]]) {
        recent.push(i);
        recent.sort((a, b) => ledger.day[a] - ledger.day[b]);
        if (recent.length > 4) recent.pop();
      }
    }
    return { count, total, byCat, byMonth, recent, ms: performance.now() - t0 };
  }, [ledger, query, cat, range]);

  const max = Math.max(1, ...result.byMonth);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) =>
      new Date(now.getFullYear(), now.getMonth() - 11 + i, 1).toLocaleString("en-IN", { month: "short" }),
    );
  }, []);
  const ms = result.ms < 0.1 ? "under 0.1" : result.ms.toFixed(1);

  return (
    <div className="demo demo-ledger">
      <div className="ledger-top">
        <label htmlFor="ledger-q" className="sr">Search transactions</label>
        <input
          id="ledger-q" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “swiggy”, “uber” or “rent”" autoComplete="off"
        />
        <div className="seg" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.days} aria-pressed={range === r.days} onClick={() => setRange(r.days)}>{r.label}</button>
          ))}
        </div>
      </div>
      <div className="ledger-cats" role="group" aria-label="Category">
        <button aria-pressed={cat === null} onClick={() => setCat(null)}>All</button>
        {CATS.map((c, i) => (
          <button key={c} aria-pressed={cat === i} onClick={() => setCat(cat === i ? null : i)}>{c}</button>
        ))}
      </div>

      <div className="ledger-stats" aria-live="polite">
        <p className="ledger-time">
          <b>{ms} ms</b> to filter {ledger.n.toLocaleString("en-IN")} transactions
        </p>
        <p><b>{result.count.toLocaleString("en-IN")}</b> matches, <b>{inr(result.total)}</b> spent</p>
      </div>

      <svg className="ledger-chart" viewBox="0 0 360 120" role="img" aria-label="Spending per month for the matching transactions">
        {Array.from(result.byMonth).map((v, i) => {
          const h = (v / max) * 92;
          return (
            <g key={i}>
              <rect x={i * 30 + 4} y={100 - h} width={22} height={Math.max(h, v ? 2 : 0)} rx={4} className={v ? "bar" : "bar empty"} />
              <text x={i * 30 + 15} y={116} textAnchor="middle">{months[i]}</text>
            </g>
          );
        })}
      </svg>

      <ul className="ledger-rows">
        {result.recent.length === 0 && <li className="none">Nothing matches. Clear the search or pick another category.</li>}
        {result.recent.map((i) => (
          <li key={i}>
            <span>{ledger.merchant[i]}</span>
            <span className="muted">{CATS[ledger.cat[i]]}, {new Date(Date.now() - ledger.day[i] * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <b>{inr(ledger.amount[i])}</b>
          </li>
        ))}
      </ul>

      <div className="demo-controls">
        <button className="d-btn primary" onClick={() => setSize(size === 10_000 ? 100_000 : 10_000)}>
          {size === 10_000 ? "Make it 100,000 rows" : "Back to 10,000 rows"}
        </button>
        {genMs > 0 && <span className="demo-hint">Generated in {genMs.toFixed(0)} ms, right here in your browser.</span>}
      </div>
    </div>
  );
}
