import { Fragment, createContext, useContext, useEffect, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Donut, Gantt, HBars, Legend, PALETTE, Ring, Sparkline, TONE_COLOR, XYChart, compact, type Fmt } from "./charts";

/* Renderer for the ERP module pages. Pages are described as plain block objects (see src/logic/mod/kit.js);
   this file only draws them. Tone colours: ok / info are the one brand blue, warn amber, bad red. */

type Go = any[];
type Cell = string | number | { t: string | number; tone?: string; pill?: string; go?: Go; run?: () => void; button?: boolean; bar?: number; avatar?: string; sub?: string; v?: number | string };

const panel: CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow,none)" };
const TXT: Record<string, string> = { ok: "var(--ok)", info: "var(--accent)", warn: "var(--warn)", bad: "var(--bad)" };

type Ctx = { nav: (go: Go) => void; render: (b: any, i: number) => ReactNode };
const ModCtx = createContext<Ctx>({ nav: () => {}, render: () => null });

function Pill({ t, tone }: { t: ReactNode; tone?: string }) { return <span className={"erp-pill " + (tone || "")}><i />{t}</span>; }

function CellEl({ c }: { c: Cell }) {
  const { nav } = useContext(ModCtx);
  if (c === null || c === undefined) return <>-</>;
  if (typeof c !== "object") return <>{String(c)}</>;
  const body: ReactNode = c.button
    ? <button className="erp-btn primary sm" onClick={(e) => { e.stopPropagation(); c.run?.(); }}>{c.t}</button>
    : c.pill !== undefined ? <Pill t={c.t} tone={c.pill} />
    : c.go ? <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(c.go!); }}>{c.t}</a>
    : c.avatar ? <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flex: "none" }}>{c.avatar}</span>{c.t}</span>
    : c.bar !== undefined ? <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 110, justifyContent: "flex-end" }}>
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--track)", minWidth: 54, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: Math.max(2, Math.min(100, c.bar)) + "%", borderRadius: 3, background: c.tone ? TONE_COLOR[c.tone] : "var(--accent)" }} /></span>
        <span style={{ minWidth: 36, textAlign: "right" }}>{c.t}</span></span>
    : c.tone ? <span style={{ color: TXT[c.tone] || "var(--ink)", fontWeight: 500 }}>{c.t}</span>
    : <>{String(c.t)}</>;
  return c.sub ? <span style={{ display: "inline-block" }}>{body}<span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 1 }}>{c.sub}</span></span> : <>{body}</>;
}

function Panel({ title, sub, action, children, pad = true, style, right }: { title?: ReactNode; sub?: ReactNode; action?: { label: string; go: Go }; children: ReactNode; pad?: boolean; style?: CSSProperties; right?: ReactNode }) {
  const { nav } = useContext(ModCtx);
  return (
    <div style={{ ...panel, padding: pad ? "18px 20px" : 0, overflow: pad ? "visible" : "hidden", minWidth: 0, ...style }}>
      {(title || action || right) && <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: pad ? 14 : 0, padding: pad ? 0 : "16px 20px 12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.1px" }}>{title}</div>{sub && <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}</div>
        {right}
        {action && <a href="#" onClick={(e) => { e.preventDefault(); nav(action.go); }} style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{action.label} ›</a>}
      </div>}
      {children}
    </div>
  );
}

function Delta({ d }: { d: any }) {
  const col = d.good === false ? "var(--bad)" : d.dir === "flat" ? "var(--dim)" : d.good ? "var(--ok)" : "var(--dim)";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 500, color: col, background: d.good === false ? "var(--bad-soft)" : d.good ? "var(--ok-soft)" : "var(--track)", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{d.dir === "up" ? "▲" : d.dir === "down" ? "▼" : "▬"} {d.text}</span>;
}

