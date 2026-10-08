/* Plant & Hire: overview, assets, schedule and hire orders. Every tile, bar and row opens the records behind it. */
import { eur, pct, fmtDate, daysFrom, assetStatus, hireDays, hireValue, jobCost, HIST, MONTH_LABELS, shortName, utilByType } from "../fixtures";
import { sumBy, pill, L, G, bar, badge, eurC, delta, ST } from "./kit";

const P = "Plant & Hire";
const TODAY = "2026-10-01";
const locName = s => String(s || "").replace(" (demo location)", "");
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pc0 = v => Math.round(v) + "%";

/* deterministic monthly utilisation for one asset: follows the fleet trend, offset by the asset's own level, ending at its current util */
function utilSeries(a, idx){
  return HIST.fleetUtil.map((f, m) => {
    if (m === HIST.fleetUtil.length - 1) return a.util;
    const v = f + (a.util - 70.8) * 0.55 + Math.sin(idx * 1.9 + m * 1.1) * 6;
    return Math.round(Math.max(4, Math.min(98, v)) * 10) / 10;
  });
}
const dueSoon = a => a.serviceDate <= daysFrom(14);
const statusCell = a => Object.assign(badge(a.status), a.reason ? {sub:a.reason} : {});

export function buildPlant(k){
  const { fx, sec, tbl, out, detail, select, sel, U, chips, act, h } = k;
  const as = assetStatus(fx);
  const types = [...new Set(fx.assets.map(a => a.type))];
  const idx = {}; fx.assets.forEach((a, i) => { idx[a.id] = i; });
  const n9 = HIST.fleetUtil.length - 1;
  const fleetPct = as.allocated / as.total * 100;
  const hire084 = fx.hires.find(x => x.id === "HIRE-084");
  const conflict = hire084.asset === "EX-014" && fx.assets.find(a => a.id === "EX-014").status === "unavailable";
  const toAssets = (type, status, extra) => G(P, "assets", null, Object.assign({assetType:type || "all", assetStatus:status || "all", assetSvc:"all"}, extra || {}));
  const toHire = status => G(P, "hire", null, {hireStatus:status || "all"});
  const typeOf = id => { const a = fx.assets.find(x => x.id === id); return a ? a.type : "-"; };
  const live = fx.hires;
  const hireTotals = () => ({value:sumBy(live, hireValue), days:sumBy(live, hireDays)});
  const statusDonut = (items, o) => Object.assign({type:"chart", kind:"donut", size:150, fmt:v => String(v), items}, o || {});

  /* ───────── Overview ───────── */
  if (sec === "overview"){
    const due14 = fx.assets.filter(dueSoon).sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
    const dispatched = fx.hires.filter(x => x.status === "dispatched"), scheduled = fx.hires.filter(x => x.status === "scheduled");
    const trend = types.map(t => utilByType(fx).find(u => u.type === t));
    return out("Plant & Hire overview", [
      {type:"kpis", min:190, items:[
        {label:"Fleet", value:String(as.total), hint:types.length + " asset types, " + as.service + " in planned service", go:toAssets()},
        {label:"Fleet utilisation", value:pct(fleetPct), delta:delta(fleetPct, HIST.fleetUtil[n9 - 1], {abs:true, fmt:n => n.toFixed(1) + " pts", label:"vs Aug"}), spark:HIST.fleetUtil, hint:as.allocated + " of " + as.total + " assets allocated", go:toAssets("all", "allocated")},
        {label:"Available", value:String(as.available), hint:"ready to allocate", go:toAssets("all", "available")},
        {label:"Unavailable", value:String(as.unavailable), tone:"bad", hint:as.service + " planned service, " + as.defect + " defect", go:toAssets("all", "unavailable")},
        {label:"Hire revenue, September", value:eurC(HIST.hire[n9]), delta:delta(HIST.hire[n9], HIST.hire[n9 - 1], {label:"vs Aug"}), spark:HIST.hire, hint:"external plant hire, net", go:toHire()},
        {label:"Services due in 14 days", value:String(due14.length), tone:due14.length ? "warn" : undefined, hint:due14.length ? "next " + due14[0].id + " on " + fmtDate(due14[0].serviceDate) : "none due", go:toAssets("all", "all", {assetSvc:"14"})},
        {label:"Hire orders live", value:String(fx.hires.length), hint:dispatched.length + " dispatched, " + scheduled.length + " scheduled", go:toHire()}]},
      conflict ? {type:"note", tone:"bad", text:"Conflict: HIRE-084 (2 to 4 Oct) is allocated to EX-014, which is unavailable (DEF-028, WO-0184). EX-022 is available for the same dates.", action:{label:"Open schedule", run:() => h.nav(P, "schedule")}} : {type:"note", text:"No allocation conflicts in the next 7 days."},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"column", title:"Hire revenue by month, 2026", sub:"External plant hire, net. Click a bar to open the hire orders.", labels:MONTH_LABELS, series:[{name:"Hire revenue", data:HIST.hire}], go:MONTH_LABELS.map(() => toHire()), h:250,
          action:{label:"All hire orders", go:toHire()}},
        statusDonut([
          {label:"Allocated", value:as.allocated, text:String(as.allocated), go:toAssets("all", "allocated")},
          {label:"Available", value:as.available, text:String(as.available), color:"var(--ch4)", go:toAssets("all", "available")},
          {label:"Unavailable", value:as.unavailable, text:String(as.unavailable), tone:"warn", go:toAssets("all", "unavailable")}],
          {title:"Fleet status", sub:as.total + " assets. Click a slice to open them.", center:{value:String(as.total), label:"Assets"}})]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Utilisation by type", sub:"Average utilisation per asset type. Click a type to open its assets.", fmt:pc0, max:100,
          items:trend.slice().sort((a, b) => b.util - a.util).map(t => ({label:t.type, value:t.util, text:pc0(t.util), sub:t.allocated + " allocated of " + t.total + ", " + t.down + " down", tone:t.util < 55 ? "warn" : undefined, go:toAssets(t.type, "all")}))},
        {type:"list", title:"Services due soon", sub:"Next planned services, earliest first", action:{label:"Due in 14 days", go:toAssets("all", "all", {assetSvc:"14"})},
          items:fx.assets.slice().sort((a, b) => a.serviceDate.localeCompare(b.serviceDate)).slice(0, 8).map(a => ({title:a.id + " " + a.type, sub:locName(a.location) + (a.alloc ? ", on " + a.alloc : ""), right:fmtDate(a.serviceDate), pill:{t:a.status, tone:ST[a.status]}, tone:dueSoon(a) ? "warn" : undefined, go:G(P, "assets", a.id)}))}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"area", title:"Fleet utilisation trend", sub:"Share of the fleet allocated, January to September", labels:MONTH_LABELS, series:[{name:"Utilisation", data:HIST.fleetUtil}], fmt:pc0, h:230, go:MONTH_LABELS.map(() => toAssets("all", "allocated"))},
        {type:"chart", kind:"stacked", title:"Fleet by type", sub:"Allocated, available and unavailable. Click a type to open its assets.", labels:types, h:230, fmt:v => String(Math.round(v)),
          series:[{name:"Allocated", data:trend.map(t => t.allocated)}, {name:"Available", data:trend.map(t => t.available), color:"var(--ch4)"}, {name:"Unavailable", data:trend.map(t => t.down), color:"var(--warn)"}],
          go:types.map(t => toAssets(t, "all"))}]},
      tbl("pl-upcoming", "Upcoming hire allocations", ["Order","Customer","Asset","Dates","Days","Value","Status","Check"],
        fx.hires.slice().sort((a, b) => a.from.localeCompare(b.from)).map(x => { const a = fx.assets.find(y => y.id === x.asset), down = a && a.status === "unavailable";
          return {cells:[L(x.id, P, "hire", x.id), L(shortName(x.customer), "Records", "clients", shortName(x.customer)), L(x.asset, P, "assets", x.asset), fmtDate(x.from) + " to " + fmtDate(x.to), String(hireDays(x)), eur(hireValue(x)), badge(x.status), down ? pill("Asset down", "bad") : pill("Clear", "ok")]}; }),
        {num:[4,5], sort:false, note:"Value is net scheduled hire, not recognised revenue."})
    ]);
  }

  /* ───────── Assets ───────── */
  if (sec === "assets"){
    const ty = U("assetType", "all"), st = U("assetStatus", "all"), sv = U("assetSvc", "all");
    const list = fx.assets.filter(a => (ty === "all" || a.type === ty) && (st === "all" || a.status === st) && (sv === "all" || dueSoon(a)));
    const n = list.length, avgUtil = n ? sumBy(list, a => a.util) / n : 0;
    const cnt = s => list.filter(a => a.status === s).length;
    const blocks = [
      chips("Type", "assetType", [["all", "All"]].concat(types.map(t => [t, t])), "all"),
      chips("Status", "assetStatus", [["all", "All"], ["allocated", "Allocated"], ["available", "Available"], ["unavailable", "Unavailable"]], "all"),
      chips("Service", "assetSvc", [["all", "Any"], ["14", "Due in 14 days"]], "all"),
      {type:"kpis", min:170, items:[
        {label:"Assets in view", value:String(n), hint:"of " + fx.assets.length + " in the fleet", go:toAssets()},
        {label:"Allocated", value:String(cnt("allocated")), hint:n ? Math.round(cnt("allocated") / n * 100) + "% of the view" : "none", go:toAssets(ty, "allocated", {assetSvc:sv})},
        {label:"Available", value:String(cnt("available")), hint:"ready to allocate", go:toAssets(ty, "available", {assetSvc:sv})},
        {label:"Unavailable", value:String(cnt("unavailable")), tone:cnt("unavailable") ? "bad" : undefined, hint:"service or defect", go:toAssets(ty, "unavailable", {assetSvc:sv})},
        {label:"Average utilisation", value:pc0(avgUtil), hint:"mean of the assets in view", go:G(P, "overview")},
        {label:"Hours YTD", value:sumBy(list, a => a.hours).toLocaleString("en-IE"), hint:"engine hours across the view", go:G(P, "schedule")},
        {label:"Service due in 14 days", value:String(list.filter(dueSoon).length), tone:list.filter(dueSoon).length ? "warn" : undefined, hint:"in this view", go:toAssets(ty, st, {assetSvc:"14"})}]},
      {type:"grid", cols:"1fr 2fr", items:[
        statusDonut([
          {label:"Allocated", value:cnt("allocated"), text:String(cnt("allocated")), go:toAssets(ty, "allocated", {assetSvc:sv})},
          {label:"Available", value:cnt("available"), text:String(cnt("available")), color:"var(--ch4)", go:toAssets(ty, "available", {assetSvc:sv})},
          {label:"Unavailable", value:cnt("unavailable"), text:String(cnt("unavailable")), tone:"warn", go:toAssets(ty, "unavailable", {assetSvc:sv})}].filter(x => x.value > 0),
          {title:"Status in view", sub:ty === "all" ? "All asset types" : ty + " only", center:{value:String(n), label:"Assets"}}),
        {type:"chart", kind:"hbar", title:"Lowest utilisation in view", sub:"Assets with the most idle time. Click one to open it.", fmt:pc0, max:100,
          items:list.slice().sort((a, b) => a.util - b.util).slice(0, 7).map(a => ({label:a.id, sub:a.type + ", " + a.status, value:a.util, text:pc0(a.util), tone:a.util < 40 ? "warn" : undefined, go:G(P, "assets", a.id)}))}]},
      tbl("assets", "Assets", ["Asset","Type","Location","Status","Allocation","Utilisation","Hours YTD","Year","Next service"],
        list.map(a => ({id:a.id, onClick:select(a.id), cells:[
          {t:a.id, go:G(P, "assets", a.id), sub:a.name},
          a.type, locName(a.location), statusCell(a),
          a.alloc ? L(a.alloc, "Projects", "contracts", a.alloc) : (a.status === "available" ? pill("Free", "ok") : "-"),
          bar(pc0(a.util), a.util, a.util < 40 ? "warn" : undefined), String(a.hours), String(a.year),
          a.status === "unavailable" && a.next ? {t:fmtDate(a.serviceDate), sub:a.next} : fmtDate(a.serviceDate)]})),
        {search:true, size:12, num:[6, 7], note:n + " of " + fx.assets.length + " assets. Click a row for repair history and utilisation."})
    ];
    const a = sel ? fx.assets.find(x => x.id === sel) : null;
    if (a){
      const jobs = fx.jobcards.filter(j => j.asset === a.id), hires = fx.hires.filter(x => x.asset === a.id), defects = fx.defects.filter(d => d.asset === a.id);
      const series = utilSeries(a, idx[a.id]);
      const links = [];
      if (jobs.length) links.push({label:"Job card " + jobs[0].id, go:G("Garage", "jobs", jobs[0].id)});
      hires.forEach(x => links.push({label:"Hire order " + x.id, go:G(P, "hire", x.id)}));
      defects.forEach(d => links.push({label:"Defect " + d.id, go:G("Safety", "defects", d.id)}));
      if (a.alloc) links.push({label:"Contract " + a.alloc, go:G("Projects", "contracts", a.alloc)});
      links.push({label:"Allocation board", go:G(P, "schedule")});
      blocks.push(detail(a.id + " " + a.name, [
        ["Serviceability", a.status + (a.reason ? ": " + a.reason : "")],
        ["Location", locName(a.location)],
        ["Current allocation", a.alloc || "None"],
        ["Utilisation", pc0(a.util) + " (fleet average " + pc0(sumBy(fx.assets, x => x.util) / fx.assets.length) + ")"],
        ["Hours YTD", a.hours.toLocaleString("en-IE") + " h"],
        ["Year of manufacture", a.year],
        ["Net book value", eur(a.nbv)],
        ["Next service", fmtDate(a.serviceDate)],
        ...(a.status === "unavailable" && a.next ? [["Back in service", a.next]] : []),
        ["Repair history", jobs.length ? jobs.map(j => j.id + " (" + eur(jobCost(j)) + ")").join(", ") : "None open"],
        ["Repair cost (parts + labour, counted once)", eur(sumBy(jobs, jobCost))]],
        jobs.length ? [{label:"Open job card " + jobs[0].id, run:() => h.nav("Garage", "jobs", jobs[0].id), primary:true}] : [],
        {kicker:a.type, status:{t:a.status, tone:ST[a.status]}, sub:locName(a.location) + ", " + a.year, links,
          blocks:[
            {type:"chart", kind:"line", title:"Utilisation, January to September", sub:"Share of available days on a job or on hire", labels:MONTH_LABELS, series:[{name:"Utilisation", data:series}], fmt:pc0, h:170},
            ...(jobs.length ? [{type:"list", title:"Workshop history", items:jobs.map(j => ({title:j.id + " " + j.fault, sub:j.mech + ", " + j.downDays + " days down", right:eur(jobCost(j)), pill:{t:j.status, tone:ST[j.status]}, go:G("Garage", "jobs", j.id)}))}] : []),
            ...(hires.length ? [{type:"list", title:"Hire orders", items:hires.map(x => ({title:x.id + " " + shortName(x.customer), sub:fmtDate(x.from) + " to " + fmtDate(x.to), right:eur(hireValue(x)), pill:{t:x.status, tone:ST[x.status]}, go:G(P, "hire", x.id)}))}] : [])]}));
    }
    return out("Assets", blocks);
  }

  /* ───────── Schedule ───────── */
  if (sec === "schedule"){
    const ty = U("schedType", "all"), lc = U("schedLoc", "all");
    const days = [0, 1, 2, 3, 4, 5, 6].map(d => daysFrom(d));
    const dayLabels = days.map(d => fmtDate(d).slice(0, 6).trim());
    const hireOn = (a, d) => fx.hires.find(x => x.asset === a.id && d >= x.from && d <= x.to);
    const kindOf = (a, d) => { const ho = hireOn(a, d); if (ho) return a.status === "unavailable" ? "conflict" : "booked"; if (a.status === "unavailable") return "down"; if (a.status === "available") return "free"; return "booked"; };
    const rowsA = fx.assets.filter(a => (ty === "all" || a.type === ty) && (lc === "all" || a.location === lc));
    const tally = list => { const t = {booked:0, free:0, down:0, conflict:0}; list.forEach(a => days.forEach(d => { t[kindOf(a, d)]++; })); return t; };
    const all = tally(fx.assets), total = fx.assets.length * 7;
    const conflictOrders = fx.hires.filter(x => { const a = fx.assets.find(y => y.id === x.asset); return a && a.status === "unavailable" && x.to >= days[0] && x.from <= days[6]; }).length;
    const cell = (a, d) => { const ho = hireOn(a, d);
      if (ho) return pill(ho.id + (a.status === "unavailable" ? " conflict" : ""), a.status === "unavailable" ? "bad" : "");
      if (a.status === "unavailable") return pill("Down", "bad");
      if (a.status === "available") return pill("Free", "ok");
      return pill(a.alloc, "info"); };
    const ex22 = fx.assets.find(a => a.id === "EX-022");
    const ex22free = ex22.status === "available" && !fx.hires.some(x => x.asset === "EX-022" && x.id !== "HIRE-084" && x.from <= hire084.to && x.to >= hire084.from);
    const perDay = days.map(d => { const t = {booked:0, free:0, down:0}; fx.assets.forEach(a => { const kd = kindOf(a, d); t[kd === "conflict" ? "down" : kd]++; }); return t; });
    return out("Schedule", [
      {type:"kpis", min:190, items:[
        {label:"Booked asset-days, next 7 days", value:String(all.booked), hint:Math.round(all.booked / total * 100) + "% of " + total + " asset-days", go:toAssets("all", "allocated")},
        {label:"Free asset-days", value:String(all.free), hint:"available and unbooked", go:toAssets("all", "available")},
        {label:"Down asset-days", value:String(all.down + all.conflict), tone:"warn", hint:"service and defects", go:toAssets("all", "unavailable")},
        {label:"Allocation conflicts", value:String(conflictOrders), tone:conflictOrders ? "bad" : undefined, hint:conflictOrders ? "HIRE-084 is on a down asset" : "none in the next 7 days", go:G(P, "schedule")},
        {label:"External hire orders", value:String(fx.hires.length), hint:"in the board window", go:toHire()}]},
      chips("Type", "schedType", [["all", "All"]].concat(types.map(t => [t, t])), "all"),
      chips("Location", "schedLoc", [["all", "All"]].concat([...new Set(fx.assets.map(a => a.location))].map(t => [t, locName(t)])), "all"),
      conflict ? detail("Conflict: HIRE-084 needs EX-014", [
        ["Hire", "HIRE-084, 2 to 4 Oct, " + eur(hireValue(hire084)) + " net scheduled (not recognised lost revenue)"],
        ["Defect", "DEF-028"],
        ["Job card", "WO-0184, " + eur(jobCost(fx.jobcards[0])) + " internal"],
        ["EX-022", ex22free ? "Available and free for those dates" : "Not free"],
        ["EX-014", "Stays unavailable until a human workshop release and check are recorded"]],
        [{label:"Reassign HIRE-084 to EX-022", run:act("reassignHire"), disabled:!ex22free, primary:true}, {label:"Open WO-0184", run:() => h.nav("Garage", "jobs", "WO-0184")}, {label:"Open DEF-028", run:() => h.nav("Safety", "defects", "DEF-028")}], {noClose:true})
        : {type:"note", text:"HIRE-084 is now on EX-022 for 2 to 4 Oct. The hire order and schedule are updated."},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"stacked", title:"Fleet by day, next 7 days", sub:"Booked, free and down asset-days across the whole fleet", labels:dayLabels, h:230, fmt:v => String(Math.round(v)),
          series:[{name:"Booked", data:perDay.map(t => t.booked)}, {name:"Free", data:perDay.map(t => t.free), color:"var(--ch4)"}, {name:"Down", data:perDay.map(t => t.down), color:"var(--warn)"}],
          go:days.map(() => G(P, "schedule"))},
        {type:"progress", title:"Utilisation next 7 days by type", sub:"Booked asset-days against all asset-days. Click a type to open its assets.",
          items:types.map(t => { const l = fx.assets.filter(a => a.type === t), tt = tally(l), tot = l.length * 7, p = tt.booked / tot * 100;
            return {label:t, value:p, text:tt.booked + " of " + tot, tone:p < 50 ? "warn" : undefined, go:toAssets(t, "all")}; })}]},
      tbl("sched", "Allocation board, next 7 days", ["Asset"].concat(dayLabels), rowsA.map(a => ({cells:[{t:a.id, go:G(P, "assets", a.id), sub:a.type}].concat(days.map(d => cell(a, d)))})),
        {size:16, sort:false, note:"Grey pill = external hire order, blue pill = project allocation or free, red = down. Showing " + rowsA.length + " of " + fx.assets.length + " assets."})
    ]);
  }

  /* ───────── Hire orders ───────── */
  const hs = U("hireStatus", "all");
  const tot = hireTotals();
  const list = fx.hires.filter(x => hs === "all" || x.status === hs);
  const byCust = {}; fx.hires.forEach(x => { const n = shortName(x.customer); byCust[n] = (byCust[n] || 0) + hireValue(x); });
  const byType = {}; fx.hires.forEach(x => { const t = typeOf(x.asset); byType[t] = (byType[t] || 0) + hireValue(x); });
  const statuses = ["dispatched", "scheduled"].filter(s => fx.hires.some(x => x.status === s));
  const blocks = [
    {type:"actions", items:[{label:"Create sample hire (HIRE-085)", run:act("addHire"), disabled:!!fx.hires.find(x => x.id === "HIRE-085")}]},
    chips("Status", "hireStatus", [["all", "All"], ["dispatched", "Dispatched"], ["scheduled", "Scheduled"]], "all"),
    {type:"kpis", min:190, items:[
      {label:"Active hires", value:String(fx.hires.filter(x => x.status === "dispatched").length), hint:"dispatched and out on hire", go:toHire("dispatched")},
      {label:"Scheduled", value:String(fx.hires.filter(x => x.status === "scheduled").length), hint:eur(sumBy(fx.hires.filter(x => x.status === "scheduled"), hireValue)) + " net to dispatch", go:toHire("scheduled")},
      {label:"Order value", value:eur(tot.value), hint:"scheduled and dispatched orders, net", go:toHire()},
      {label:"Average rate per day", value:eur(tot.days ? tot.value / tot.days : 0), hint:"weighted over " + tot.days + " hire days", go:toHire()},
      {label:"Hire days", value:String(tot.days), hint:fx.hires.length + " orders", go:G(P, "schedule")},
      {label:"Hire revenue, September", value:eurC(HIST.hire[n9]), delta:delta(HIST.hire[n9], HIST.hire[n9 - 1], {label:"vs Aug"}), spark:HIST.hire, hint:"recognised, net", go:G("Finance", "reports")}]},
    {type:"grid", cols:"1fr 1fr 1fr", items:[
      {type:"chart", kind:"hbar", title:"Hire value by customer", sub:"Click a customer to open the account.", fmt:eurC,
        items:Object.keys(byCust).sort((a, b) => byCust[b] - byCust[a]).map(n => ({label:n, value:byCust[n], text:eurC(byCust[n]), sub:fx.hires.filter(x => shortName(x.customer) === n).length + " orders", go:G("Records", "clients", n)}))},
      statusDonut(statuses.map(s => ({label:cap(s), value:fx.hires.filter(x => x.status === s).length, text:String(fx.hires.filter(x => x.status === s).length), go:toHire(s)})),
        {title:"Orders by status", sub:"Click a slice to filter the table", center:{value:String(fx.hires.length), label:"Orders"}}),
      {type:"chart", kind:"hbar", title:"Hire value by asset type", sub:"Click a type to open its assets.", fmt:eurC,
        items:Object.keys(byType).sort((a, b) => byType[b] - byType[a]).map(t => ({label:t, value:byType[t], text:eurC(byType[t]), go:toAssets(t, "all")}))}]},
    tbl("hires", "External hire orders", ["Order","Customer","Asset","Dates","Days","Rate / day","Value","Status","Invoice"],
      list.map(x => ({id:x.id, onClick:select(x.id), cells:[
        {t:x.id, go:G(P, "hire", x.id), sub:typeOf(x.asset)},
        L(shortName(x.customer), "Records", "clients", shortName(x.customer)),
        L(x.asset, P, "assets", x.asset), fmtDate(x.from) + " to " + fmtDate(x.to), String(hireDays(x)), eur(x.rate), eur(hireValue(x)), badge(x.status),
        x.invoice && x.invoice !== "-" ? L(x.invoice, "Finance", "invoices", x.invoice) : "-"]})),
      {search:true, num:[4, 5, 6], note:list.length + " of " + fx.hires.length + " orders. Value is net scheduled hire."})
  ];
  const x = sel ? fx.hires.find(y => y.id === sel) : null;
  if (x){
    const a = fx.assets.find(y => y.id === x.asset), days = hireDays(x), done = Math.max(0, Math.min(days, Math.round((Date.parse(TODAY) - Date.parse(x.from)) / 86400000) + 1));
    const cust = shortName(x.customer), isDown = a && a.status === "unavailable";
    const links = [{label:"Asset " + x.asset, go:G(P, "assets", x.asset)}, {label:"Customer " + cust, go:G("Records", "clients", cust)}, {label:"Allocation board", go:G(P, "schedule")}];
    if (x.invoice && x.invoice !== "-") links.push({label:"Invoice " + x.invoice, go:G("Finance", "invoices", x.invoice)});
    blocks.push(detail(x.id + " " + cust, [
      ["Customer", cust], ["Asset", x.asset + (a ? " (" + a.type + ")" : "")],
      ["Dates", fmtDate(x.from) + " to " + fmtDate(x.to) + ", " + days + " days"],
      ["Rate", eur(x.rate) + " per day"],
      ["Estimated value (net)", eur(hireValue(x))],
      ["Asset check", isDown ? "Asset is unavailable (" + a.reason + "). Reassign before dispatch." : "Asset is serviceable"],
      ["Invoice", x.invoice && x.invoice !== "-" ? x.invoice : "Not yet invoiced"],
      ["Type", "External hire (not an internal project allocation)"]],
      isDown && x.id === "HIRE-084" ? [{label:"Open schedule to reassign", run:() => h.nav(P, "schedule"), primary:true}] : [],
      {kicker:"Hire order", status:{t:x.status, tone:ST[x.status]}, sub:eur(hireValue(x)) + " net", links,
        blocks:[{type:"progress", title:"Hire period", items:[{label:fmtDate(x.from) + " to " + fmtDate(x.to), value:days ? done / days * 100 : 0, text:done + " of " + days + " days", tone:isDown ? "bad" : undefined}]}]}));
  }
  return out("Hire Orders", blocks);
}
