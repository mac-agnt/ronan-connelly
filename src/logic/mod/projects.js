/* Projects: overview, contracts, costs, variations, quotes, pipeline. */
import {
  CLOCK, eur, pct, fmtDate, daysFrom, contractFin, missingStats, shortName, quoteStats, contractCurve, HIST
} from "../fixtures";
import { sumBy, tone, pill, L, G, bar, badge, person, eurC } from "./kit";

const TODAY = "2026-10-01";
const MONTHS12 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CATS = [["labour","Labour"],["materials","Materials"],["plant","Plant"],["subcontract","Subcontract"]];
const short = c => c.name.replace(" (demo project)", "");
const mTone = m => m < 12 ? "bad" : m < 18 ? "warn" : "ok";
const flagsOf = (fx, id) => {
  const f = [];
  if (fx.variations.some(v => v.contract === id && v.status === "pending")) f.push("variation pending");
  if (id === "PRJ-027") f.push("evidence 8/10");
  return f.length ? pill(f.join(", "), "warn") : "-";
};
const catSum = (fx, id, cat, st) => sumBy(fx.costs.filter(r => r.contract === id && r.category === cat && r.status === st && !r.overlay), r => r.amount);

export function buildProjects(k){
  const { fx, sec, sel, tbl, detail, out, chips, select, act, U } = k;
  const ms = missingStats(fx), qs = quoteStats(fx);
  const fin = id => contractFin(fx, id);
  const portfolio = fx.contracts.map(c => fin(c.id));
  const totalValue = sumBy(fx.contracts, c => c.value);
  const portMargin = sumBy(portfolio, p => p.margin) / totalValue * 100;
  const pendingVar = sumBy(fx.variations.filter(v => v.status === "pending"), v => v.amount);
  const below = portfolio.filter(p => p.marginPct < 18);

  const contractRow = (p, link) => ({id:link ? undefined : p.c.id, onClick:link ? undefined : select(p.c.id), cells:[
    link ? {t:p.c.id, go:G("Projects","contracts",p.c.id), sub:short(p.c)} : {t:p.c.id, sub:short(p.c)},
    shortName(p.c.client), eur(p.c.value), pill(pct(p.marginPct), mTone(p.marginPct)), bar(p.c.progress + "%", p.c.progress), person(p.c.mgr), flagsOf(fx, p.c.id)]});
  const contractCols = ["Contract","Client","Approved value","Forecast margin","Progress","Manager","Flags"];

  /* ───────── Overview ───────── */
  if (sec === "overview"){
    const posted = sumBy(portfolio, p => p.posted), committed = sumBy(portfolio, p => p.committed), estimate = sumBy(portfolio, p => p.estimate);
    const cat = CATS.map(c => ({label:c[1], value:sumBy(fx.costs.filter(r => r.category === c[0] && !r.overlay), r => r.amount)}));
    return out("Projects overview", [
      {type:"kpis", cols:3, items:[
        {label:"Active contracts", value:String(fx.contracts.length), hint:"approved value " + eurC(totalValue), go:G("Projects","contracts")},
        {label:"Portfolio forecast margin", value:pct(portMargin), hint:"target 18%, " + below.length + " contracts below", tone:"warn", go:G("Projects","contracts",null,{cMargin:"below"})},
        {label:"Cost posted to date", value:eurC(posted), hint:eurC(committed) + " committed, " + eurC(estimate) + " still to estimate", go:G("Projects","costs",null,{costContract:"all"})},
        {label:"Pending variations", value:eur(pendingVar), hint:"not in approved value", tone:"warn", go:G("Projects","variations",null,{varF:"pending"})},
        {label:"Open quotes", value:eurC(qs.openValue), hint:qs.open.length + " live, win rate " + qs.winRate.toFixed(0) + "%", go:G("Projects","quotes",null,{quoteF:"open"})},
        {label:"Open opportunities", value:String(fx.opportunities.length), hint:eurC(sumBy(fx.opportunities, o => o.value)) + " pipeline", go:G("Projects","pipeline")}]},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"column", title:"Forecast margin against 18% target", sub:"By contract. Click a bar to open the contract.", labels:portfolio.map(p => p.c.id), series:[{name:"Forecast margin %", data:portfolio.map(p => Math.round(p.marginPct * 10) / 10)}], fmt:v => v.toFixed(0) + "%", target:18, targetLabel:"18% target", h:250, go:portfolio.map(p => G("Projects","contracts",p.c.id))},
        {type:"chart", kind:"donut", title:"Forecast cost by category", sub:"Posted, committed and estimated", center:{value:eurC(sumBy(cat, c => c.value)), label:"Forecast cost"}, fmt:eurC, items:cat.map(c => ({label:c.label, value:c.value, go:G("Projects","costs",null,{costContract:"all", costCat:CATS.find(x => x[1] === c.label)[0]})}))}]},
      {type:"chart", kind:"stacked", title:"Cost position by contract", sub:"Posted actuals, commitments and further estimate. The gap to approved value is the forecast margin.", labels:portfolio.map(p => p.c.id), h:250,
        series:[{name:"Posted", data:portfolio.map(p => p.posted)}, {name:"Committed", data:portfolio.map(p => p.committed), color:"var(--ch2)"}, {name:"Estimate", data:portfolio.map(p => p.estimate), color:"var(--ch4)"}, {name:"Approved value", kind:"line", color:"var(--warn)", dashed:true, data:portfolio.map(p => p.c.value)}],
        go:portfolio.map(p => G("Projects","costs",null,{costContract:p.c.id}))},
      tbl("proj-over", "Portfolio", contractCols, portfolio.map(p => contractRow(p, true)), {num:[2,3], sort:true})
    ]);
  }

  /* ───────── Contracts ───────── */
  if (sec === "contracts"){
    const mf = U("cMargin", "all");
    const list = portfolio.filter(p => mf === "all" || (mf === "below" ? p.marginPct < 18 : p.marginPct >= 18));
    const blocks = [
      {type:"kpis", cols:4, items:[
        {label:"Approved value", value:eurC(totalValue), hint:fx.contracts.length + " contracts"},
        {label:"Forecast margin", value:eurC(sumBy(portfolio, p => p.margin)), hint:pct(portMargin) + " of approved value", tone:"warn"},
        {label:"Below target", value:String(below.length), hint:"under 18%", tone:"bad", go:G("Projects","contracts",null,{cMargin:"below"})},
        {label:"Average progress", value:pct(sumBy(fx.contracts, c => c.progress * c.value) / totalValue), hint:"value weighted", go:G("Dashboard","delivery")}]},
      chips("Margin", "cMargin", [["all","All"],["below","Below 18%"],["ok","At or above 18%"]], "all"),
      tbl("contracts", "Contracts", contractCols, list.map(p => contractRow(p, false)), {search:true, num:[2,3]})];
    if (sel && fx.contracts.some(c => c.id === sel)){
      const p = fin(sel), c = p.c, curve = contractCurve(c);
      const cats = CATS.map(x => ({label:x[1], value:["posted","committed","estimate"].reduce((a, st) => a + catSum(fx, c.id, x[0], st), 0), go:G("Projects","costs",null,{costContract:c.id, costCat:x[0]})}));
      const invs = fx.invoices.filter(i => i.contract === c.id);
      const vars = fx.variations.filter(v => v.contract === c.id);
      blocks.push(detail(c.id + " " + short(c), [
        ["Client", c.client],["Approved contract value (net)", eur(c.value)],["Contract manager", c.mgr],["Timeline", fmtDate(c.start) + " to " + fmtDate(c.end)],
        ["Forecast margin", eur(p.margin) + " / " + pct(p.marginPct)],["Posted, committed, estimate", eur(p.posted) + ", " + eur(p.committed) + ", " + eur(p.estimate)],["Pending variations (separate)", eur(p.pending)],
        ["Labour, posted", eur(catSum(fx, c.id, "labour", "posted"))],["Plant allocated", fx.assets.filter(a => a.alloc === c.id).length + " assets"],["Documents", fx.evidence.filter(e => e.group === c.id).length + " evidence files"],["Invoices", invs.map(i => i.id).join(", ") || "-"]],
        [{label:"Open costs", run:() => k.h.nav("Projects","costs",null,{costContract:c.id}), primary:true},{label:"Open variations", run:() => k.h.nav("Projects","variations",null,{varF:"all"})}],
        {kicker:"Contract", status:{t:pct(p.marginPct) + " margin", tone:mTone(p.marginPct)}, sub:shortName(c.client) + ", " + c.progress + "% complete",
          blocks:[
            {type:"kpis", min:150, items:[{label:"Forecast margin", value:eurC(p.margin), hint:pct(p.marginPct) + " vs 18%", tone:mTone(p.marginPct) === "ok" ? undefined : mTone(p.marginPct)},{label:"Progress", value:c.progress + "%", hint:"to " + fmtDate(c.end)},{label:"Pending variations", value:eurC(p.pending), hint:vars.filter(v => v.status === "pending").length + " pending", go:G("Projects","variations",vars.find(v => v.status === "pending") ? vars.find(v => v.status === "pending").id : null,{varF:"pending"})}]},
            {type:"chart", kind:"line", title:"Planned against actual progress", sub:"Percent complete by month, 2026", labels:MONTHS12, h:190, fmt:v => Math.round(v) + "%", yMax:100, series:[{name:"Planned", data:curve.planned, dashed:true, color:"var(--ch2)"},{name:"Actual", data:curve.actual, color:"var(--ch1)"}]},
            {type:"chart", kind:"donut", title:"Forecast cost by category", size:130, center:{value:eurC(p.forecast), label:"Forecast"}, fmt:eurC, items:cats},
            {type:"list", title:"Invoices", items:invs.map(i => ({title:i.id + ", " + eur(i.amount), sub:i.status === "paid" ? "paid " + fmtDate(i.paidOn) : "due " + fmtDate(i.due), pill:{t:i.status, tone:i.status === "overdue" ? "bad" : i.status === "paid" ? "ok" : "warn"}, go:G("Finance","invoices",i.id)})), empty:"No invoices on this contract."}],
          links:[{label:shortName(c.client), go:G("Records","clients",shortName(c.client))},{label:"All invoices", go:G("Finance","invoices",null,{invFilter:"all", invContract:c.id})},{label:"Plant allocated", go:G("Plant & Hire","assets")}].concat(c.id === "PRJ-027" ? [{label:"Safety pack SAFE-031", go:G("Safety","packs")}] : [])}));
    }
    return out("Contracts", blocks);
  }

  /* ───────── Costs ───────── */
  if (sec === "costs"){
    const cid = U("costContract", "PRJ-027"), cat = U("costCat", "all"), code = U("costCode", "all"), per = U("costPer", "all");
    const rows = fx.costs.filter(r => (cid === "all" || r.contract === cid) && (cat === "all" || r.category === cat) && (code === "all" || r.code === code) && (per === "all" || r.status !== "posted" || r.month === per) && !r.overlay);
    const f = cid === "all" ? null : fin(cid);
    const stat = st => sumBy(rows.filter(r => r.status === st), r => r.amount);
    const blocks = [
      chips("Contract", "costContract", [["all","All"]].concat(fx.contracts.map(c => [c.id, c.id])), "PRJ-027"),
      chips("Category", "costCat", [["all","All"],["labour","Labour"],["materials","Materials"],["plant","Plant"],["subcontract","Subcontract"]], "all"),
      chips("Cost code", "costCode", [["all","All"],["LAB","LAB"],["MAT","MAT"],["PLT","PLT"],["PLT-REP","PLT-REP"],["SUB","SUB"]], "all"),
      chips("Posted period", "costPer", [["all","All"],["2026-07","Jul 2026"],["2026-08","Aug 2026"],["2026-09","Sep 2026"]], "all")];
    blocks.push({type:"kpis", items:[
      {label:"Posted actual", value:eur(stat("posted")), hint:"in selection"},
      {label:"Committed, not in actuals", value:eur(stat("committed")), hint:"in selection"},
      {label:"Further estimate", value:eur(stat("estimate")), hint:"excludes commitments"}].concat(f ? [
      {label:"Forecast final cost", value:eur(f.forecast), hint:"contract total, net of VAT"},
      {label:"Forecast margin", value:eur(f.margin) + " / " + pct(f.marginPct), hint:"target 18%", tone:f.marginPct < 18 ? "bad" : undefined}] : [
      {label:"Lines in selection", value:String(rows.length), hint:"across " + new Set(rows.map(r => r.contract)).size + " contracts"}])});
    if (f){
      if (f.overlay) blocks.push({type:"note", tone:"warn", text:"Scenario overlay: " + eur(f.overlay) + " of approved timesheet cost posted in this demo. Not included in the starting posted figures above. With overlay the forecast margin would be " + eur(f.margin - f.overlay) + " / " + pct((f.margin - f.overlay) / f.c.value * 100) + "."});
      else if (cid === "PRJ-027") blocks.push({type:"note", text:"Scenario overlay: the " + eur(ms.estCost) + " of estimated missing labour (Work → Timesheets) is not in posted costs. Approved timesheet hours will appear here once, as an overlay.", action:{label:"Open timesheets", run:() => k.h.nav("Work","timesheets")}});
    }
    const byCode = {}; rows.forEach(r => { byCode[r.code] = (byCode[r.code] || 0) + r.amount; });
    blocks.push({type:"grid", cols:"2fr 1fr", items:[
      {type:"chart", kind:"stacked", title:"Cost by category and status", sub:cid === "all" ? "All contracts" : cid + " " + short(fin(cid).c), labels:CATS.map(c => c[1]), h:230,
        series:[{name:"Posted", data:CATS.map(c => sumBy(rows.filter(r => r.category === c[0] && r.status === "posted"), r => r.amount))}, {name:"Committed", data:CATS.map(c => sumBy(rows.filter(r => r.category === c[0] && r.status === "committed"), r => r.amount)), color:"var(--ch2)"}, {name:"Estimate", data:CATS.map(c => sumBy(rows.filter(r => r.category === c[0] && r.status === "estimate"), r => r.amount)), color:"var(--ch4)"}],
        go:CATS.map(c => G("Projects","costs",null,{costContract:cid, costCat:c[0]}))},
      {type:"chart", kind:"donut", title:"By cost code", size:140, center:{value:eurC(sumBy(rows, r => r.amount)), label:"Selection"}, fmt:eurC, items:Object.keys(byCode).sort().map(c => ({label:c, value:byCode[c], go:G("Projects","costs",null,{costContract:cid, costCode:c})}))}]});
    blocks.push(tbl("costs", "Cost lines", ["Contract","Status","Category","Code","Asset","Month","Source","Amount"], rows.map(r => ({cells:[L(r.contract, "Projects","contracts",r.contract), badge(r.status), r.category, r.code, r.asset ? L(r.asset, "Plant & Hire","assets",r.asset) : "-", r.month, r.source, eur(r.amount)]})), {size:14, num:[7], count:rows.length, search:true}));
    return out("Costs", blocks);
  }

  /* ───────── Variations ───────── */
  if (sec === "variations"){
    const vf = U("varF", "all");
    const list = fx.variations.filter(v => vf === "all" || v.status === vf);
    const sv = sel ? fx.variations.find(v => v.id === sel) : null;
    const sumSt = st => sumBy(fx.variations.filter(v => v.status === st), v => v.amount);
    const blocks = [
      {type:"kpis", cols:4, items:[
        {label:"Pending value", value:eur(sumSt("pending")), hint:fx.variations.filter(v => v.status === "pending").length + " awaiting client", tone:"warn", go:G("Projects","variations",null,{varF:"pending"})},
        {label:"Approved value", value:eur(sumSt("approved")), hint:fx.variations.filter(v => v.status === "approved").length + " approved", go:G("Projects","variations",null,{varF:"approved"})},
        {label:"Rejected value", value:eur(sumSt("rejected")), hint:fx.variations.filter(v => v.status === "rejected").length + " rejected", tone:"bad", go:G("Projects","variations",null,{varF:"rejected"})},
        {label:"Potential cost at risk", value:eur(sumBy(fx.variations.filter(v => v.status === "pending"), v => v.cost)), hint:"cost already exposed on pending variations"}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"donut", title:"Variations by status", size:140, center:{value:String(fx.variations.length), label:"Variations"}, fmt:eurC, items:["pending","approved","rejected"].map(s => ({label:s.charAt(0).toUpperCase() + s.slice(1), value:sumSt(s), tone:s === "pending" ? "warn" : s === "rejected" ? "bad" : undefined, color:s === "approved" ? "var(--ch1)" : undefined, go:G("Projects","variations",null,{varF:s})}))},
        {type:"chart", kind:"hbar", title:"Value by contract", sub:"All statuses", fmt:eurC, items:[...new Set(fx.variations.map(v => v.contract))].map(id => ({label:id, sub:short(fin(id).c), value:sumBy(fx.variations.filter(v => v.contract === id), v => v.amount), go:G("Projects","contracts",id)}))}]},
      chips("Status", "varF", [["all","All"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"]], "all"),
      tbl("vars", "Variations", ["Ref","Contract","Status","Value","Potential cost","Owner","Submitted","Next action"], list.map(v => ({id:v.id, onClick:select(v.id), cells:[{t:v.id, sub:v.title}, L(v.contract, "Projects","contracts",v.contract), badge(v.status), eur(v.amount), eur(v.cost), person(v.owner), fmtDate(v.submitted), v.next]})), {num:[3,4]})];
    if (sv) blocks.push(detail(sv.id + " " + sv.title, [["Contract", sv.contract],["Status", sv.status + (sv.status === "pending" ? " (not in approved contract value or recognised revenue)" : "")],["Value", eur(sv.amount)],["Potential associated cost", eur(sv.cost)],["Owner", sv.owner],["Submitted", fmtDate(sv.submitted)],["Evidence", sv.evidence || "Site instruction on file"],["Site instruction", sv.id === "VAR-009" ? "SI-014: divert 90m of existing 150mm main at chainage 420 following a service strike. Issued 22 Sep 2026 by the client's site representative (demo)." : "On file"],["Next action", sv.next]],
      sv.id === "VAR-009" ? [{label:sv.drafted ? "Draft prepared" : "Prepare draft submission and approval task", run:act("draftVariation"), disabled:sv.drafted, primary:true},{label:"Approve draft (simulated)", run:act("approveVariationDraft"), disabled:!sv.drafted || sv.sent}] : [],
      {kicker:"Variation", status:{t:sv.status, tone:sv.status === "approved" ? "ok" : sv.status === "rejected" ? "bad" : "warn"}, sub:eur(sv.amount) + " on " + sv.contract,
        blocks:[{type:"list", title:"Progress", items:[{title:"Site instruction issued", sub:"Client site representative", tone:"ok"},{title:"Variation submitted", sub:fmtDate(sv.submitted) + ", " + sv.owner, tone:"ok"},{title:sv.status === "pending" ? "Awaiting client decision" : "Client decision: " + sv.status, sub:sv.next, tone:sv.status === "pending" ? "warn" : sv.status === "rejected" ? "bad" : "ok"}]}],
        links:[{label:"Contract " + sv.contract, go:G("Projects","contracts",sv.contract)},{label:"Contract costs", go:G("Projects","costs",null,{costContract:sv.contract})}].concat(sv.id === "VAR-009" ? [{label:"Approvals queue", go:G("Work","approvals")}] : [])}));
    return out("Variations", blocks);
  }

  /* ───────── Quotes ───────── */
  if (sec === "quotes"){
    const qf = U("quoteF", "all");
    const OPEN = ["draft","sent","negotiation"];
    const list = fx.quotes.filter(q => qf === "all" || (qf === "open" ? OPEN.indexOf(q.status) > -1 : q.status === qf));
    const sq = sel ? fx.quotes.find(q => q.id === sel) : null;
    const stage = s => fx.quotes.filter(q => q.status === s);
    const avgMargin = sumBy(qs.won, q => q.margin * q.value) / (qs.wonValue || 1);
    const bucket = q => q.issued ? ({"06":0,"07":1,"08":2,"09":3}[q.issued.slice(5, 7)] ?? 4) : 4;
    const labels = ["Jun","Jul","Aug","Sep","Drafts"];
    const grp = f => labels.map((_, i) => sumBy(fx.quotes.filter(q => bucket(q) === i && f(q)), q => q.value));
    const blocks = [
      {type:"kpis", cols:3, items:[
        {label:"Open quotes", value:eurC(qs.openValue), hint:qs.open.length + " live quotes", go:G("Projects","quotes",null,{quoteF:"open"})},
        {label:"Weighted pipeline", value:eurC(qs.weighted), hint:"value x win chance"},
        {label:"Win rate", value:qs.winRate.toFixed(0) + "%", hint:qs.won.length + " won, " + qs.lost.length + " lost", go:G("Projects","quotes",null,{quoteF:"won"})},
        {label:"Won, last 90 days", value:eurC(qs.wonValue), hint:"avg margin " + avgMargin.toFixed(1) + "%", go:G("Projects","quotes",null,{quoteF:"won"})},
        {label:"Expiring in 21 days", value:String(qs.expiring.length), hint:qs.expiring.length ? qs.expiring.map(q => q.id).join(", ") : "none", tone:qs.expiring.length ? "warn" : undefined, go:G("Projects","quotes",qs.expiring[0] ? qs.expiring[0].id : null,{quoteF:"open"})},
        {label:"Drafts to finish", value:String(stage("draft").length), hint:eurC(sumBy(stage("draft"), q => q.value)) + " not yet sent", go:G("Projects","quotes",null,{quoteF:"draft"})}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Quote funnel", sub:"Value by stage. Click a stage to filter.", fmt:eurC, items:["draft","sent","negotiation","won","lost"].map(s => ({label:s.charAt(0).toUpperCase() + s.slice(1), value:sumBy(stage(s), q => q.value), text:eurC(sumBy(stage(s), q => q.value)), sub:stage(s).length + " quotes", tone:s === "lost" ? "muted" : undefined, go:G("Projects","quotes",null,{quoteF:s})}))},
        {type:"chart", kind:"stacked", title:"Quote outcomes by month issued", sub:"Value won, lost and still open", labels, h:230, series:[{name:"Won", data:grp(q => q.status === "won")},{name:"Lost", data:grp(q => q.status === "lost"), color:"var(--ch5)"},{name:"Open", data:grp(q => OPEN.indexOf(q.status) > -1), color:"var(--ch2)"}]}]},
      chips("Status", "quoteF", [["all","All"],["open","Open"],["draft","Draft"],["sent","Sent"],["negotiation","Negotiation"],["won","Won"],["lost","Lost"]], "all"),
      tbl("quotes", "Quotes (" + list.length + ")", ["Quote","Client","Value","Status","Win chance","Est. margin","Owner","Issued","Expires"],
        list.map(q => ({id:q.id, onClick:select(q.id), cells:[{t:q.id, sub:q.title}, L(shortName(q.client), "Records","clients",shortName(q.client)), eur(q.value), badge(q.status), bar(q.prob + "%", q.prob), pct(q.margin), person(q.owner), q.issued ? fmtDate(q.issued) : "Not sent", OPEN.indexOf(q.status) > -1 && q.status !== "draft" && q.expiry <= daysFrom(14) ? pill(fmtDate(q.expiry), "warn") : fmtDate(q.expiry)]})), {search:true, size:12, num:[2,5]})];
    if (sq){
      const next = {draft:[["sent","Mark as sent",true]], sent:[["negotiation","Move to negotiation",true],["won","Mark won"],["lost","Mark lost"]], negotiation:[["won","Mark won",true],["lost","Mark lost"]], won:[["negotiation","Reopen as negotiation"]], lost:[["negotiation","Reopen as negotiation"]]}[sq.status] || [];
      const opp = sq.opp ? fx.opportunities.find(o => o.id === sq.opp) : null;
      blocks.push(detail(sq.id + " " + sq.title, [["Client", sq.client],["Quote value (net)", eur(sq.value)],["Status", sq.status],["Win chance", sq.prob + "%"],["Weighted value", eur(sq.value * sq.prob / 100)],["Estimated margin", pct(sq.margin)],["Owner", sq.owner],["Issued", sq.issued ? fmtDate(sq.issued) : "Not yet sent"],["Valid until", fmtDate(sq.expiry)],["Linked opportunity", opp ? opp.id + " " + opp.name : "-"]],
        next.map(n => ({label:n[1], run:act("setQuote", {id:sq.id, status:n[0]}), primary:!!n[2]})),
        {kicker:"Quote", status:{t:sq.status, tone:sq.status === "won" ? "ok" : sq.status === "lost" ? "bad" : sq.status === "draft" ? "warn" : "info"}, sub:eur(sq.value) + " to " + shortName(sq.client),
          blocks:[{type:"progress", title:"Win chance", items:[{label:"Probability", value:sq.prob, text:sq.prob + "%"},{label:"Estimated margin", value:sq.margin / 30 * 100, text:pct(sq.margin), tone:mTone(sq.margin)}]}],
          links:[{label:shortName(sq.client), go:G("Records","clients",shortName(sq.client))}].concat(opp ? [{label:"Opportunity " + opp.id, go:G("Projects","pipeline",opp.id)}] : []), note:"Changing status here is a local demo action. No quote is sent anywhere."}));
    }
    return out("Quotes", blocks);
  }

  /* ───────── Pipeline ───────── */
  const STAGES = ["enquiry","tender","review","awarded"];
  const so = sel ? fx.opportunities.find(o => o.id === sel) : null;
  const stageVal = s => sumBy(fx.opportunities.filter(o => o.stage === s), o => o.value);
  const blocks = [
    {type:"note", text:"Six illustrative opportunities. No tender scraping or submission integrations."},
    {type:"kpis", cols:4, items:[
      {label:"Open opportunities", value:String(fx.opportunities.filter(o => o.stage !== "awarded").length), hint:eurC(sumBy(fx.opportunities.filter(o => o.stage !== "awarded"), o => o.value)) + " in play"},
      {label:"Awarded", value:eurC(stageVal("awarded")), hint:fx.opportunities.filter(o => o.stage === "awarded").length + " to mobilise"},
      {label:"Average opportunity", value:eurC(sumBy(fx.opportunities, o => o.value) / fx.opportunities.length), hint:"all stages"},
      {label:"Linked quotes", value:String(fx.quotes.filter(q => q.opp).length), hint:"quotes tied to an opportunity", go:G("Projects","quotes",null,{quoteF:"open"})}]},
    {type:"board", title:"Opportunity pipeline", sub:"Click a card for the detail and follow-up", min:230, cols:STAGES.map(s => ({title:s, total:eurC(stageVal(s)), cards:fx.opportunities.filter(o => o.stage === s).map(o => ({id:o.id, title:o.name.replace(" (demo)", ""), sub:shortName(o.client), value:eurC(o.value), meta:o.owner.split(" ")[0], tag:fx.quotes.some(q => q.opp === o.id) ? {t:"quoted", tone:"info"} : undefined, go:G("Projects","pipeline",o.id)}))}))},
    {type:"chart", kind:"hbar", title:"Value by stage", fmt:eurC, items:STAGES.map(s => ({label:s.charAt(0).toUpperCase() + s.slice(1), value:stageVal(s), sub:fx.opportunities.filter(o => o.stage === s).length + " opportunities"}))}];
  if (so){
    const q = fx.quotes.find(x => x.opp === so.id);
    blocks.push(detail(so.id + " " + so.name.replace(" (demo)", ""), [["Opportunity", so.name],["Client", so.client],["Stage", so.stage],["Value", eur(so.value)],["Owner", so.owner],["Next action", so.next],["Context", so.note || "No notes yet."]],
      [{label:"Create follow-up task", run:act("addTask", {title:"Follow up " + so.id, owner:so.owner, related:so.id}), primary:true}],
      {kicker:"Opportunity", status:{t:so.stage, tone:so.stage === "awarded" ? "ok" : "info"}, sub:eur(so.value), links:[{label:shortName(so.client), go:G("Records","clients",shortName(so.client))}].concat(q ? [{label:"Quote " + q.id, go:G("Projects","quotes",q.id)}] : [])}));
  }
  return out("Pipeline", blocks);
}
