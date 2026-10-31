"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ScrapeFlow’s self-healing selectors, simplified: when a redesign breaks the saved CSS selector,
 * every element on the page is scored against a fingerprint of the old target (does it look like
 * a price, is it labelled as one, is it crossed out, same tag, similar depth, close to the last
 * value seen) and the best match becomes the new selector.
 */

type El = { tag: string; cls: string; text?: string; attr?: string; kids?: El[] };
type Flat = { el: El; depth: number; parent: El | null; prev: El | null; index: number; line: number };

let seed = 7;
const hash = () => `css-${((seed = (seed * 48271) % 2147483647) % 46655).toString(36).padStart(3, "0")}${"abcdefghjk"[seed % 10]}`;

const PAGES: (() => El)[] = [
  () => ({ tag: "div", cls: "product", kids: [
    { tag: "h2", cls: "title", text: "Trail Runner 2" },
    { tag: "div", cls: "meta", kids: [
      { tag: "span", cls: "label", text: "Price" },
      { tag: "span", cls: "price-tag", text: "₹4,299" },
    ] },
    { tag: "button", cls: "buy", text: "Add to cart" },
  ] }),
  () => ({ tag: "div", cls: hash(), kids: [
    { tag: "div", cls: hash(), kids: [
      { tag: "h1", cls: hash(), text: "Trail Runner 2" },
      { tag: "div", cls: hash(), kids: [
        { tag: "del", cls: hash(), text: "₹5,999" },
        { tag: "p", cls: hash(), text: "Price" },
        { tag: "strong", cls: hash(), text: "₹4,299" },
        { tag: "span", cls: hash(), text: "Save ₹1,700" },
      ] },
    ] },
    { tag: "button", cls: hash(), text: "Add to cart" },
  ] }),
  () => ({ tag: "section", cls: hash(), kids: [
    { tag: "h2", cls: hash(), text: "Trail Runner 2" },
    { tag: "div", cls: hash(), kids: [
      { tag: "small", cls: hash(), text: "MRP ₹5,999" },
      { tag: "span", cls: hash(), text: "Our price" },
      { tag: "div", cls: hash(), text: "₹4,299" },
    ] },
    { tag: "p", cls: hash(), text: "EMI from ₹360/mo" },
    { tag: "button", cls: hash(), text: "Buy now" },
  ] }),
  () => ({ tag: "article", cls: hash(), kids: [
    { tag: "div", cls: hash(), kids: [
      { tag: "span", cls: hash(), attr: 'itemprop="price"', text: "₹4,299" },
      { tag: "span", cls: hash(), text: "incl. taxes" },
    ] },
    { tag: "h3", cls: hash(), text: "Trail Runner 2" },
    { tag: "ul", cls: hash(), kids: [{ tag: "li", cls: hash(), text: "Free delivery over ₹999" }] },
  ] }),
];

function flatten(root: El) {
  const out: Flat[] = [];
  let line = 0;
  const walk = (el: El, depth: number, parent: El | null, prev: El | null, index: number) => {
    out.push({ el, depth, parent, prev, index, line: line++ });
    el.kids?.forEach((k, i) => walk(k, depth + 1, el, i ? el.kids![i - 1] : null, i));
    if (el.kids) line++; // closing tag line
  };
  walk(root, 0, null, null, 0);
  return out;
}

const LAST_SEEN = 4299;
const money = (t: string) => Number((t.match(/₹([\d,]+)/)?.[1] ?? "").replace(/,/g, "")) || null;

function score(f: Flat) {
  const t = f.el.text ?? "";
  const reasons: string[] = [];
  let s = 0;
  if (/^₹[\d,]+$/.test(t)) { s += 0.35; reasons.push("Looks like a price"); }
  else if (t.includes("₹")) { s += 0.1; reasons.push("Mentions a price"); }
  if (/price/i.test(f.prev?.text ?? "") || /price/i.test(f.el.attr ?? "")) { s += 0.25; reasons.push("Labelled as price"); }
  if (t.includes("₹") && !["del", "s", "small"].includes(f.el.tag)) { s += 0.1; reasons.push("Not crossed out"); }
  if (f.el.tag === "span") { s += 0.05; reasons.push("Same tag"); }
  s += 0.05 * Math.max(0, 1 - Math.abs(f.depth - 2) / 3);
  const v = money(t);
  if (v && Math.abs(v - LAST_SEEN) / LAST_SEEN < 0.25) { s += 0.2; reasons.push("Close to last value"); }
  return { s: Math.min(1, s), reasons };
}

function selectorFor(f: Flat, all: Flat[]) {
  if (f.el.attr) return `[${f.el.attr}]`;
  const parent = all.find((x) => x.el === f.parent);
  const nth = (f.parent?.kids ?? []).filter((k, i) => k.tag === f.el.tag && i <= f.index).length;
  return `${parent ? `${parent.el.tag} > ` : ""}${f.el.tag}:nth-of-type(${nth})`;
}

