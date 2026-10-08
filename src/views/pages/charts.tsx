import { useEffect, useRef, useState, type ReactNode } from "react";

/* Small SVG chart set for the ERP pages. One blue family (--ch1..--ch5), neutral greys, and amber/red
   only where a value is genuinely a warning. Every chart can be clicked through via onPick. */

export const PALETTE = ["var(--ch1)", "var(--ch2)", "var(--ch3)", "var(--ch4)", "var(--ch5)"];
export const TONE_COLOR: Record<string, string> = { ok: "var(--ok)", info: "var(--accent)", warn: "var(--warn)", bad: "var(--bad)", muted: "var(--neutral)" };

export type Fmt = (n: number) => string;
export const compact: Fmt = (n) => {
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e6) return s + "€" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 2).replace(/\.?0+$/, "") + "m";
  if (a >= 1e3) return s + "€" + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "k";
  return s + "€" + Math.round(a);
};
const plain: Fmt = (n) => String(Math.round(n * 10) / 10);

/** Measures an element's width so SVG text is never stretched. */
function useWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 1.2 ? 1.2 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10) * p;
}

/* ───────── sparkline ───────── */
export function Sparkline({ data, w = 92, h = 30, color = "var(--accent)" }: { data: number[]; w?: number; h?: number; color?: string }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), span = mx - mn || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * (w - 4) + 2, h - 3 - ((d - mn) / span) * (h - 8)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <path d={line + ` L${w - 2} ${h} L2 ${h} Z`} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  );
}

/* ───────── legend ───────── */
export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return <div className="erp-legend">{items.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>;
}

export type Series = { name: string; data: (number | null)[]; color?: string; kind?: "column" | "line"; dashed?: boolean };

