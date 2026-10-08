/* Records: client accounts, supplier accounts and the demo workforce. Each row opens an account drawer with the records behind it. */
import { eur, pct, fmtDate, quoteStats, shortName, CLIENTS, SUPPLIERS, partAvail } from "../fixtures";
import { sumBy, pill, L, G, bar, badge, eurC, person, ST } from "./kit";

const R = "Records";
const pc0 = v => Math.round(v) + "%";
const OPEN_Q = ["draft", "sent", "negotiation"];
const usedTone = p => p > 85 ? "bad" : p > 60 ? "warn" : undefined;

/* ───────── client timeline (ported from the original page, with quotes and paid history added) ───────── */
function timeline(fx, name){
  const rows = [];
  fx.contracts.filter(c => shortName(c.client) === name).forEach(c => rows.push({d:c.start, when:fmtDate(c.start), text:"Contract started", ref:c.id + " " + c.name.replace(" (demo project)", ""), go:G("Projects", "contracts", c.id)}));
  fx.opportunities.filter(o => shortName(o.client) === name).forEach(o => {
    rows.push({d:"2026-09-15", when:"Sep 2026", text:"Opportunity: " + o.name, ref:o.id});
    rows.push({d:"9999", when:"Next", text:o.next, ref:o.owner});
    if (o.note) rows.push({d:"2026-09-16", when:"Sep 2026", text:o.note, ref:"MN-0912, server documents"});
  });
  fx.invoices.filter(i => shortName(i.client) === name && i.status === "overdue").slice(0, 2).forEach(i => rows.push({d:i.due, when:fmtDate(i.due), text:"Invoice overdue " + eur(i.amount), ref:i.id, go:G("Finance", "invoices", i.id)}));
  fx.quotes.filter(q => shortName(q.client) === name && q.issued).forEach(q => rows.push({d:q.issued, when:fmtDate(q.issued), text:"Quote " + q.id + " issued: " + q.title + ", " + eur(q.value), ref:q.status, go:G("Projects", "quotes", q.id)}));
  return rows.sort((a, b) => b.d.localeCompare(a.d));
}