export default function HealDemo() {
  const [version, setVersion] = useState(0);
  const [step, setStep] = useState(4); // 0 = not run yet; 1..4 = reveal steps
  const [selector, setSelector] = useState(".price-tag");
  const root = useMemo(() => PAGES[version](), [version]);
  const flat = useMemo(() => flatten(root), [root]);

  const direct = flat.filter((f) => selector.startsWith(".") ? f.el.cls === selector.slice(1) : false);
  const ranked = useMemo(
    () => flat.filter((f) => f.el.text).map((f) => ({ f, ...score(f) })).sort((a, b) => b.s - a.s).slice(0, 3),
    [flat],
  );
  const broken = direct.length === 0;
  const winner = broken ? ranked[0] : null;
  const found = broken ? winner?.f : direct[0];

  // Reveal the run step by step, so you can follow what the scraper does.
  useEffect(() => {
    if (step === 0 || step >= 4) return;
    const t = setTimeout(() => setStep(step + 1), 650);
    return () => clearTimeout(t);
  }, [step]);
  useEffect(() => {
    if (step === 4 && broken && winner) setSelector(selectorFor(winner.f, flat));
  }, [step, broken, winner, flat]);

  const redesign = () => {
    setVersion((v) => (v % (PAGES.length - 1)) + 1);
    setSelector((s) => (s.startsWith(".") ? s : ".price-tag"));
    setStep(0);
  };

  const highlight = step >= (broken ? 3 : 1) ? found : undefined;

  const lines: { depth: number; html: React.ReactNode; f?: Flat }[] = [];
  const draw = (el: El, depth: number) => {
    const f = flat.find((x) => x.el === el)!;
    const open = (
      <>
        <span className="t">&lt;{el.tag}</span> <span className="a">class</span>=<span className="v">"{el.cls}"</span>
        {el.attr && <> <span className="a">{el.attr.split("=")[0]}</span>=<span className="v">{el.attr.split("=")[1]}</span></>}
        <span className="t">&gt;</span>
      </>
    );
    if (el.kids) {
      lines.push({ depth, html: open, f });
      el.kids.forEach((k) => draw(k, depth + 1));
      lines.push({ depth, html: <span className="t">&lt;/{el.tag}&gt;</span> });
    } else {
      lines.push({ depth, f, html: <>{open}<span className="x">{el.text}</span><span className="t">&lt;/{el.tag}&gt;</span></> });
    }
  };
  draw(root, 0);

  return (
    <div className="demo demo-heal">
      <pre className="heal-code" aria-label="The product page’s HTML">
        {lines.map((l, i) => (
          <span
            key={i}
            className={`ln${l.f && l.f === highlight ? " hit" : ""}${step >= 2 && broken && l.f && ranked.some((r) => r.f === l.f && r.f !== highlight) ? " cand" : ""}`}
            style={{ paddingLeft: `${l.depth * 1.4 + 0.9}em` }}
          >
            {l.html}
          </span>
        ))}
      </pre>

      <div className="heal-log" aria-live="polite">
        {step === 0 ? (
          <p className="heal-line">The site just shipped a redesign. Run the scraper and see what happens.</p>
        ) : (
          <>
            <p className={`heal-line${broken ? " bad" : " good"}`}>
              Saved selector <code>{broken ? ".price-tag" : selector}</code>{" "}
              {broken ? "found nothing. The class names changed." : `found ${found?.el.text}.`}
            </p>
            {broken && step >= 2 && (
              <div className="heal-cands">
                <p className="heal-line">Scoring every element against the old target’s fingerprint:</p>
                {ranked.map((r, i) => (
                  <div className={`cand-row${i === 0 && step >= 3 ? " win" : ""}`} key={i}>
                    <code>{r.f.el.text}</code>
                    <span className="meter"><i style={{ width: `${r.s * 100}%` }} /></span>
                    <span className="pct">{Math.round(r.s * 100)}%</span>
                    <span className="why">{r.reasons.join(", ") || "No price signals"}</span>
                  </div>
                ))}
              </div>
            )}
            {broken && step >= 4 && winner && (
              <p className="heal-line good">
                Healed. Extracted <b>{winner.f.el.text}</b> and saved the new selector <code>{selector}</code>.
              </p>
            )}
          </>
        )}
      </div>

      <div className="demo-controls">
        <button className="d-btn primary" onClick={redesign} disabled={step > 0 && step < 4}>Redesign the site</button>
        <button className="d-btn" onClick={() => setStep(1)} disabled={step !== 0}>Run the scraper</button>
      </div>
    </div>
  );
}
