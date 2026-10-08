/* Shared helpers for the ERP page builders. Builders return plain "block" objects that
   src/views/pages/Module.tsx renders. Nothing here touches React.

   BLOCK TYPES (see Module.tsx for how each is drawn)
     kpis      {items:[{label, value, hint, delta?, spark?, tone?, go?}], cols?:number (fixed columns, use 4 for 8 tiles, 3 for 6, 4 for 4), min?}
     section   {title, sub?, action?:{label, go}}
     grid      {cols:"2fr 1fr", items:[block...]}
     chart     {kind:"column"|"stacked"|"line"|"area"|"donut"|"hbar"|"rings", title, sub?, labels?, series?, items?, fmt?, h?, go?:[go per label], target?, yMax?, note?, action?}
     gantt     {title, rows:[{label, sub, start, end, progress, tone, text, go}], from, to, today}
     board     {title, cols:[{title, total, cards:[{id, title, sub, value, meta, tag:{t,tone}, go}]}]}
     list      {title, items:[{title, sub, right, pill:{t,tone}, tone, go}], empty, action}
     progress  {title, items:[{label, value:0-100, text, tone, go}]}
     chips     {label, options, value, set}
     table     (made by kit.tbl)
     detail    (made by kit.detail; shows as a right-hand drawer)
     note, actions, form, taxinvoice
   A "go" is [page, section, recordId?, uiPatch?]: click and the app opens that page, optionally with a record
   selected and filters preset (for example ["Finance","invoices",null,{invFilter:"overdue"}]). */

export const sumBy = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
export const tone = (t, x) => ({t:String(t), tone:x});
export const pill = (t, p) => ({t:String(t), pill:p});
export const L = (t, page, sec, id, patch) => ({t:String(t), go:[page, sec, id || null, patch || null]});
export const G = (page, sec, id, patch) => [page, sec, id || null, patch || null];
export const bar = (t, value, x) => ({t:String(t), bar:value, tone:x});
export const initials = n => String(n).replace(/\(.*\)/, "").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
export const person = n => ({t:n, avatar:initials(n)});

/* status word -> pill tone. ok and info are both the brand blue; warn amber; bad red. */
export const ST = {overdue:"bad", unpaid:"warn", paid:"ok", missing:"bad", entered:"warn", approved:"ok", failed:"bad", reviewed:"ok", submitted:"info", scheduled:"", unavailable:"bad", available:"ok", allocated:"info",
  pending:"warn", rejected:"bad", draft:"warn", ordered:"info", received:"ok", "part received":"warn", incomplete:"warn", ready:"info", attached:"warn", high:"bad", medium:"warn", low:"",
  sent:"info", negotiation:"warn", won:"ok", lost:"bad", dispatched:"info", enquiry:"", tender:"info", review:"warn", awarded:"ok", open:"warn", closed:"ok", investigating:"warn",
  expiring:"warn", expired:"bad", valid:"ok", "waiting assessment":"", "awaiting parts":"warn", "in progress":"info", "ready for review":"ok", matched:"ok", posted:"ok", committed:"info", estimate:"",
  live:"ok", "not ready":""};
export const badge = s => pill(s, ST[s] || "");