/* ───────── columns, stacked columns and lines, one coordinate system ───────── */
export function XYChart({ labels, series, stacked, area, h = 240, fmt = compact, target, targetLabel, onPick, unit, max }: {
  labels: string[]; series: Series[]; stacked?: boolean; area?: boolean; h?: number; fmt?: Fmt; target?: number; targetLabel?: string; onPick?: (i: number) => void; unit?: string; max?: number;
}) {
  const [ref, w] = useWidth();
  const [hov, setHov] = useState<number | null>(null);
  const cols = series.filter((s) => (s.kind || "column") === "column" && !area);
  const lines = series.filter((s) => s.kind === "line" || area);
  const color = (s: Series, i: number) => s.color || PALETTE[i % PALETTE.length];
  const n = labels.length;
  const padL = 46, padR = 10, padT = 10, padB = 24;
  const iw = Math.max(40, w - padL - padR), ih = h - padT - padB;
  let top = 0;
  for (let i = 0; i < n; i++) {
    const colSum = stacked ? cols.reduce((a, s) => a + Math.max(0, s.data[i] || 0), 0) : Math.max(0, ...cols.map((s) => s.data[i] || 0));
    top = Math.max(top, colSum, ...lines.map((s) => s.data[i] || 0));
  }
  if (target) top = Math.max(top, target);
  const mx = max ?? niceMax(top * 1.04), lo = Math.min(0, ...series.flatMap((s) => s.data.map((d) => d ?? 0)));
  const mn = lo < 0 ? -niceMax(-lo) : 0;
  const y = (v: number) => padT + ih - ((v - mn) / (mx - mn)) * ih;
  const slot = iw / n;
  const bw = Math.min(46, slot * (stacked ? 0.58 : 0.7) / (stacked ? 1 : Math.max(1, cols.length)));
  const x = (i: number) => padL + slot * i + slot / 2;
  const ticks = 4;
  const tip = hov !== null && w > 0;
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {w > 0 && (
        <svg className="erp-svg" width={w} height={h} role="img" onMouseLeave={() => setHov(null)}>
          {Array.from({ length: ticks + 1 }, (_, k) => { const v = mn + ((mx - mn) * k) / ticks; return (
            <g key={k}><line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray={k === 0 ? "" : "2 4"} />
              <text x={padL - 8} y={y(v) + 4} textAnchor="end">{fmt(v)}</text></g>); })}
          {mn < 0 && <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" />}
          {target !== undefined && <g><line x1={padL} x2={w - padR} y1={y(target)} y2={y(target)} stroke="var(--warn)" strokeDasharray="5 4" strokeWidth={1.2} />
            {targetLabel && <text x={w - padR} y={y(target) - 5} textAnchor="end" style={{ fill: "var(--warn)" }}>{targetLabel}</text>}</g>}
          {labels.map((l, i) => (
            <g key={i}>
              <rect x={padL + slot * i} y={padT} width={slot} height={ih + 4} fill="var(--accent-faint)" opacity={hov === i ? 1 : 0} />
              <text x={x(i)} y={h - 6} textAnchor="middle" style={{ fill: hov === i ? "var(--ink)" : undefined }}>{l}</text>
            </g>))}
          {cols.map((s, si) => s.data.map((dd, i) => {
            const d = dd ?? 0;
            const base = stacked ? cols.slice(0, si).reduce((a, p) => a + Math.max(0, p.data[i] || 0), 0) : 0;
            const bx = stacked ? x(i) - bw / 2 : x(i) - (bw * cols.length) / 2 + si * bw;
            const y1 = y(base + Math.max(0, d)), y0 = y(base + (d < 0 ? 0 : 0)), neg = d < 0;
            const rect = neg ? { y: y(0), height: Math.max(1, y(d) - y(0)) } : { y: y1, height: Math.max(d ? 1.5 : 0, y0 - y1) };
            const last = stacked ? si === cols.length - 1 : true;
            return <rect key={si + "-" + i} className="erp-bar" x={bx} y={rect.y} width={Math.max(2, bw - (stacked ? 0 : 3))} height={rect.height}
              rx={last ? 4 : 1} fill={color(s, si)} opacity={hov === null || hov === i ? 1 : 0.55} style={{ animationDelay: i * 22 + "ms" }} />;
          }))}
          {lines.map((s, si) => {
            const idx = series.indexOf(s);
            const c = color(s, idx);
            const pts = s.data.map((d, i) => (d === null || d === undefined ? null : [x(i), y(d)]));
            let path = "", areaPath = "", run: number[][] = [];
            const flush = () => { if (run.length && area) areaPath += `M${run[0][0]} ${y(0)} ` + run.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + ` L${run[run.length - 1][0]} ${y(0)} Z `; run = []; };
            pts.forEach((p) => { if (p) { path += (run.length ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " "; run.push(p); } else flush(); });
            flush();
            return <g key={"l" + si}>
              {area && <path d={areaPath} fill={c} opacity={0.1} />}
              <path d={path} fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "6 5" : undefined} />
              {pts.map((p, i) => p ? <circle key={i} cx={p[0]} cy={p[1]} r={hov === i ? 4.5 : 2.6} fill={hov === i ? c : "var(--surface-strong)"} stroke={c} strokeWidth={1.6} /> : null)}
            </g>; })}
          {labels.map((_, i) => (
            <rect key={"h" + i} className={onPick ? "erp-hit" : undefined} x={padL + slot * i} y={padT} width={slot} height={ih + padB} fill="transparent"
              onMouseEnter={() => setHov(i)} onClick={onPick ? () => onPick(i) : undefined} />))}
        </svg>)}
      {tip && (
        <div className="erp-tip" style={{ left: Math.min(Math.max(x(hov!) + 14, 8), Math.max(8, w - 190)), top: 6 }}>
          <div style={{ color: "var(--tooltip-ink)", fontWeight: 600, marginBottom: 2 }}>{labels[hov!]}</div>
          {series.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.8 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: color(s, i), display: "inline-block" }} />{s.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{s.data[hov!] === null || s.data[hov!] === undefined ? "-" : fmt(s.data[hov!] as number)}{unit || ""}</span></div>)}
          {onPick && <div style={{ opacity: 0.55, marginTop: 3 }}>Click to open</div>}
        </div>)}
    </div>
  );
}

