import { Fragment, type CSSProperties } from "react";

/* Generic renderer for the data-driven business modules. Styling uses the existing Pulse tokens. */

const TONE: Record<string, string> = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)" };
const card: CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", padding: "18px 20px", backdropFilter: "blur(20px)" };
const mono: CSSProperties = { fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.14em", color: "var(--faint)", textTransform: "uppercase" };
const btn = (primary?: boolean, disabled?: boolean): CSSProperties => ({
  height: 34, padding: "0 16px", borderRadius: "var(--r-ctl,999px)", fontSize: 12.5, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
  border: primary ? "1px solid var(--accent)" : "1px solid var(--border-strong)", background: primary ? "var(--accent)" : "none", color: primary ? "var(--on-accent)" : "var(--ink)",
});

type Cell = string | { t: string; tone?: string; go?: any[]; run?: () => void; button?: boolean };

export default function Module({ v }: { v: any }) {
  const m = v.mod;
  if (!m) return null;
  const nav = (go: any[]) => m.nav(go[0], go[1], go[2]);
  const cellEl = (c: Cell) => {
    if (typeof c === "string" || typeof c === "number") return String(c);
    if (c.button) return <button onClick={(e) => { e.stopPropagation(); c.run?.(); }} style={{ ...btn(true), height: 28, padding: "0 12px", fontSize: 12 }}>{c.t}</button>;
    if (c.go) return <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(c.go!); }} style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }}>{c.t}</a>;
    if (c.tone) return <span style={{ color: TONE[c.tone] || "var(--ink)", fontWeight: 500 }}>{c.tone === "bad" ? "! " : ""}{c.t}</span>;
    return c.t;
  };
  const block = (b: any, i: number) => {
    switch (b.type) {
      case "cards":
        return <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
          {b.items.map((c: any, k: number) => (
            <div key={k} onClick={c.go ? () => nav(c.go) : undefined} style={{ ...card, cursor: c.go ? "pointer" : "default", boxShadow: "var(--card-shadow,none)" }}>
              <div style={mono}>{c.label}</div>
              <div style={{ marginTop: 10, fontSize: 28, fontWeight: 500, letterSpacing: "-0.8px", color: TONE[c.tone] || "var(--ink)" }}>{c.value}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--dim)", lineHeight: 1.45 }}>{c.hint}</div>
            </div>))}
        </div>;
      case "note":
        return <div key={i} style={{ ...card, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", borderColor: b.tone ? TONE[b.tone] : "var(--border)", fontSize: 13, color: "var(--body)", lineHeight: 1.5 }}>
          <span>{b.text}</span>
          {b.action && <button onClick={b.action.run} style={btn(true)}>{b.action.label}</button>}
        </div>;
      case "chips":
        return <div key={i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ ...mono, marginRight: 4 }}>{b.label}</span>
          {b.options.map((o: any) => { const on = String(o[0]) === String(b.value); return (
            <button key={String(o[0])} onClick={() => b.set(o[0])} aria-pressed={on} style={{ height: 30, padding: "0 13px", borderRadius: "var(--chip-r,999px)", fontSize: 12, cursor: "pointer", border: on ? "1px solid var(--accent)" : "1px solid var(--chip-border)", background: on ? "var(--pill-bg,var(--chip))" : "var(--chip)", color: on ? "var(--pill-ink,var(--ink))" : "var(--dim)" }}>{o[1]}</button>); })}
        </div>;
      case "bars": {
        const max = Math.max(...b.items.map((x: any) => x.value), 1);
        return <div key={i} style={card}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{b.title}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 11 }}>
            {b.items.map((x: any, k: number) => (
              <div key={k} onClick={x.go ? () => nav(x.go) : undefined} style={{ display: "grid", gridTemplateColumns: "170px 1fr 150px", alignItems: "center", gap: 12, cursor: x.go ? "pointer" : "default", fontSize: 12.5 }}>
                <span style={{ color: "var(--dim)" }}>{x.label}</span>
                <span style={{ height: 14, borderRadius: 7, background: "var(--surface-2)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: Math.max(2, x.value / max * 100) + "%", background: "var(--accent)", borderRadius: 7 }} /></span>
                <span style={{ fontFamily: "var(--mono)", textAlign: "right" }}>{x.text}</span>
              </div>))}
          </div>
          {b.note && <div style={{ marginTop: 12, fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}
        </div>;
      }
      case "actions":
        return <div key={i} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{b.items.map((a: any, k: number) => <button key={k} onClick={a.run} disabled={a.disabled} style={btn(a.primary, a.disabled)}>{a.label}</button>)}</div>;
      case "table":
        return <div key={i} style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 500, flex: 1, minWidth: 180 }}>{b.title}</div>
            {b.search && <input value={b.search.value} onChange={(e) => b.search.set(e.target.value)} placeholder="Search" aria-label="Search" style={{ height: 32, width: 190, padding: "0 12px", borderRadius: "var(--r-ctl,999px)", border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 13 }} />}
            {b.csv && <button onClick={b.csv.run} style={btn(true)}>{b.csv.label}</button>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr>{b.cols.map((c: string, k: number) => <th key={k} style={{ ...mono, textAlign: (b.num || []).indexOf(k) > -1 ? "right" : "left", padding: "9px 16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", fontWeight: 500 }}>{c}</th>)}</tr></thead>
              <tbody>
                {b.rows.length === 0 && <tr><td colSpan={b.cols.length} style={{ padding: 18, color: "var(--dim)" }}>{b.empty}</td></tr>}
                {b.rows.map((r: any, k: number) => (
                  <tr key={k} onClick={r.onClick} style={{ cursor: r.onClick ? "pointer" : "default", fontWeight: r.total ? 600 : 400, background: r.total ? "var(--surface-2)" : "none" }}>
                    {r.cells.map((c: Cell, j: number) => <td key={j} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", textAlign: (b.num || []).indexOf(j) > -1 ? "right" : "left", fontFamily: (b.num || []).indexOf(j) > -1 ? "var(--mono)" : "inherit", color: j === 0 ? "var(--ink)" : "var(--body)", verticalAlign: "top" }}>{cellEl(c)}</td>)}
                  </tr>))}
              </tbody>
            </table>
          </div>
          {(b.note || b.pager) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", fontSize: 12, color: "var(--faint)" }}>
            <span>{b.note || ""}</span>
            {b.pager && b.pager.pages > 1 && <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={b.pager.prev} disabled={b.pager.page === 0} style={{ ...btn(false, b.pager.page === 0), height: 28 }}>Prev</button>
              <span>Page {b.pager.page + 1} of {b.pager.pages} ({b.pager.total} rows)</span>
              <button onClick={b.pager.next} disabled={b.pager.page >= b.pager.pages - 1} style={{ ...btn(false, b.pager.page >= b.pager.pages - 1), height: 28 }}>Next</button>
            </span>}
          </div>}
        </div>;
      case "detail":
        return <div key={i} style={{ ...card, borderColor: "var(--accent-line,var(--border-strong))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{b.title}</div>
            {!b.noClose && <button onClick={b.close} aria-label="Close detail" style={{ ...btn(), height: 28, padding: "0 12px" }}>Close</button>}
          </div>
          <dl style={{ margin: "14px 0 0", display: "grid", gridTemplateColumns: "minmax(150px,230px) 1fr", gap: "9px 18px", fontSize: 13 }}>
            {b.fields.map((f: any, k: number) => <Fragment key={k}><dt style={{ color: "var(--dim)" }}>{f[0]}</dt><dd style={{ margin: 0, color: "var(--ink)", lineHeight: 1.5 }}>{String(f[1])}</dd></Fragment>)}
          </dl>
          {b.preview && <pre style={{ margin: "14px 0 0", padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px dashed var(--border-strong)", whiteSpace: "pre-wrap", fontFamily: "var(--mono)", fontSize: 12, color: "var(--body)" }}>{b.preview}</pre>}
          {b.note && <div style={{ marginTop: 10, fontSize: 12, color: "var(--faint)" }}>{b.note}</div>}
          {b.actions.length > 0 && <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>{b.actions.map((a: any, k: number) => <button key={k} onClick={a.run} disabled={a.disabled} style={btn(a.primary, a.disabled)}>{a.label}</button>)}</div>}
        </div>;
      case "form":
        return <div key={i} style={card}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{b.title}</div>
          <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {b.fields.map((f: any, k: number) => <label key={k} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--dim)" }}>{f[0]}
              <input defaultValue={f[1]} style={{ height: b.big ? 52 : 38, padding: "0 12px", fontSize: b.big ? 17 : 14, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)" }} /></label>)}
          </div>
          <button onClick={b.submit.run} style={{ ...btn(true), marginTop: 14, height: b.big ? 52 : 36, width: b.big ? "100%" : "auto", fontSize: b.big ? 16 : 13 }}>{b.submit.label}</button>
        </div>;
      case "taxinvoice":
        return <div key={i} style={card}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{b.title}</div>
          <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>{b.note}</div>
          <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr>{["Line","Net","Tax code (editable)","Tax"].map(c => <th key={c} style={{ ...mono, textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>{c}</th>)}</tr></thead>
            <tbody>{b.lines.map((l: any, k: number) => <tr key={k}><td style={{ padding: "9px 10px" }}>{l.desc}</td><td style={{ padding: "9px 10px", fontFamily: "var(--mono)" }}>{l.net}</td>
              <td style={{ padding: "9px 10px" }}><select value={l.code} onChange={(e) => l.pick(e.target.value)} aria-label={"Tax code for " + l.desc} style={{ height: 30, borderRadius: 8, background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border-strong)", padding: "0 8px" }}>{b.codes.map((c: any) => <option key={c.k} value={c.k}>{c.k}: {c.label} ({c.rate}%)</option>)}</select></td>
              <td style={{ padding: "9px 10px", fontFamily: "var(--mono)" }}>{l.vat}</td></tr>)}</tbody>
          </table>
          <div style={{ ...mono, marginTop: 14 }}>Tax summary</div>
          {b.summary.map((s: any, k: number) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}><span>{s[0]}</span><span style={{ fontFamily: "var(--mono)" }}>net {s[1]}, tax {s[2]}</span></div>)}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 6 }}><span>Total</span><span style={{ fontFamily: "var(--mono)" }}>net {b.total[0]}, tax {b.total[1]}, gross {b.total[2]}</span></div>
        </div>;
      default:
        return null;
    }
  };
  return (
    <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", boxSizing: "border-box", padding: "22px 32px 48px", animation: "pageIn .7s var(--ease) both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", padding: "14px 0 20px" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={mono}>{m.page.toUpperCase()}</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 500, letterSpacing: "-1.5px", lineHeight: 1 }}>{m.title}</h1>
          <p style={{ margin: "12px 0 0", maxWidth: 640, fontSize: 14, color: "var(--dim)", lineHeight: 1.55 }}>{m.blurb}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span style={{ ...mono, padding: "6px 12px", border: "1px solid var(--accent-line,var(--border-strong))", borderRadius: 999, color: "var(--ink)" }}>Demo data · Snapshot 1 Oct 2026</span>
          <button onClick={m.reset} style={btn()}>Reset demo</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{m.blocks.map(block)}</div>
    </div>
  );
}