export const eurC = n => { const a = Math.abs(n), s = n < 0 ? "-" : ""; if (a >= 1e6) return s + "€" + (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + "m"; if (a >= 1e3) return s + "€" + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "k"; return s + "€" + Math.round(a); };
export const plainNum = n => String(Math.round(n * 10) / 10);

/* sortable value of a cell: dates, money, percent become numbers, the rest lowercase text */
export function numKey(c){
  if (c && typeof c === "object") return c.v !== undefined ? c.v : numKey(c.t);
  const s = String(c);
  if (/^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(s)) return Date.parse(s + " UTC");
  const m = s.replace(/[€,%\s]/g, "").match(/^-?\d+(\.\d+)?[km]?$/i);
  if (m){ let n = parseFloat(m[0]); if (/k$/i.test(m[0])) n *= 1e3; if (/m$/i.test(m[0])) n *= 1e6; return n; }
  return s.toLowerCase();
}

/* change vs previous period: delta(cur, prev, {good:"up"|"down", label:"vs Aug", fmt, abs}) */
export function delta(cur, prev, o){
  o = o || {};
  const d = cur - prev, up = d > 0, flat = Math.abs(d) < 1e-9;
  const p = prev ? Math.abs(d / prev * 100) : 0;
  const txt = (o.abs ? (o.fmt ? o.fmt(Math.abs(d)) : plainNum(Math.abs(d))) : p.toFixed(1) + "%") + (o.label ? " " + o.label : "");
  const goodDir = o.good || "up";
  return {text:txt, dir:flat ? "flat" : up ? "up" : "down", good:flat ? undefined : (up === (goodDir === "up")) ? true : false};
}

export function makeKit(page, sec, fx, ui, h){
  const U = (k, d) => (ui[k] === undefined ? d : ui[k]);
  const selKey = "sel:" + page + "/" + sec;
  const sel = U(selKey, null);
  const select = id => () => h.ui(selKey, sel === id ? null : id);
  const act = (name, p) => () => h.act(name, p);
  const chips = (label, key, opts, def) => ({type:"chips", label, options:opts, value:U(key, def), set:v => { h.ui(key, v); }});

  const tbl = (key, title, cols, rows, o) => {
    o = o || {};
    let list = rows;
    const q = o.search ? String(U("q:" + key, "")).toLowerCase() : "";
    if (q) list = list.filter(r => r.cells.some(c => String(c && c.t !== undefined ? c.t : c).toLowerCase().indexOf(q) > -1));
    const st = U("sort:" + key, null);
    if (st) list = list.slice().sort((x, y) => { if (x.total || y.total) return x.total ? 1 : -1; const a = numKey(x.cells[st.k]), c = numKey(y.cells[st.k]); return (a < c ? -1 : a > c ? 1 : 0) * st.dir; });
    let pager = null;
    if (o.size){
      const pages = Math.max(1, Math.ceil(list.length / o.size));
      const pg = Math.min(U("pg:" + key, 0), pages - 1);
      pager = {page:pg, pages, total:list.length, prev:() => h.ui("pg:" + key, Math.max(0, pg - 1)), next:() => h.ui("pg:" + key, Math.min(pages - 1, pg + 1))};
      list = list.slice(pg * o.size, pg * o.size + o.size);
    }
    list = list.map(r => r.id !== undefined && r.id === sel ? Object.assign({}, r, {on:true}) : r);
    const sort = o.sort === false ? null : {k:st ? st.k : -1, dir:st ? st.dir : 1, set:k => h.ui("sort:" + key, st && st.k === k ? (st.dir === 1 ? {k, dir:-1} : null) : {k, dir:1})};
    return {type:"table", title, sub:o.sub, cols, rows:list, pager, num:o.num || [], empty:o.empty || "No records match.", sort,
      search:o.search ? {value:U("q:" + key, ""), set:v => { h.ui("q:" + key, v); h.ui("pg:" + key, 0); }} : null, note:o.note, csv:o.csv, count:o.count};
  };
  /* drawer: fields = [[label, value]], extra = {kicker, status:{t,tone}, sub, blocks:[...], links:[{label, go}], preview, note} */
  const detail = (title, fields, actions, extra) => Object.assign({type:"detail", title, fields, actions:actions || [], close:select(sel)}, extra || {});

  const out = (title, blocks, blurb) => ({title, blurb:blurb || "", blocks});
  return {U, sel, select, act, chips, tbl, detail, out, h, fx, page, sec, setU:(k, v) => () => h.ui(k, v)};
}

/* ───────── shared derived models used on more than one page ───────── */
import { CLOCK, daysFrom } from "../fixtures";

export function cashModel(fx){
  const receipts = fx.invoices.filter(i => i.status !== "paid").map((i, k) => { const due = Date.parse(i.due);
    const lag = i.status === "overdue" ? (i.id === "INV-1048" ? 25 : 14 + (k * 7) % 31) : 7;
    const exp = new Date(i.status === "overdue" ? Date.UTC(2026,9,1) + lag * 86400000 : due + lag * 86400000).toISOString().slice(0,10);
    return {id:i.id, due:i.due, exp, amount:i.amount, basis:i.status === "overdue" ? "assumed +" + lag + " days from today" : "due date + 7 days"}; }).sort((a, b) => a.exp.localeCompare(b.exp));
  const pays = fx.payables.map((p, k) => ({amount:p.amount, exp:daysFrom([12,25,38,52,70,85][k % 6])}));
  const bucketOf = d => { const n = Math.round((Date.parse(d) - Date.UTC(2026,9,1)) / 86400000); return n < 0 ? 0 : n <= 30 ? 0 : n <= 60 ? 1 : n <= 90 ? 2 : -1; };
  const buckets = [{label:"0-30 days"},{label:"31-60 days"},{label:"61-90 days"}].map(b => Object.assign(b, {in:0, out:0, scn:310000}));
  receipts.forEach(r => { const i = bucketOf(r.exp); if (i > -1) buckets[i].in += r.amount; });
  pays.forEach(p => { const i = bucketOf(p.exp); if (i > -1) buckets[i].out += p.amount; });
  buckets.forEach(b => { b.net = b.in - b.out - b.scn; });
  return {buckets, receipts};
}

export function approvalRows(fx){
  const po = fx.pos[0], v = fx.variations.find(x => x.id === "VAR-009"), r = fx.reminders["INV-1048"], entered = fx.timesheets.filter(t => t.status === "entered").length;
  const eur = n => "€" + Math.round(n).toLocaleString("en-IE");
  return [
    {title:"Client reminder for INV-1048", state:r === "drafted" ? "pending" : r === "approved" ? "approved" : "not ready", owner:"Niamh Kelly, approver Ronan", effect:"Creates a local Activity event. Nothing is sent and the invoice is not marked paid.", act:"approveReminder", from:"Finance → Invoices", go:G("Finance","invoices","INV-1048")},
    {title:"Purchase order for HF-220 (" + eur(480) + ")", state:!po ? "not ready" : po.state === "draft" ? "pending" : "approved", owner:"Seán Duffy, approver Ronan", effect:"Moves the order to approved. Physical stock does not change until a receipt.", act:"advancePO", from:"Garage → Parts", go:G("Garage","purchasing")},
    {title:"Timesheet review (" + entered + " entered)", state:entered ? "pending" : "not ready", owner:"Liam Joyce, reviewer Ronan", effect:"Approve each entered timesheet in Work → Timesheets to post cost once to PRJ-027.", act:"remindMissing", from:"Work → Timesheets", go:G("Work","timesheets")},
    {title:"VAR-009 draft submission", state:!v.drafted ? "not ready" : v.sent ? "approved" : "pending", owner:"Eoin Burke, reviewer Ronan", effect:"Marks the draft approved (simulated). Variation stays pending; not in contract value.", act:"approveVariationDraft", from:"Projects → Variations", go:G("Projects","variations","VAR-009")},
    {title:"SAFE-031 evidence pack", state:fx.pack.state === "ready" ? "pending" : fx.pack.state === "approved" ? "approved" : "not ready", owner:"Fiona McHale", effect:"Authorised human approval of the reviewed pack.", act:"approvePack", from:"Safety → Packs", go:G("Safety","packs")}
  ];
}

export { CLOCK };