function Table({ b }: { b: any }) {
  const numCols: number[] = b.num || [];
  const sort = b.sort;
  return (
    <Panel title={b.title} sub={b.sub} pad={false} right={<span style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {b.search && <input value={b.search.value} onChange={(e) => b.search.set(e.target.value)} placeholder="Search" aria-label="Search" style={{ height: 32, width: 190, padding: "0 14px", borderRadius: "var(--r-ctl,999px)", border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 13 }} />}
      {b.csv && <button className="erp-btn sm" onClick={b.csv.run}>{b.csv.label}</button>}</span>}>
      <div style={{ overflowX: "auto" }}>
        <table className="erp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr>{b.cols.map((c: string, k: number) => (
            <th key={k} className={"erp-mono" + (sort ? " erp-sort" : "")} onClick={sort ? () => sort.set(k) : undefined} aria-sort={sort && sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
              style={{ textAlign: numCols.indexOf(k) > -1 ? "right" : "left", padding: "9px 16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", fontWeight: 500, fontSize: 10 }}>
              {c}{sort && sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}</th>))}</tr></thead>
          <tbody>
            {b.rows.length === 0 && <tr><td colSpan={b.cols.length} style={{ padding: 22, color: "var(--dim)", textAlign: "center" }}>{b.empty}</td></tr>}
            {b.rows.map((r: any, k: number) => (
              <tr key={k} className={"erp-row" + (r.onClick ? " erp-click" : "") + (r.on ? " erp-on" : "")} onClick={r.onClick} style={{ fontWeight: r.total ? 600 : 400, background: r.total ? "var(--surface-2)" : undefined }}>
                {r.cells.map((c: Cell, j: number) => <td key={j} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", textAlign: numCols.indexOf(j) > -1 ? "right" : "left", fontVariantNumeric: "tabular-nums", color: j === 0 ? "var(--ink)" : "var(--body)", verticalAlign: "middle" }}><CellEl c={c} /></td>)}
              </tr>))}
          </tbody>
        </table>
      </div>
      {(b.note || b.pager) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 20px", fontSize: 12, color: "var(--faint)", flexWrap: "wrap" }}>
        <span>{b.note || ""}</span>
        {b.pager && b.pager.pages > 1 && <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="erp-btn sm" onClick={b.pager.prev} disabled={b.pager.page === 0}>Prev</button>
          <span>Page {b.pager.page + 1} of {b.pager.pages} ({b.pager.total} rows)</span>
          <button className="erp-btn sm" onClick={b.pager.next} disabled={b.pager.page >= b.pager.pages - 1}>Next</button></span>}
      </div>}
    </Panel>
  );
}