export function buildRecords(k){
  const { fx, sec, tbl, out, detail, select, sel, U, chips, act, h } = k;
  const qs = quoteStats(fx);

  /* ───────── Clients ───────── */
  if (sec === "clients"){
    const known = new Set(CLIENTS.map(c => c.name));
    const extra = [...new Set(fx.contracts.map(c => shortName(c.client)).concat(fx.invoices.map(i => shortName(i.client)), fx.quotes.map(q => shortName(q.client)), fx.opportunities.map(o => shortName(o.client))))].filter(n => !known.has(n))
      .map(n => ({name:n, sector:"Not recorded", terms:30, limit:100000, contact:"Not recorded", since:2026, rating:"B", pay:30}));
    const info = CLIENTS.concat(extra).map(c => {
      const contracts = fx.contracts.filter(x => shortName(x.client) === c.name), invs = fx.invoices.filter(i => shortName(i.client) === c.name);
      const unpaid = invs.filter(i => i.status !== "paid"), over = invs.filter(i => i.status === "overdue");
      const quotes = fx.quotes.filter(q => shortName(q.client) === c.name), openQ = quotes.filter(q => OPEN_Q.indexOf(q.status) > -1);
      const opps = fx.opportunities.filter(o => shortName(o.client) === c.name);
      const outstanding = sumBy(unpaid, i => i.amount);
      return {c, contracts, invs, unpaid, over, quotes, openQ, opps, book:sumBy(contracts, x => x.value), outstanding, overAmt:sumBy(over, i => i.amount), openVal:sumBy(openQ, q => q.value), used:c.limit ? outstanding / c.limit * 100 : 0};
    });
    const totOut = sumBy(info, x => x.outstanding), totOver = sumBy(info, x => x.overAmt), totBook = sumBy(info, x => x.book), totLimit = sumBy(info, x => x.c.limit);
    const avgPay = info.reduce((a, x) => a + x.c.pay, 0) / info.length, avgTerms = info.reduce((a, x) => a + x.c.terms, 0) / info.length;
    const toClient = n => G(R, "clients", n);
    const blocks = [
      {type:"kpis", min:190, items:[
        {label:"Clients", value:String(info.length), hint:info.filter(x => x.contracts.length).length + " with live contracts", go:G(R, "clients")},
        {label:"Order book", value:eurC(totBook), hint:fx.contracts.length + " live contracts", go:G("Projects", "contracts")},
        {label:"Outstanding", value:eur(totOut), hint:info.filter(x => x.outstanding).length + " clients owe money", go:G("Finance", "invoices", null, {invFilter:"all", invClient:"all"})},
        {label:"Overdue", value:eur(totOver), tone:totOver ? "bad" : undefined, hint:pct(totOut ? totOver / totOut * 100 : 0) + " of outstanding", go:G("Finance", "invoices", null, {invFilter:"overdue", invClient:"all"})},
        {label:"Average days to pay", value:Math.round(avgPay) + " days", tone:avgPay > avgTerms ? "warn" : undefined, hint:"against " + Math.round(avgTerms) + " days average terms", go:G("Finance", "invoices", null, {invFilter:"paid", invClient:"all"})},
        {label:"Credit used", value:pc0(totLimit ? totOut / totLimit * 100 : 0), hint:eur(totOut) + " of " + eurC(totLimit) + " total limits", go:G(R, "clients")},
        {label:"Open quote value", value:eurC(qs.openValue), hint:qs.open.length + " live quotes, weighted " + eurC(qs.weighted), go:G("Projects", "quotes", null, {quoteF:"open"})}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Outstanding by client", sub:"Unpaid invoices against each credit limit. Click a client to open the account.", fmt:eurC,
          items:info.filter(x => x.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).map(x => ({label:x.c.name, value:x.outstanding, text:eurC(x.outstanding), sub:pc0(x.used) + " of " + eurC(x.c.limit) + " limit" + (x.overAmt ? ", " + eurC(x.overAmt) + " overdue" : ""), tone:usedTone(x.used), go:toClient(x.c.name)}))},
        {type:"chart", kind:"donut", title:"Order book by client", sub:"Approved contract value. Click a slice to open the account.", fmt:eurC, center:{value:eurC(totBook), label:"Order book"},
          items:info.filter(x => x.book > 0).sort((a, b) => b.book - a.book).map(x => ({label:x.c.name, value:x.book, text:eurC(x.book), go:toClient(x.c.name)}))}]},
      {type:"grid", cols:"1fr 1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Days to pay against terms", sub:"Marker shows the agreed terms.", max:70, fmt:v => Math.round(v) + " days",
          items:info.slice().sort((a, b) => b.c.pay - a.c.pay).map(x => ({label:x.c.name, value:x.c.pay, text:x.c.pay + " days", sub:"terms " + x.c.terms + " days", tone:x.c.pay > x.c.terms + 10 ? "warn" : undefined, target:x.c.terms, go:toClient(x.c.name)}))},
        {type:"chart", kind:"stacked", title:"Invoices by client", sub:"Value by status. Click a client to open the account.", labels:info.filter(x => x.invs.length).map(x => x.c.name.split(" ")[0]), h:240,
          series:[{name:"Not yet due", data:info.filter(x => x.invs.length).map(x => sumBy(x.invs.filter(i => i.status === "unpaid"), i => i.amount))},
            {name:"Overdue", data:info.filter(x => x.invs.length).map(x => x.overAmt), color:"var(--bad)"},
            {name:"Paid", data:info.filter(x => x.invs.length).map(x => sumBy(x.invs.filter(i => i.status === "paid"), i => i.amount)), color:"var(--ch4)"}],
          go:info.filter(x => x.invs.length).map(x => toClient(x.c.name))},
        {type:"chart", kind:"hbar", title:"Open quotes by client", sub:"Draft, sent and negotiation. Click to open the account.", fmt:eurC,
          items:info.filter(x => x.openVal > 0).sort((a, b) => b.openVal - a.openVal).map(x => ({label:x.c.name, value:x.openVal, text:eurC(x.openVal), sub:x.openQ.length + " quotes", go:toClient(x.c.name)}))}]},
      tbl("cl", "Clients", ["Client","Contracts","Order book","Outstanding","Credit used","Avg days to pay","Rating","Open quotes"],
        info.map(x => ({id:x.c.name, onClick:select(x.c.name), cells:[
          {t:x.c.name, go:toClient(x.c.name), sub:x.c.sector}, String(x.contracts.length), eur(x.book), x.outstanding ? eur(x.outstanding) : "-",
          bar(pc0(x.used), x.used, usedTone(x.used)), x.c.pay + " days", pill(x.c.rating, x.c.rating === "A" ? "ok" : "warn"),
          x.openQ.length ? x.openQ.length + " (" + eurC(x.openVal) + ")" : "-"]})),
        {search:true, num:[1, 2, 3, 5], note:"Demo records. Credit used is unpaid invoices against the credit limit."})
    ];
    const key = sel ? shortName(sel) : null, x = key ? info.find(y => y.c.name === key) : null;
    if (x){
      const c = x.c, tl = timeline(fx, c.name);
      const unpaidFirst = x.invs.slice().sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0) || b.overdueDays - a.overdueDays).slice(0, 8);
      const links = [{label:"Invoices for " + c.name, go:G("Finance", "invoices", null, {invFilter:"all", invClient:c.name})}];
      if (x.over.length) links.push({label:"Overdue invoices", go:G("Finance", "invoices", null, {invFilter:"overdue", invClient:c.name})});
      links.push({label:"Quotes", go:G("Projects", "quotes", null, {quoteF:"all"})}, {label:"Contracts", go:G("Projects", "contracts")}, {label:"Pipeline", go:G("Projects", "pipeline")});
      blocks.push(detail(c.name, [
        ["Sector", c.sector], ["Customer since", c.since], ["Payment terms", c.terms + " days"], ["Credit limit", eur(c.limit)],
        ["Outstanding", eur(x.outstanding) + (x.overAmt ? ", of which " + eur(x.overAmt) + " overdue" : "")],
        ["Average days to pay", c.pay + " days" + (c.pay > c.terms ? " (" + (c.pay - c.terms) + " over terms)" : " (within terms)")],
        ["Rating", c.rating], ["Main contact", c.contact],
        ["Contracts", x.contracts.length ? x.contracts.map(y => y.id).join(", ") : "None live"], ["Order book", eur(x.book)],
        ["Open quotes", x.openQ.length ? x.openQ.length + " worth " + eur(x.openVal) : "None"], ["Opportunities", x.opps.length ? x.opps.map(o => o.id).join(", ") : "None"]],
        [{label:"Open invoices", run:() => h.nav("Finance", "invoices", null, {invFilter:"all", invClient:c.name}), primary:true}],
        {kicker:"Client account", status:{t:"Rating " + c.rating, tone:c.rating === "A" ? "ok" : "warn"}, sub:c.sector, links,
          blocks:[
            {type:"progress", title:"Credit position", items:[{label:"Credit used", value:x.used, text:pc0(x.used) + " of " + eurC(c.limit), tone:usedTone(x.used)}, {label:"Days to pay vs terms", value:c.terms ? Math.min(100, c.pay / (c.terms * 2) * 100) : 0, text:c.pay + " of " + c.terms + " days", tone:c.pay > c.terms ? "warn" : undefined}]},
            {type:"list", title:"Timeline", sub:tl.length + " events", items:tl.slice(0, 8).map(t => ({title:t.text, sub:t.ref, right:t.when, go:t.go})), empty:"No recorded events yet."},
            {type:"list", title:"Contracts", items:x.contracts.map(y => ({title:y.id + " " + y.name.replace(" (demo project)", ""), sub:y.mgr + ", " + y.progress + "% complete", right:eur(y.value), go:G("Projects", "contracts", y.id)})), empty:"No live contracts."},
            {type:"list", title:"Invoices", sub:x.unpaid.length + " unpaid of " + x.invs.length, items:unpaidFirst.map(i => ({title:i.id + " " + eur(i.amount), sub:"due " + fmtDate(i.due) + (i.overdueDays ? ", " + i.overdueDays + " days late" : ""), pill:{t:i.status, tone:ST[i.status]}, go:G("Finance", "invoices", i.id)})), empty:"No invoices."},
            {type:"list", title:"Quotes", items:x.quotes.map(q => ({title:q.id + " " + q.title, sub:"expires " + fmtDate(q.expiry), right:eur(q.value), pill:{t:q.status, tone:ST[q.status]}, go:G("Projects", "quotes", q.id)})), empty:"No quotes."}]}));
    }
    return out("Clients", blocks);
  }

  /* ───────── Suppliers ───────── */
  if (sec === "suppliers"){
    const names = SUPPLIERS.map(s => s.name);
    fx.parts.map(p => shortName(p.supplier)).concat(fx.payables.map(p => shortName(p.supplier)), fx.poHistory.map(p => shortName(p.supplier)), fx.pos.map(p => shortName(p.supplier))).forEach(n => { if (names.indexOf(n) < 0) names.push(n); });
    const meta = n => SUPPLIERS.find(s => s.name === n) || {name:n, category:"Not recorded", terms:30, rating:4, onTime:90};
    const months = ["2026-07", "2026-08", "2026-09", "2026-10"], mLabels = ["Jul", "Aug", "Sep", "Oct"];
    const info = names.map(n => {
      const s = meta(n);
      const pos = fx.poHistory.map(p => ({id:p.id, what:p.what, value:p.value, date:p.date, state:p.state, contract:p.contract, supplier:p.supplier}))
        .concat(fx.pos.map(p => { const part = fx.parts.find(y => y.sku === p.sku); return {id:p.id, what:p.qty + " x " + p.sku + (part ? " " + part.desc : ""), value:p.qty * p.unit, date:"2026-10-01", state:p.state, contract:"-", supplier:p.supplier}; }))
        .filter(p => shortName(p.supplier) === n);
      const pays = fx.payables.filter(p => shortName(p.supplier) === n), parts = fx.parts.filter(p => shortName(p.supplier) === n);
      const open = pos.filter(p => p.state !== "received");
      const poSpend = sumBy(pos, p => p.value), payAmt = sumBy(pays, p => p.amount);
      return {n, s, pos, pays, parts, open, poSpend, payAmt, spend:poSpend + payAmt, exceptions:pays.filter(p => p.match !== "matched").length, low:parts.filter(p => partAvail(p) < p.min),
        monthly:months.map(m => sumBy(pos.filter(p => p.date.slice(0, 7) === m), p => p.value))};
    });
    const totSpend = sumBy(info, x => x.spend), totOpen = sumBy(info, x => x.open.length), openVal = sumBy(info, x => sumBy(x.open, p => p.value));
    const onTimeAvg = info.reduce((a, x) => a + x.s.onTime, 0) / info.length;
    const cats = {}; info.forEach(x => { cats[x.s.category] = (cats[x.s.category] || 0) + x.spend; });
    const lowParts = sumBy(info, x => x.low.length), exc = sumBy(info, x => x.exceptions);
    const toSup = n => G(R, "suppliers", n);
    const ratingTone = r => r >= 4.3 ? "ok" : r >= 4 ? "info" : "warn";
    const blocks = [
      {type:"kpis", min:190, items:[
        {label:"Suppliers", value:String(info.length), hint:Object.keys(cats).length + " categories", go:G(R, "suppliers")},
        {label:"Spend YTD", value:eurC(totSpend), hint:"purchase orders plus open supplier invoices", go:G(R, "suppliers")},
        {label:"Open purchase orders", value:String(totOpen), hint:eur(openVal) + " ordered, not fully received", go:G("Garage", "purchasing")},
        {label:"On-time delivery", value:pc0(onTimeAvg), tone:onTimeAvg < 85 ? "warn" : undefined, hint:"average across suppliers", go:G(R, "suppliers")},
        {label:"Open payables", value:eur(sumBy(info, x => x.payAmt)), hint:fx.payables.length + " supplier invoices", go:G("Finance", "payables")},
        {label:"Matching exceptions", value:String(exc), tone:exc ? "warn" : undefined, hint:"supplier invoices that do not match", go:G("Finance", "payables")},
        {label:"Parts below minimum", value:String(lowParts), tone:lowParts ? "warn" : undefined, hint:"stocked lines at or under minimum", go:G("Garage", "parts", null, {partLow:"low"})}]},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Spend by supplier", sub:"Purchase orders plus open invoices. Click a supplier to open the account.", fmt:eurC,
          items:info.slice().sort((a, b) => b.spend - a.spend).map(x => ({label:x.n, sub:x.s.category, value:x.spend, text:eurC(x.spend), go:toSup(x.n)}))},
        {type:"chart", kind:"donut", title:"Spend by category", sub:"Share of total spend", fmt:eurC, center:{value:eurC(totSpend), label:"Spend"},
          items:Object.keys(cats).sort((a, b) => cats[b] - cats[a]).map(c => ({label:c, value:cats[c], text:eurC(cats[c]), go:toSup(info.find(x => x.s.category === c).n)}))}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"On-time delivery", sub:"Marker shows the 90% target. Click to open the account.", max:100, fmt:pc0,
          items:info.slice().sort((a, b) => a.s.onTime - b.s.onTime).map(x => ({label:x.n, value:x.s.onTime, text:pc0(x.s.onTime), tone:x.s.onTime < 82 ? "bad" : x.s.onTime < 90 ? "warn" : undefined, target:90, go:toSup(x.n)}))},
        {type:"chart", kind:"column", title:"Purchase order value by month", sub:"Orders placed, all suppliers", labels:mLabels, series:[{name:"Order value", data:months.map((m, i) => sumBy(info, x => x.monthly[i]))}], h:230, go:mLabels.map(() => G("Garage", "purchasing"))}]},
      tbl("sup", "Suppliers", ["Supplier","Terms","Rating","On time","Spend YTD","Open POs","Payables","Exceptions"],
        info.map(x => ({id:x.n, onClick:select(x.n), cells:[
          {t:x.n, go:toSup(x.n), sub:x.s.category}, x.s.terms + " days", pill(x.s.rating.toFixed(1), ratingTone(x.s.rating)),
          bar(pc0(x.s.onTime), x.s.onTime, x.s.onTime < 82 ? "bad" : x.s.onTime < 90 ? "warn" : undefined),
          eur(x.spend), String(x.open.length), x.payAmt ? eur(x.payAmt) : "-", x.exceptions ? pill(x.exceptions + (x.exceptions === 1 ? " exception" : " exceptions"), "warn") : "-"]})),
        {search:true, num:[4, 5, 6], note:"Demo records. Spend YTD is purchase orders plus open supplier invoices."})
    ];
    const key = sel ? shortName(sel) : null, x = key ? info.find(y => y.n === key) : null;
    if (x){
      const lowFirst = x.parts.slice().sort((a, b) => (partAvail(a) < a.min ? 0 : 1) - (partAvail(b) < b.min ? 0 : 1)).slice(0, 8);
      const links = [{label:"Purchasing", go:G("Garage", "purchasing")}, {label:"Payables", go:G("Finance", "payables")}];
      if (x.parts.length) links.push({label:"Parts (low stock)", go:G("Garage", "parts", null, {partLow:"low"})});
      blocks.push(detail(x.n, [
        ["Category", x.s.category], ["Payment terms", x.s.terms + " days"], ["Rating", x.s.rating.toFixed(1) + " out of 5"], ["On-time delivery", pc0(x.s.onTime)],
        ["Spend YTD", eur(x.spend) + " (" + eur(x.poSpend) + " orders, " + eur(x.payAmt) + " open invoices)"],
        ["Open purchase orders", x.open.length ? x.open.map(p => p.id).join(", ") : "None"],
        ["Payables", x.pays.length ? x.pays.length + " invoices, " + eur(x.payAmt) + (x.exceptions ? ", " + x.exceptions + " with exceptions" : "") : "None open"],
        ["Parts supplied", x.parts.length + " stocked lines" + (x.low.length ? ", " + x.low.length + " below minimum" : "")]],
        [{label:"Open purchasing", run:() => h.nav("Garage", "purchasing"), primary:true}],
        {kicker:"Supplier account", status:{t:"Rating " + x.s.rating.toFixed(1), tone:ratingTone(x.s.rating)}, sub:x.s.category, links,
          blocks:[
            {type:"progress", title:"Delivery performance", items:[{label:"On time", value:x.s.onTime, text:pc0(x.s.onTime), tone:x.s.onTime < 82 ? "bad" : x.s.onTime < 90 ? "warn" : undefined}]},
            {type:"chart", kind:"column", title:"Order value by month", labels:mLabels, series:[{name:"Orders", data:x.monthly}], h:160},
            {type:"list", title:"Purchase orders", sub:x.pos.length + " orders", items:x.pos.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(p => ({title:p.id + " " + p.what, sub:fmtDate(p.date) + (p.contract !== "-" ? ", " + p.contract : ""), right:eur(p.value), pill:{t:p.state, tone:ST[p.state]}, go:G("Garage", "purchasing")})), empty:"No purchase orders."},
            {type:"list", title:"Payables", items:x.pays.map(p => ({title:p.id + " " + eur(p.amount), sub:p.po + ", " + p.contract, pill:{t:p.match === "matched" ? "matched" : "exception", tone:p.match === "matched" ? "ok" : "bad"}, go:G("Finance", "payables", p.id)})), empty:"No open supplier invoices."},
            {type:"list", title:"Parts supplied", sub:"Lines below minimum first", items:lowFirst.map(p => ({title:p.sku + " " + p.desc, sub:"bin " + p.bin, right:partAvail(p) + " of " + p.min, pill:partAvail(p) < p.min ? {t:"low", tone:"warn"} : undefined, go:G("Garage", "parts", p.sku)})), empty:"No stocked parts."}]}));
    }
    return out("Suppliers", blocks);
  }

  /* ───────── People ───────── */
  const dept = U("peopleDept", "all"), grp = U("peopleGroup", "all");
  const emps = fx.employees, byId = {}; emps.forEach(e => { byId[e.id] = e; });
  const depts = [...new Set(emps.map(e => e.dept))];
  const office = emps.filter(e => e.group === "Office").length, field = emps.filter(e => e.group === "Field").length;
  const supers = [...new Set(emps.map(e => e.supervisor).filter(s => s && s !== "-"))];
  const tsOf = id => fx.timesheets.find(t => t.emp === id);
  const missing = fx.timesheets.filter(t => t.status === "missing").length;
  const toPeople = patch => G(R, "people", null, Object.assign({peopleDept:"all", peopleGroup:"all", "q:ppl":"", "pg:ppl":0}, patch || {}));
  const roles = {}; emps.forEach(e => { roles[e.role] = (roles[e.role] || 0) + 1; });
  const list = emps.filter(e => (dept === "all" || e.dept === dept) && (grp === "all" || e.group === grp));
  const blocks = [
    {type:"note", text:emps.length + " demo staff: " + office + " office and " + field + " field/workshop. Only Ronan Conneely is a confirmed named client employee. Work contact only."},
    {type:"kpis", min:180, items:[
      {label:"Headcount", value:String(emps.length), hint:depts.length + " departments", go:toPeople()},
      {label:"Office", value:String(office), hint:Math.round(office / emps.length * 100) + "% of headcount", go:toPeople({peopleGroup:"Office"})},
      {label:"Field and workshop", value:String(field), hint:Math.round(field / emps.length * 100) + "% of headcount", go:toPeople({peopleGroup:"Field"})},
      {label:"Supervisors", value:String(supers.length), hint:supers.join(", "), go:toPeople()},
      {label:"Missing timesheets", value:String(missing), tone:missing ? "warn" : undefined, hint:missing * 8 + " est. hours from 30 Sep", go:G("Work", "timesheets", null, {tsStatus:"missing", tsField:false})},
      {label:"Roles", value:String(Object.keys(roles).length), hint:"distinct job titles", go:toPeople()}]},
    {type:"grid", cols:"1fr 1fr 1fr", items:[
      {type:"chart", kind:"hbar", title:"Headcount by department", sub:"Click a department to filter the table.", fmt:v => String(v),
        items:depts.map(d => ({label:d, value:emps.filter(e => e.dept === d).length, text:String(emps.filter(e => e.dept === d).length), go:toPeople({peopleDept:d})})).sort((a, b) => b.value - a.value)},
      {type:"chart", kind:"donut", title:"Office and field", sub:"Click a slice to filter the table.", size:150, fmt:v => String(v), center:{value:String(emps.length), label:"People"},
        items:[{label:"Field and workshop", value:field, text:String(field), go:toPeople({peopleGroup:"Field"})}, {label:"Office", value:office, text:String(office), color:"var(--ch4)", go:toPeople({peopleGroup:"Office"})}]},
      {type:"chart", kind:"hbar", title:"Team size by supervisor", sub:"Click a supervisor to open the team.", fmt:v => String(v),
        items:supers.map(s => ({label:s, value:emps.filter(e => e.supervisor === s).length, text:String(emps.filter(e => e.supervisor === s).length), go:toPeople({"q:ppl":s})})).sort((a, b) => b.value - a.value)}]},
    {type:"grid", cols:"2fr 1fr", items:[
      {type:"chart", kind:"stacked", title:"Department by group", sub:"Office and field headcount per department", labels:depts, h:230, fmt:v => String(Math.round(v)),
        series:[{name:"Field and workshop", data:depts.map(d => emps.filter(e => e.dept === d && e.group === "Field").length)}, {name:"Office", data:depts.map(d => emps.filter(e => e.dept === d && e.group === "Office").length), color:"var(--ch4)"}],
        go:depts.map(d => toPeople({peopleDept:d}))},
      {type:"chart", kind:"hbar", title:"Largest roles", sub:"Click a role to filter the table.", fmt:v => String(v),
        items:Object.keys(roles).sort((a, b) => roles[b] - roles[a]).slice(0, 7).map(r => ({label:r, value:roles[r], text:String(roles[r]), go:toPeople({"q:ppl":r})}))}]},
    chips("Department", "peopleDept", [["all", "All"]].concat(depts.map(d => [d, d])), "all"),
    chips("Group", "peopleGroup", [["all", "All"], ["Office", "Office"], ["Field", "Field and workshop"]], "all"),
    tbl("ppl", "People (" + list.length + ")", ["ID","Name","Role","Department","Group","Supervisor","Timesheet","Profile"],
      list.map(e => { const t = tsOf(e.id);
        return {id:e.id, onClick:select(e.id), cells:[{t:e.id, go:G(R, "people", e.id)}, person(e.name), e.role, L(e.dept, R, "people", null, {peopleDept:e.dept}), e.group, e.supervisor, t ? badge(t.status) : "-", e.note]}; }),
      {search:true, size:15, note:list.length + " of " + emps.length + " people. Work contact only."})
  ];
  const e = sel ? byId[sel] : null;
  if (e){
    const t = tsOf(e.id), reports = emps.filter(x => x.supervisor === e.name), boss = emps.find(x => x.name === e.supervisor);
    const links = [{label:"Timesheets", go:G("Work", "timesheets", null, {tsStatus:t ? t.status : "all", tsField:false})}, {label:e.dept + " team", go:toPeople({peopleDept:e.dept})}];
    if (boss) links.push({label:"Supervisor " + boss.name, go:G(R, "people", boss.id)});
    if (reports.length) links.push({label:"Direct reports", go:toPeople({"q:ppl":e.name})});
    blocks.push(detail(e.name, [
      ["Employee ID", e.id], ["Role", e.role], ["Department", e.dept], ["Group", e.group === "Field" ? "Field and workshop" : "Office"],
      ["Supervisor", e.supervisor], ["Profile", e.note],
      ["Timesheet, 30 Sep", t ? t.status + (t.status === "missing" ? " (estimated " + t.est + " h)" : t.hrs ? " (" + t.hrs + " h" + (t.by ? ", entered by " + t.by : "") + ")" : "") : "Submitted"],
      ["Direct reports", reports.length ? String(reports.length) : "None"], ["Contact", "Work contact only"]],
      t && t.status === "missing" ? [{label:"Enter 8h as supervisor", run:act("enterHours", {emp:e.id, hrs:8}), primary:true}] : t && t.status === "entered" ? [{label:"Approve and post", run:act("approveTimesheet", {emp:e.id}), primary:true}] : [],
      {kicker:e.group === "Field" ? "Field and workshop" : "Office", status:t ? {t:"timesheet " + t.status, tone:ST[t.status]} : {t:"timesheet received", tone:"ok"}, sub:e.role + ", " + e.dept, links,
        blocks:reports.length ? [{type:"list", title:"Direct reports", sub:reports.length + " people, first 6 shown", items:reports.slice(0, 6).map(x => ({title:x.name, sub:x.role, pill:tsOf(x.id) ? {t:tsOf(x.id).status, tone:ST[tsOf(x.id).status]} : undefined, go:G(R, "people", x.id)}))}] : []}));
  }
  return out("People", blocks);
}