/* ───────── donut ───────── */
export type Slice = { label: string; value: number; text?: string; color?: string; tone?: string };
export function Donut({ items, size = 168, center, fmt = compact, onPick }: { items: Slice[]; size?: number; center?: { value: ReactNode; label: string }; fmt?: Fmt; onPick?: (i: number) => void }) {
  const [hov, setHov] = useState<number | null>(null);
  const total = items.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  const r = size / 2 - 12, c = size / 2, sw = 20, circ = 2 * Math.PI * r;
  let acc = 0;
  const col = (s: Slice, i: number) => s.color || (s.tone ? TONE_COLOR[s.tone] : PALETTE[i % PALETTE.length]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg width={size} height={size} role="img" onMouseLeave={() => setHov(null)}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--track)" strokeWidth={sw} />
          {items.map((s, i) => {
            const frac = Math.max(0, s.value) / total, len = Math.max(0, frac * circ - (items.length > 1 ? 3 : 0)), off = -acc * circ; acc += frac;
            return <circle key={i} className={onPick ? "erp-hit" : undefined} cx={c} cy={c} r={r} fill="none" stroke={col(s, i)} strokeWidth={hov === i ? sw + 4 : sw}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={off} transform={`rotate(-90 ${c} ${c})`} opacity={hov === null || hov === i ? 1 : 0.5}
              style={{ transition: "stroke-width .15s, opacity .15s" }} onMouseEnter={() => setHov(i)} onClick={onPick ? () => onPick(i) : undefined} />;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: size > 150 ? 24 : 19, fontWeight: 600, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{hov !== null ? Math.round((items[hov].value / total) * 100) + "%" : center ? center.value : fmt(total)}</div>
          <div className="erp-mono" style={{ fontSize: 9.5, marginTop: 2 }}>{hov !== null ? items[hov].label : center ? center.label : "Total"}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((s, i) => (
          <div key={i} className={onPick ? "erp-go" : undefined} onClick={onPick ? () => onPick(i) : undefined} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 10, alignItems: "center", fontSize: 12.5, padding: "5px 8px", borderRadius: 8, border: "1px solid transparent", background: hov === i ? "var(--accent-faint)" : "none" }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: col(s, i) }} />
            <span style={{ color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{s.text || fmt(s.value)}<span style={{ color: "var(--faint)", marginLeft: 8 }}>{Math.round((s.value / total) * 100)}%</span></span>
          </div>))}
      </div>
    </div>
  );
}