function Drawer({ b }: { b: any }) {
  const { nav, render } = useContext(ModCtx);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") b.close(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [b.close]);
  /* Portal to the themed root: the page wrapper animates with a filter, which would trap position:fixed. */
  const host = document.querySelector("[data-theme]") || document.body;
  return createPortal(
    <>
      <div className="erp-scrim" onClick={b.close} />
      <aside className="erp-drawer" role="dialog" aria-label={b.title}>
        <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {b.kicker && <div className="erp-mono" style={{ marginBottom: 6 }}>{b.kicker}</div>}
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.25 }}>{b.title}</div>
            {(b.status || b.sub) && <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{b.status && <Pill t={b.status.t} tone={b.status.tone} />}{b.sub && <span style={{ fontSize: 12.5, color: "var(--dim)" }}>{b.sub}</span>}</div>}
          </div>
          <button className="erp-btn sm" onClick={b.close} aria-label="Close detail">Close</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {(b.blocks || []).map((x: any, i: number) => <div key={"p" + i} style={{ flex: "none" }}>{render(x, i)}</div>)}
          <dl style={{ margin: 0, flex: "none", display: "grid", gridTemplateColumns: "minmax(120px,170px) 1fr", gap: "11px 16px", fontSize: 13 }}>
            {b.fields.map((f: any, k: number) => <Fragment key={k}><dt style={{ color: "var(--dim)" }}>{f[0]}</dt><dd style={{ margin: 0, color: "var(--ink)", lineHeight: 1.5 }}>{String(f[1])}</dd></Fragment>)}
          </dl>
          {b.preview && <pre style={{ margin: 0, padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px dashed var(--border-strong)", whiteSpace: "pre-wrap", fontFamily: "var(--mono)", fontSize: 12, color: "var(--body)" }}>{b.preview}</pre>}
          {b.links && b.links.length > 0 && <div><div className="erp-mono" style={{ marginBottom: 8 }}>Related</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{b.links.map((l: any, i: number) => <button key={i} className="erp-chip" onClick={() => nav(l.go)}>{l.label} ›</button>)}</div></div>}
          {b.note && <div style={{ fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}
        </div>
        {b.actions && b.actions.length > 0 && <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>{b.actions.map((a: any, k: number) => <button key={k} className={"erp-btn" + (a.primary ? " primary" : "")} onClick={a.run} disabled={a.disabled}>{a.label}</button>)}</div>}
      </aside>
    </>,
    host
  );
}

export default function Module({ v }: { v: any }) {
  const m = v.mod;
  if (!m) return null;
  const nav = (go: Go) => m.nav(go[0], go[1], go[2], go[3]);
  const clk = (go?: Go, extra?: CSSProperties) => go ? ({ className: "erp-go", role: "button" as const, tabIndex: 0, onClick: () => nav(go), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(go); } }, style: extra }) : ({ style: extra });

  const block = (b: any, i: number): ReactNode => {
    switch (b.type) {
      case "kpis":
      case "cards":
        return <div key={i} className={!b.min ? "erp-kpis" : undefined} style={{ display: "grid", gridTemplateColumns: b.min ? "repeat(auto-fit,minmax(" + b.min + "px,1fr))" : undefined, gap: 14, ...(!b.min ? { ["--n" as string]: b.cols || (b.items.length <= 5 ? b.items.length : b.items.length === 6 ? 3 : 4) } : {}) }}>
          {b.items.map((c: any, k: number) => (
            <div key={k} {...clk(c.go, { ...panel, padding: "16px 18px 14px", position: "relative", display: "flex", flexDirection: "column", gap: 4, minHeight: 112, animation: "fadeUp .4s var(--ease) both", animationDelay: k * 40 + "ms" })} aria-label={c.go ? c.label + ", open" : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <span className="erp-mono" style={{ lineHeight: 1.35 }}>{c.label}</span>
                {c.delta && <Delta d={c.delta} />}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-1px", lineHeight: 1.1, color: c.tone ? TXT[c.tone] : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                {c.spark && <Sparkline data={c.spark} color={c.tone === "bad" ? "var(--bad)" : c.tone === "warn" ? "var(--warn)" : "var(--accent)"} />}
              </div>
              <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.45, paddingRight: c.go ? 16 : 0 }}>{c.hint}</div>
              {c.go && <span className="erp-arrow" style={{ position: "absolute", right: 14, bottom: 12, color: "var(--accent)", fontSize: 16 }}>›</span>}
            </div>))}
        </div>;
      case "section":
        return <div key={i} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginTop: 10, paddingBottom: 2 }}>
          <div><div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>{b.title}</div>{b.sub && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}>{b.sub}</div>}</div>
          {b.action && <a href="#" onClick={(e) => { e.preventDefault(); nav(b.action.go); }} style={{ fontSize: 12.5 }}>{b.action.label} ›</a>}
        </div>;
      case "grid":
        return <div key={i} className="erp-grid" style={{ display: "grid", gridTemplateColumns: b.cols || "1fr 1fr", gap: 14, alignItems: b.align || "stretch" }}>{b.items.map((x: any, k: number) => <Fragment key={k}>{block(x, k)}</Fragment>)}</div>;
      case "note":
        return <div key={i} style={{ ...panel, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", borderColor: b.tone && TXT[b.tone] ? TXT[b.tone] : "var(--border)", background: b.tone === "bad" ? "var(--bad-soft)" : b.tone === "warn" ? "var(--warn-soft)" : "var(--surface)", fontSize: 13, color: "var(--body)", lineHeight: 1.5 }}>
          <span style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flex: "none", background: b.tone ? TONE_COLOR[b.tone] : "var(--accent)" }} />{b.text}</span>
          {b.action && <button className="erp-btn primary sm" onClick={b.action.run}>{b.action.label}</button>}
        </div>;
      case "chips":
        return <div key={i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span className="erp-mono" style={{ marginRight: 4 }}>{b.label}</span>
          {b.options.map((o: any) => <button key={String(o[0])} className="erp-chip" onClick={() => b.set(o[0])} aria-pressed={String(o[0]) === String(b.value)}>{o[1]}</button>)}
        </div>;
      case "chart": {
        const fmt: Fmt = b.fmt || compact;
        const series = b.series || [];
        const pick = b.go ? (k: number) => b.go[k] && nav(b.go[k]) : undefined;
        const itemPick = b.items && b.items.some((x: any) => x.go) ? (k: number) => b.items[k].go && nav(b.items[k].go) : undefined;
        let body: ReactNode;
        if (b.kind === "donut") body = <Donut items={b.items} center={b.center} fmt={fmt} onPick={itemPick} size={b.size} />;
        else if (b.kind === "hbar") body = <HBars items={b.items} fmt={fmt} onPick={itemPick} max={b.max} />;
        else if (b.kind === "rings") body = <div style={{ display: "grid", gridTemplateColumns: "repeat(" + b.items.length + ",minmax(0,1fr))", gap: 10, justifyItems: "center" }}>{b.items.map((r: any, k: number) => (
          <div key={k} {...clk(r.go, { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 10, borderRadius: 14, border: "1px solid transparent" })}><Ring value={r.value} label={r.text} sub={r.sub} tone={r.tone} size={b.size || (b.items.length >= 3 ? 88 : 112)} /><span style={{ fontSize: 12.5, color: "var(--body)" }}>{r.label}</span></div>))}</div>;
        else body = <>
          {series.length > 1 && <div style={{ marginBottom: 10 }}><Legend items={series.map((s: any, k: number) => ({ name: s.name, color: s.color || PALETTE[k % PALETTE.length] }))} /></div>}
          <XYChart labels={b.labels} series={series.map((s: any) => b.kind === "line" || b.kind === "area" ? { ...s, kind: "line" } : s)} stacked={b.kind === "stacked"} area={b.kind === "area"} h={b.h || 240} fmt={fmt} target={b.target} targetLabel={b.targetLabel} onPick={pick} max={b.yMax} />
        </>;
        return <Panel key={i} title={b.title} sub={b.sub} action={b.action} right={b.right}>{body}{b.note && <div style={{ marginTop: 12, fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}</Panel>;
      }
      case "gantt":
        return <Panel key={i} title={b.title} sub={b.sub} action={b.action}><Gantt rows={b.rows} from={b.from} to={b.to} today={b.today} onPick={b.rows.some((r: any) => r.go) ? (k) => b.rows[k].go && nav(b.rows[k].go) : undefined} />{b.note && <div style={{ marginTop: 12, fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}</Panel>;
      case "board":
        return <Panel key={i} title={b.title} sub={b.sub} action={b.action}>
          <div className="erp-board" style={{ gridAutoColumns: "minmax(" + (b.min || 215) + "px,1fr)" }}>
            {b.cols.map((c: any, k: number) => (
              <div key={k} className="erp-lane">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 4px 4px" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>{c.title} <span style={{ color: "var(--faint)", fontWeight: 400 }}>{c.cards.length}</span></span>
                  {c.total && <span style={{ fontSize: 12, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{c.total}</span>}
                </div>
                {c.cards.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: 8 }}>{b.empty || "Nothing here."}</div>}
                {c.cards.map((t: any, j: number) => (
                  <div key={j} {...clk(t.go, undefined)} className={"erp-ticket" + (t.go ? " erp-go" : "")}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span className="erp-mono" style={{ fontSize: 10 }}>{t.id}</span>{t.tag && <Pill t={t.tag.t} tone={t.tag.tone} />}</div>
                    <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{t.title}</div>
                    {t.sub && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{t.sub}</div>}
                    {(t.value || t.meta) && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--dim)" }}><span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{t.value}</span><span>{t.meta}</span></div>}
                  </div>))}
              </div>))}
          </div>
        </Panel>;
      case "list":
        return <Panel key={i} title={b.title} sub={b.sub} action={b.action} pad={false} style={{ overflow: "hidden" }}>
          {b.items.length === 0 && <div style={{ padding: "6px 20px 20px", color: "var(--dim)", fontSize: 13 }}>{b.empty || "Nothing to show."}</div>}
          {b.items.map((it: any, k: number) => (
            <div key={k} {...clk(it.go, { display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderTop: "1px solid var(--border)", borderRadius: 0, background: "none" })}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: it.tone ? TONE_COLOR[it.tone] : "var(--neutral)" }} />
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                {it.sub && <span style={{ display: "block", fontSize: 11.5, color: "var(--faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.sub}</span>}</span>
              {it.pill && <Pill t={it.pill.t} tone={it.pill.tone} />}
              {it.right && <span style={{ fontSize: 12.5, color: "var(--dim)", fontVariantNumeric: "tabular-nums", minWidth: 60, textAlign: "right" }}>{it.right}</span>}
              {it.go && <span className="erp-arrow" style={{ color: "var(--accent)" }}>›</span>}
            </div>))}
        </Panel>;
      case "progress":
        return <Panel key={i} title={b.title} sub={b.sub} action={b.action}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{b.items.map((p: any, k: number) => (
            <div key={k} {...clk(p.go, { display: "grid", gridTemplateColumns: "minmax(100px,170px) 1fr auto", gap: 14, alignItems: "center", fontSize: 12.5, padding: "7px 10px", margin: "0 -10px", borderRadius: 10, border: "1px solid transparent" })}>
              <span style={{ color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</span>
              <span style={{ height: 8, borderRadius: 4, background: "var(--track)", overflow: "hidden" }}><span className="erp-hbar" style={{ display: "block", height: "100%", width: Math.max(1.5, Math.min(100, p.value)) + "%", borderRadius: 4, background: p.tone ? TONE_COLOR[p.tone] : "var(--accent)" }} /></span>
              <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 70, textAlign: "right" }}>{p.text}</span>
            </div>))}</div>
        </Panel>;
      case "actions":
        return <div key={i} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{b.items.map((a: any, k: number) => <button key={k} className={"erp-btn" + (a.primary ? " primary" : "")} onClick={a.run} disabled={a.disabled}>{a.label}</button>)}</div>;
      case "table":
        return <Table key={i} b={b} />;
      case "detail":
        if (!b.noClose) return <Drawer key={i} b={b} />;
        return <Panel key={i} title={b.title} sub={b.sub}>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(150px,230px) 1fr", gap: "9px 18px", fontSize: 13 }}>
            {b.fields.map((f: any, k: number) => <Fragment key={k}><dt style={{ color: "var(--dim)" }}>{f[0]}</dt><dd style={{ margin: 0, color: "var(--ink)", lineHeight: 1.5 }}>{String(f[1])}</dd></Fragment>)}
          </dl>
          {b.preview && <pre style={{ margin: "14px 0 0", padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px dashed var(--border-strong)", whiteSpace: "pre-wrap", fontFamily: "var(--mono)", fontSize: 12, color: "var(--body)" }}>{b.preview}</pre>}
          {b.note && <div style={{ marginTop: 10, fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}
          {b.actions && b.actions.length > 0 && <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>{b.actions.map((a: any, k: number) => <button key={k} className={"erp-btn" + (a.primary ? " primary" : "")} onClick={a.run} disabled={a.disabled}>{a.label}</button>)}</div>}
        </Panel>;
      case "form":
        return <Panel key={i} title={b.title}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {b.fields.map((f: any, k: number) => <label key={k} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--dim)" }}>{f[0]}
              <input defaultValue={f[1]} style={{ height: b.big ? 52 : 38, padding: "0 12px", fontSize: b.big ? 17 : 14, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)" }} /></label>)}
          </div>
          <button className="erp-btn primary" onClick={b.submit.run} style={{ marginTop: 14, height: b.big ? 52 : 36, width: b.big ? "100%" : "auto", fontSize: b.big ? 16 : 13 }}>{b.submit.label}</button>
        </Panel>;
      case "taxinvoice":
        return <Panel key={i} title={b.title} sub={b.note}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr>{["Line", "Net", "Tax code (editable)", "Tax"].map((c) => <th key={c} className="erp-mono" style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>{c}</th>)}</tr></thead>
            <tbody>{b.lines.map((l: any, k: number) => <tr key={k}><td style={{ padding: "9px 10px" }}>{l.desc}</td><td style={{ padding: "9px 10px" }}>{l.net}</td>
              <td style={{ padding: "9px 10px" }}><select value={l.code} onChange={(e) => l.pick(e.target.value)} aria-label={"Tax code for " + l.desc} style={{ height: 30, borderRadius: 8, background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border-strong)", padding: "0 8px" }}>{b.codes.map((c: any) => <option key={c.k} value={c.k}>{c.k}: {c.label} ({c.rate}%)</option>)}</select></td>
              <td style={{ padding: "9px 10px" }}>{l.vat}</td></tr>)}</tbody>
          </table>
          <div className="erp-mono" style={{ marginTop: 14 }}>Tax summary</div>
          {b.summary.map((s: any, k: number) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}><span>{s[0]}</span><span>net {s[1]}, tax {s[2]}</span></div>)}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 6 }}><span>Total</span><span>net {b.total[0]}, tax {b.total[1]}, gross {b.total[2]}</span></div>
        </Panel>;
      default:
        return null;
    }
  };

  return (
    <ModCtx.Provider value={{ nav, render: block }}>
    <div className="erp" style={{ width: "100%", maxWidth: 1360, margin: "0 auto", boxSizing: "border-box", padding: "22px 32px 56px", animation: "pageIn .6s var(--ease) both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", padding: "10px 0 22px" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="erp-crumb">
            {m.back && <><a href="#" onClick={(e) => { e.preventDefault(); m.nav(m.back.page, m.back.sec); }}>‹ Back to {m.back.label}</a><span style={{ color: "var(--faint)" }}>/</span></>}
            <span>{m.page}</span><span style={{ color: "var(--faint)" }}>›</span><span style={{ color: "var(--ink)" }}>{m.title}</span>
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 34, fontWeight: 600, letterSpacing: "-1.2px", lineHeight: 1.05 }}>{m.title}</h1>
          <p style={{ margin: "10px 0 0", maxWidth: 680, fontSize: 13.5, color: "var(--dim)", lineHeight: 1.55 }}>{m.blurb}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="erp-mono" style={{ padding: "7px 13px", border: "1px solid var(--accent-line)", borderRadius: 999, color: "var(--ink)", whiteSpace: "nowrap" }}>Demo data · Snapshot 1 Oct 2026</span>
          <button className="erp-btn" onClick={m.reset}>Reset demo</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{m.blocks.map((b: any, i: number) => block(b, i))}</div>
    </div>
    </ModCtx.Provider>
  );
}
