/* Dashboard: Executive, Finance and Delivery views. Every tile and chart element opens the records behind it. */
import {
  CLOCK, eur, pct, fmtDate, daysFrom, contractFin, assetStatus, missingStats, receivables, packProgress,
  HIST, MONTH_LABELS, shortName, quoteStats, ageing, dso, utilByType, hireValue
} from "../fixtures";
import { sumBy, tone, pill, L, G, bar, badge, eurC, delta, cashModel, approvalRows } from "./kit";

const TODAY = "2026-10-01";
const THIN = n => (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";

export function buildDashboard(k){
  const { fx, sec, tbl, out } = k;
  const rec = receivables(fx), as = assetStatus(fx), ms = missingStats(fx), pp = packProgress(fx.pack), qs = quoteStats(fx);
  const portfolio = fx.contracts.map(c => contractFin(fx, c.id));
  const cashRows = cashModel(fx);
  const i = HIST.rev.length - 1;
  const fleetPct = as.allocated / as.total * 100;
  const pendingApprovals = approvalRows(fx).filter(a => a.state === "pending").length;
  const margBad = p => p.marginPct < 12 ? "bad" : p.marginPct < 18 ? "warn" : "ok";

  /* ───────── Executive ───────── */
  if (sec === "executive"){
    const f27 = contractFin(fx, "PRJ-027");
    const byClient = {};
    fx.contracts.forEach(c => { const n = shortName(c.client); byClient[n] = (byClient[n] || 0) + c.value; });
    const hire084 = fx.hires.find(x => x.id === "HIRE-084");
    const hireConflict = hire084.asset === "EX-014" && fx.assets.find(a => a.id === "EX-014").status === "unavailable";
    const hf = fx.parts.find(p => p.sku === "HF-220");
    const v9 = fx.variations.find(v => v.id === "VAR-009");
    const q42 = fx.quotes.find(q => q.id === "Q-0242");
    const queue = [
      {title:"Chase overdue invoice INV-1048, " + eur(42600), sub:"Western Utilities Delivery, 42 days late. Reminder: " + ({none:"not drafted", drafted:"draft awaiting approval", approved:"approved"}[fx.reminders["INV-1048"]]), pill:{t:"High", tone:"bad"}, tone:"bad", right:"Niamh Kelly", go:G("Finance","invoices","INV-1048")},
      {title:"PRJ-027 forecast margin is " + pct(f27.marginPct) + " against an 18% target", sub:eur(f27.margin) + " forecast margin on " + eur(f27.c.value), pill:{t:"High", tone:"bad"}, tone:"bad", right:"Eoin Burke", go:G("Projects","contracts","PRJ-027")},
      ...(hireConflict ? [{title:"HIRE-084 is booked on EX-014, which is down", sub:"EX-022 is free for the same dates. Reassign before tomorrow.", pill:{t:"High", tone:"bad"}, tone:"bad", right:"Patrick Moran", go:G("Plant & Hire","schedule")}] : []),
      {title:ms.missing + " missing timesheets from 30 Sep", sub:ms.estHours + " est. hours, " + eur(ms.estCost) + " potential unposted cost", pill:{t:"Medium", tone:"warn"}, tone:"warn", right:"Liam Joyce", go:G("Work","timesheets")},
      {title:"HF-220 hydraulic filters: " + hf.onHand + " on hand, minimum " + hf.min, sub:fx.pos.length ? "PO-0420 is " + fx.pos[0].state : "No purchase order yet. Suggested 10 units, " + eur(480), pill:{t:"Medium", tone:"warn"}, tone:"warn", right:"Seán Duffy", go:G("Garage","parts","HF-220")},
      {title:"VAR-009 service diversion, " + eur(v9.amount), sub:v9.next, pill:{t:"Medium", tone:"warn"}, tone:"warn", right:"Eoin Burke", go:G("Projects","variations","VAR-009")},
      {title:"Quote Q-0242 expires " + fmtDate(q42.expiry) + ", " + eur(q42.value), sub:"ESB substation access roads, status " + q42.status, pill:{t:"Low"}, right:"Aisling Walsh", go:G("Projects","quotes","Q-0242")},
      {title:"SAFE-031 evidence pack is " + pp.done + " of " + pp.total, sub:"Needed for the PRJ-027 client pack", pill:{t:fx.pack.state === "approved" ? "Done" : "Low", tone:fx.pack.state === "approved" ? "ok" : undefined}, right:"Fiona McHale", go:G("Safety","packs")}
    ];
    return out("Executive", [
      {type:"kpis", cols:4, items:[
        {label:"Revenue, September", value:eurC(HIST.rev[i]), delta:delta(HIST.rev[i], HIST.rev[i - 1], {label:"vs Aug"}), hint:"civil " + eurC(HIST.civil[i]) + " + plant hire " + eurC(HIST.hire[i]), spark:HIST.rev, go:G("Finance","reports")},
        {label:"Net margin, September", value:pct(HIST.marginPct[i]), delta:delta(HIST.marginPct[i], HIST.marginPct[i - 1], {abs:true, fmt:n => n.toFixed(1) + " pts", label:"vs Aug"}), hint:"after direct cost and overheads", spark:HIST.marginPct, go:G("Dashboard","finance")},
        {label:"Outstanding invoices", value:eur(rec.total), hint:rec.count + " unpaid, QuickBooks sample", go:G("Finance","invoices",null,{invFilter:"all"})},
        {label:"Overdue", value:eur(rec.overTotal), hint:rec.overCount + " invoices past due", tone:"bad", go:G("Finance","invoices",null,{invFilter:"overdue"})},
        {label:"Open quotes", value:eurC(qs.openValue), hint:qs.open.length + " live, weighted " + eurC(qs.weighted), go:G("Projects","quotes",null,{quoteF:"open"})},
        {label:"Fleet utilisation", value:pct(fleetPct), delta:delta(fleetPct, HIST.fleetUtil[i - 1], {abs:true, fmt:n => n.toFixed(1) + " pts", label:"vs Aug"}), hint:as.allocated + " of " + as.total + " assets allocated", spark:HIST.fleetUtil, go:G("Plant & Hire","assets")},
        {label:"Missing timesheets", value:ms.missing + " of " + ms.expected, hint:ms.estHours + " est. hours unposted", tone:"warn", go:G("Work","timesheets")},
        {label:"PRJ-027 forecast margin", value:pct(f27.marginPct), hint:eur(f27.margin) + " vs 18% target", tone:"bad", go:G("Projects","contracts","PRJ-027")}]},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"stacked", title:"Revenue against cost, January to September 2026", sub:"Net revenue by stream, with direct cost plus overheads as the line", labels:MONTH_LABELS, h:270,
          series:[{name:"Civil engineering", data:HIST.civil}, {name:"Plant hire", data:HIST.hire}, {name:"Cost and overheads", kind:"line", color:"var(--warn)", data:HIST.cost.map((c, n) => c + HIST.overhead[n])}],
          go:MONTH_LABELS.map(() => G("Finance","reports")), action:{label:"Open reports", go:G("Finance","reports")},
          note:"The internal garage is a cost centre. Internal repair charges are not extra revenue."},
        {type:"chart", kind:"donut", title:"Order book by client", sub:"Approved contract value, " + fx.contracts.length + " live contracts", center:{value:eurC(sumBy(fx.contracts, c => c.value)), label:"Order book"}, fmt:eurC,
          items:Object.keys(byClient).sort((a, b) => byClient[b] - byClient[a]).map(n => ({label:n, value:byClient[n], go:G("Records","clients",n)}))}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Forecast margin by contract", sub:"Marker shows the 18% target. Click a contract to open its costs.", fmt:v => v.toFixed(1) + "%", max:26,
          items:portfolio.slice().sort((a, b) => a.marginPct - b.marginPct).map(p => ({label:p.c.id, sub:p.c.name.replace(" (demo project)", ""), value:Math.max(0, p.marginPct), text:pct(p.marginPct), tone:margBad(p) === "ok" ? undefined : margBad(p), target:18, go:G("Projects","contracts",p.c.id)}))},
        {type:"list", title:"Needs your attention", sub:queue.length + " decisions and follow-ups", items:queue.slice(0, 7), action:{label:"All approvals", go:G("Work","approvals")}}]},
      {type:"grid", cols:"1fr 1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Quote pipeline", sub:"Value by stage", fmt:eurC,
          items:["draft","sent","negotiation","won"].map(s => ({label:s.charAt(0).toUpperCase() + s.slice(1), value:sumBy(fx.quotes.filter(q => q.status === s), q => q.value), text:eurC(sumBy(fx.quotes.filter(q => q.status === s), q => q.value)), sub:fx.quotes.filter(q => q.status === s).length + " quotes", go:G("Projects","quotes",null,{quoteF:s})}))},
        {type:"chart", kind:"donut", title:"Fleet status", sub:as.total + " assets across 6 types", size:150, center:{value:String(as.total), label:"Assets"}, fmt:v => String(v),
          items:[{label:"Allocated", value:as.allocated, text:String(as.allocated), go:G("Plant & Hire","assets",null,{assetType:"all", assetStatus:"allocated"})}, {label:"Available", value:as.available, text:String(as.available), color:"var(--ch4)", go:G("Plant & Hire","assets",null,{assetType:"all", assetStatus:"available"})}, {label:"Unavailable", value:as.unavailable, text:String(as.unavailable), tone:"warn", go:G("Plant & Hire","assets",null,{assetType:"all", assetStatus:"unavailable"})}]},
        {type:"chart", kind:"rings", title:"Safety and compliance", sub:"Share of required items complete", size:96,
          items:[{label:"Checks in", value:Math.round(fx.checks.filter(c => c.status === "reviewed" || c.status === "submitted").length / fx.checks.length * 100), sub:"pre-start", go:G("Safety","checks")},
            {label:"Evidence", value:Math.round(fx.evidence.filter(e => e.status === "reviewed").length / fx.evidence.length * 100), sub:"reviewed", go:G("Safety","evidence")},
            {label:"SAFE-031", value:Math.round(pp.done / pp.total * 100), sub:"pack", tone:fx.pack.state === "approved" ? undefined : "warn", go:G("Safety","packs")}]}]},
      {type:"grid", cols:"2fr 1fr", items:[
        tbl("exec-review", "Contracts needing review", ["Contract","Client","Forecast margin","Progress","Pending variation","Flag"],
          portfolio.filter(p => p.marginPct < 18).sort((a, b) => a.marginPct - b.marginPct).slice(0, 6).map(p => ({cells:[{t:p.c.id, go:G("Projects","contracts",p.c.id), sub:p.c.name.replace(" (demo project)", "")}, shortName(p.c.client), tone(pct(p.marginPct), margBad(p)), bar(p.c.progress + "%", p.c.progress), p.pending ? eur(p.pending) : "-", p.marginPct < 12 ? pill("below 12%", "bad") : pill("below target", "warn")]})), {sort:false, num:[2,4]}),
        {type:"list", title:"Recent activity", sub:"Latest recorded actions", items:fx.events.slice(0, 6).map(e => ({title:e.text, sub:e.who + ", " + e.at})), empty:"No actions yet."}]}
    ]);
  }

  /* ───────── Finance ───────── */
  if (sec === "finance"){
    const ag = ageing(fx);
    const debtors = {};
    fx.invoices.filter(x => x.status !== "paid").forEach(x => { const n = shortName(x.client); debtors[n] = debtors[n] || {total:0, over:0}; debtors[n].total += x.amount; if (x.status === "overdue") debtors[n].over += x.amount; });
    const payTotal = sumBy(fx.payables, p => p.amount);
    const b0 = cashRows.buckets[0];
    const bucketKey = ["nd","1-30","31-60","60+"];
    return out("Finance", [
      {type:"kpis", cols:3, items:[
        {label:"Receivables", value:eur(rec.total), hint:rec.count + " unpaid invoices", go:G("Finance","invoices",null,{invFilter:"all"})},
        {label:"Overdue", value:eur(rec.overTotal), hint:rec.overCount + " invoices, " + (rec.overTotal / rec.total * 100).toFixed(0) + "% of receivables", tone:"bad", go:G("Finance","invoices",null,{invFilter:"overdue"})},
        {label:"Payables open", value:eur(payTotal), hint:fx.payables.filter(p => p.match !== "matched").length + " matching exceptions", tone:"warn", go:G("Finance","payables")},
        {label:"Days to collect", value:dso(fx) + " days", hint:"average over paid invoices", go:G("Finance","invoices",null,{invFilter:"paid"})},
        {label:"Net cash, next 30 days", value:eurC(b0.net), hint:"after demo payroll and overheads", tone:b0.net < 0 ? "bad" : undefined, go:G("Finance","cash")},
        {label:"Pending approvals", value:String(pendingApprovals), hint:"reminders, orders, evidence", go:G("Work","approvals")}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"column", title:"Receivables ageing", sub:"As at " + CLOCK.label + ". Click a bar to see those invoices.", labels:ag.map(b => b.label), series:[{name:"Outstanding", data:ag.map(b => b.total)}],
          go:ag.map((b, n) => G("Finance","invoices",null,{invFilter:n === 0 ? "unpaid" : "overdue", invBucket:bucketKey[n]})), h:250},
        {type:"chart", kind:"column", title:"Cash in against cash out", sub:"Monthly collections and payments, 2026", labels:MONTH_LABELS, series:[{name:"Cash in", data:HIST.cashIn}, {name:"Cash out", data:HIST.cashOut, color:"var(--ch4)"}], go:MONTH_LABELS.map(() => G("Finance","cash")), h:250}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Top debtors", sub:"Outstanding by client. Click to open the account.", fmt:eurC,
          items:Object.keys(debtors).sort((a, b) => debtors[b].total - debtors[a].total).slice(0, 6).map(n => ({label:n, value:debtors[n].total, text:eurC(debtors[n].total), sub:debtors[n].over ? eurC(debtors[n].over) + " overdue" : "nothing overdue", tone:debtors[n].over > debtors[n].total * 0.5 ? "bad" : undefined, go:G("Records","clients",n)}))},
        {type:"chart", kind:"column", title:"Cash outlook, demo forecast", sub:"Net movement after receipts, payments and scenario payroll", labels:cashRows.buckets.map(b => b.label), series:[{name:"Net", data:cashRows.buckets.map(b => b.net)}], go:cashRows.buckets.map(() => G("Finance","cash")), h:230,
          note:"Demo forecast, not a prediction of actual company cash."}]},
      tbl("fin-margin", "Contract margin summary", ["Contract","Client","Approved value","Forecast margin","Margin %","Target"], portfolio.slice().sort((a, b) => a.marginPct - b.marginPct).map(p => ({cells:[{t:p.c.id, go:G("Projects","contracts",p.c.id), sub:p.c.name.replace(" (demo project)", "")}, shortName(p.c.client), eur(p.c.value), eur(p.margin), bar(pct(p.marginPct), Math.max(0, p.marginPct) / 26 * 100, margBad(p) === "ok" ? undefined : margBad(p)), "18.0%"]})), {num:[2,3,4,5], sort:false, note:"Forecast margin is net of VAT and excludes pending variations."})
    ]);
  }

  /* ───────── Delivery ───────── */
  const types = utilByType(fx);
  const openDefects = fx.defects.length;
  const wAvg = sumBy(fx.contracts, c => c.progress * c.value) / sumBy(fx.contracts, c => c.value);
  return out("Delivery", [
    {type:"kpis", cols:3, items:[
      {label:"Active contracts", value:String(fx.contracts.length), hint:"approved value " + eurC(sumBy(fx.contracts, c => c.value)), go:G("Projects","contracts")},
      {label:"Programme complete", value:pct(wAvg), hint:"value-weighted progress", go:G("Projects","overview")},
      {label:"Fleet allocated", value:pct(fleetPct), hint:as.allocated + " of " + as.total + " assets", spark:HIST.fleetUtil, go:G("Plant & Hire","assets",null,{assetType:"all", assetStatus:"allocated"})},
      {label:"Open job cards", value:String(fx.jobcards.length), hint:fx.jobcards.filter(j => j.urgent).length + " urgent, internal backlog", go:G("Garage","jobs")},
      {label:"Field submissions", value:ms.received + " of " + ms.expected, hint:ms.missing + " missing", tone:"warn", go:G("Work","timesheets")},
      {label:"Open defects", value:String(openDefects), hint:"DEF-028 restricts EX-014", tone:"bad", go:G("Safety","defects")}]},
    {type:"gantt", title:"Contract programme", sub:"Bars show planned dates, fill shows progress, line is today. Amber and red flag margin below target.", from:"2026-01-01", to:"2027-06-30", today:TODAY,
      rows:portfolio.slice().sort((a, b) => a.c.start.localeCompare(b.c.start)).map(p => ({label:p.c.id + " " + p.c.name.replace(" (demo project)", ""), sub:shortName(p.c.client) + ", " + p.c.mgr, start:p.c.start, end:p.c.end, progress:p.c.progress, tone:margBad(p) === "ok" ? undefined : margBad(p), text:p.c.progress + "%", go:G("Projects","contracts",p.c.id)})),
      action:{label:"All contracts", go:G("Projects","contracts")}},
    {type:"grid", cols:"1fr 1fr", items:[
      {type:"chart", kind:"stacked", title:"Fleet by type", sub:"Allocated, available and unavailable. Click a type to open its assets.", labels:types.map(t => t.type), h:250,
        series:[{name:"Allocated", data:types.map(t => t.allocated)}, {name:"Available", data:types.map(t => t.available), color:"var(--ch4)"}, {name:"Unavailable", data:types.map(t => t.down), color:"var(--warn)"}],
        fmt:v => String(Math.round(v)), go:types.map(t => G("Plant & Hire","assets",null,{assetType:t.type, assetStatus:"all"}))},
      {type:"chart", kind:"column", title:"Field hours by week", sub:"Submitted hours, last 8 weeks. This week is short because of missing timesheets.", labels:HIST.weekLabels, series:[{name:"Hours", data:HIST.weeklyHours}], fmt:THIN, h:250, go:HIST.weekLabels.map(() => G("Work","timesheets"))}]},
    {type:"grid", cols:"1fr 2fr", align:"start", items:[
      {type:"chart", kind:"hbar", title:"Workshop backlog by stage", sub:"Open job cards", fmt:v => String(v),
        items:["waiting assessment","awaiting parts","in progress","ready for review"].map(s => ({label:s.charAt(0).toUpperCase() + s.slice(1), value:fx.jobcards.filter(j => j.status === s).length, text:String(fx.jobcards.filter(j => j.status === s).length), go:G("Garage","jobs",null,{jobStage:s})}))},
      tbl("del-alloc", "Today's allocations", ["Asset","Type","Allocated to","Location","Status"], fx.assets.filter(a => a.status === "allocated").slice(0, 8).map(a => ({cells:[L(a.id, "Plant & Hire","assets",a.id), a.type, L(a.alloc, "Projects","contracts",a.alloc), a.location.replace(" (demo location)", ""), badge("allocated")]})), {note:"First 8 of " + as.allocated + " allocated assets.", sort:false})]}
  ]);
}