/* ───────── ranked horizontal bars ───────── */
export type Bar = { label: string; value: number; text?: string; sub?: string; tone?: string; color?: string; target?: number };
export function HBars({ items, fmt = compact, onPick, max }: { items: Bar[]; fmt?: Fmt; onPick?: (i: number) => void; max?: number }) {
  const [ref, w] = useWidth();
  const narrow = w > 0 && w < 440;
  const mx = max || Math.max(...items.map((b) => Math.max(b.value, b.target || 0)), 1);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: narrow ? 2 : 4 }}>
      {items.map((b, i) => {
        const label = (
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
            {b.sub && <span style={{ display: "block", fontSize: 11, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.sub}</span>}
          </span>);
        const track = (
          <span style={{ position: "relative", height: 10, borderRadius: 5, background: "var(--track)", display: "block" }}>
            <span className="erp-hbar" style={{ display: "block", height: "100%", width: Math.max(1.5, (b.value / mx) * 100) + "%", borderRadius: 5, background: b.color || (b.tone ? TONE_COLOR[b.tone] : "var(--accent)"), animationDelay: i * 40 + "ms" }} />
            {b.target !== undefined && <span style={{ position: "absolute", top: -3, bottom: -3, left: (b.target / mx) * 100 + "%", width: 2, background: "var(--ink)", opacity: 0.55, borderRadius: 1 }} />}
          </span>);
        const value = (
          <span style={{ fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 58, color: "var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            {b.text || fmt(b.value)}<span className="erp-arrow" style={{ color: "var(--accent)" }}>›</span></span>);
        return (
          <div key={i} className={onPick ? "erp-go" : undefined} onClick={onPick ? () => onPick(i) : undefined}
            style={narrow
              ? { display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, columnGap: 12, alignItems: "end", padding: "7px 10px", margin: "0 -10px", borderRadius: 10, border: "1px solid transparent", fontSize: 12.5 }
              : { display: "grid", gridTemplateColumns: "minmax(110px,190px) 1fr auto", alignItems: "center", gap: 14, padding: "7px 10px", margin: "0 -10px", borderRadius: 10, border: "1px solid transparent", fontSize: 12.5 }}>
            {label}
            {narrow ? <>{value}<span style={{ gridColumn: "1 / -1" }}>{track}</span></> : <>{track}{value}</>}
          </div>);
      })}
    </div>
  );
}

/* ───────── ring gauge ───────── */
export function Ring({ value, size = 120, label, sub, tone }: { value: number; size?: number; label?: ReactNode; sub?: string; tone?: string }) {
  const r = size / 2 - 9, c = size / 2, circ = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} role="img"><circle cx={c} cy={c} r={r} fill="none" stroke="var(--track)" strokeWidth={10} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={tone ? TONE_COLOR[tone] : "var(--accent)"} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${(v / 100) * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} /></svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size / 4.6, fontWeight: 600, letterSpacing: "-0.5px" }}>{label ?? Math.round(v) + "%"}</div>
        {sub && <div className="erp-mono" style={{ fontSize: 9, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ───────── gantt / timeline ───────── */
export type GanttRow = { label: string; sub?: string; start: string; end: string; progress?: number; tone?: string; text?: string; marks?: { at: string; label: string; tone?: string }[] };
export function Gantt({ rows, from, to, today, onPick }: { rows: GanttRow[]; from: string; to: string; today?: string; onPick?: (i: number) => void }) {
  const t0 = Date.parse(from), t1 = Date.parse(to), span = t1 - t0 || 1;
  const pos = (d: string) => Math.max(0, Math.min(100, ((Date.parse(d) - t0) / span) * 100));
  const months: { l: string; p: number }[] = [], years: { l: string; p: number }[] = [];
  const d = new Date(t0); d.setUTCDate(1);
  while (d.getTime() <= t1) {
    const p = pos(d.toISOString().slice(0, 10));
    months.push({ l: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()], p });
    if (d.getUTCMonth() === 0 || years.length === 0) years.push({ l: String(d.getUTCFullYear()), p });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  const tp = today ? pos(today) : null;
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 640 }}>
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 14, alignItems: "end", paddingBottom: 6 }}>
          <span />
          <div style={{ position: "relative", height: 32 }}>
            {years.map((y, i) => <span key={"y" + i} style={{ position: "absolute", left: y.p + "%", top: 0, fontSize: 11, fontWeight: 600, color: "var(--dim)", borderLeft: "1px solid var(--border-strong)", paddingLeft: 6, height: 14, lineHeight: "14px" }}>{y.l}</span>)}
            {months.map((m, i) => <span key={i} className="erp-mono" style={{ position: "absolute", left: m.p + "%", top: 18, fontSize: 9.5, letterSpacing: "0.06em" }}>{m.l}</span>)}
          </div>
        </div>
        {rows.map((r, i) => {
          const a = pos(r.start), b = pos(r.end), c = r.tone ? TONE_COLOR[r.tone] : "var(--accent)";
          return (
            <div key={i} className={onPick ? "erp-go" : undefined} onClick={onPick ? () => onPick(i) : undefined}
              style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 14, alignItems: "center", padding: "7px 8px", margin: "0 -8px", borderRadius: 10, border: "1px solid transparent" }}>
              <span style={{ minWidth: 0, fontSize: 12.5 }}>
                <span style={{ display: "block", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                {r.sub && <span style={{ display: "block", fontSize: 11, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</span>}
              </span>
              <span style={{ position: "relative", height: 22, borderRadius: 6, background: "repeating-linear-gradient(90deg, var(--surface-faint) 0 1px, transparent 1px 8.333%)" }}>
                <span style={{ position: "absolute", left: a + "%", width: Math.max(1.2, b - a) + "%", top: 3, bottom: 3, borderRadius: 6, background: c, opacity: 0.28 }} />
                <span className="erp-hbar" style={{ position: "absolute", left: a + "%", width: Math.max(0.6, ((b - a) * (r.progress ?? 100)) / 100) + "%", top: 3, bottom: 3, borderRadius: 6, background: c }} />
                {r.text && <span style={{ position: "absolute", left: Math.min(b + 0.8, 86) + "%", top: 4, fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap" }}>{r.text}</span>}
                {(r.marks || []).map((m, k) => <span key={k} title={m.label} style={{ position: "absolute", left: pos(m.at) + "%", top: 1, width: 8, height: 8, marginLeft: -4, transform: "rotate(45deg)", background: TONE_COLOR[m.tone || "warn"] }} />)}
                {tp !== null && <span style={{ position: "absolute", left: tp + "%", top: -2, bottom: -2, width: 1.5, background: "var(--ink)", opacity: 0.7 }} />}
              </span>
            </div>);
        })}
      </div>
    </div>
  );
}
export { plain };
