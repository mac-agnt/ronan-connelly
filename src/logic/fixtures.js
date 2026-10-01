/* Shared demo fixture store for the Civil Engineering & Plant demo.
   Every number shown in the business modules is derived from this store.
   All records are illustrative. Demo clock: 1 October 2026, 09:00, Europe/Dublin. */

export const ORG = {
  name: "Civil Engineering & Plant",
  subtitle: "Demo prepared for Ronan Conneely",
  location: "County Mayo, Ireland",
  logo: "CE", domain: "", // unverified: substitute once confirmed
  accents: {primary:"#5B82BF", secondary:"#24364B", highlight:"#638CCA"}
};
export const CLOCK = {label:"1 Oct 2026", iso:"2026-10-01T09:00:00+01:00"};
export const COST_RATE = 28;      // demo labour cost, EUR per hour
export const WORKSHOP_RATE = 60;  // internal workshop cost rate, EUR per hour
const KEY = "ce-plant-demo-v1";

const FIRST = ["Declan","Cian","Oisín","Pádraig","Ciarán","Colm","Ruairí","Tadhg","Fergal","Brendan","Cathal","Darragh","Enda","Gearóid","Kevin","Mícheál","Noel","Seamus","Tomás","Vincent","Aoife","Bríd","Caoimhe","Deirdre","Éilis","Gráinne","Orla","Sinéad","Róisín","Maeve"];
const LAST = ["Gallagher","Heneghan","Durkan","Gaughan","Loftus","Moran","Murphy","Mulloy","Nolan","Reilly","Ruane","Tierney","Walsh","Higgins","Hughes","Kelly","Lally","McNulty","Prendergast","Staunton"];

function seedEmployees(){
  const feat = [
    ["E-001","Ronan Conneely","Financial Controller","Finance","Office","Confirmed client employee"],
    ["E-002","Aisling Walsh","Operations Manager","Operations","Office","Demo profile"],
    ["E-003","Eoin Burke","Contracts Manager","Contracts","Office","Demo profile"],
    ["E-004","Niamh Kelly","Accounts Administrator","Finance","Office","Demo profile"],
    ["E-005","Patrick Moran","Plant Coordinator","Plant & Hire","Office","Demo profile"],
    ["E-006","Seán Duffy","Workshop Manager","Garage","Field","Demo profile"],
    ["E-007","Fiona McHale","Safety Coordinator","Safety","Office","Demo profile"],
    ["E-008","Liam Joyce","Site Supervisor","Contracts","Field","Demo profile"]
  ].map(r => ({id:r[0], name:r[1], role:r[2], dept:r[3], group:r[4], note:r[5], supervisor: r[0]==="E-001" ? "-" : "Aisling Walsh"}));
  const out = feat.slice();
  const officeRoles = [["Estimator","Contracts"],["Accounts Assistant","Finance"],["Document Controller","Contracts"],["Procurement Clerk","Finance"],["Planner","Operations"],["Admin Assistant","Operations"]];
  for (let i = 0; i < 12; i++){
    const r = officeRoles[i % officeRoles.length];
    out.push({id:"E-" + String(9 + i).padStart(3,"0"), name:FIRST[(i*7)%30] + " " + LAST[(i*3)%20], role:r[0], dept:r[1], group:"Office", note:"Demo profile", supervisor:"Aisling Walsh"});
  }
  const fieldRoles = [["Plant Operator","Plant & Hire"],["General Operative","Contracts"],["Pipelayer","Contracts"],["Driver","Plant & Hire"],["Mechanic","Garage"],["Ganger","Contracts"],["Steel Fixer","Contracts"]];
  for (let i = 0; i < 92; i++){
    const r = fieldRoles[i % fieldRoles.length];
    out.push({id:"E-" + String(21 + i).padStart(3,"0"), name:FIRST[(i*11+3)%30] + " " + LAST[(i*5+1)%20], role:r[0], dept:r[1], group:"Field", note:"Demo profile", supervisor: r[1]==="Garage" ? "Seán Duffy" : "Liam Joyce"});
  }
  return out;
}

const CONTRACTS = [
  ["PRJ-021","Castlebar Surface Water Upgrade (demo project)","Connacht Infrastructure",610000,"Eoin Burke",14.2,64,"2026-03-02","2027-01-29"],
  ["PRJ-022","Ballina Road Resurfacing (demo project)","Mayo Roads Programme",385000,"Eoin Burke",17.1,81,"2026-05-11","2026-11-27"],
  ["PRJ-023","Westport Substation Groundworks (demo project)","ESB (demo record)",540000,"Aisling Walsh",19.4,47,"2026-06-01","2027-02-19"],
  ["PRJ-024","Claremorris Rail Embankment (demo project)","Irish Rail (demo record)",720000,"Eoin Burke",15.8,58,"2026-04-13","2027-03-12"],
  ["PRJ-025","Swinford Watermain Extension (demo project)","Western Utilities Delivery",298000,"Aisling Walsh",11.3,72,"2026-04-27","2026-12-18"],
  ["PRJ-026","Belmullet Coastal Access Road (demo project)","Mayo Roads Programme",455000,"Eoin Burke",18.6,33,"2026-07-20","2027-04-30"],
  ["PRJ-027","Mayo Water Network Renewal (demo project)","Western Utilities Delivery",420000,"Eoin Burke",null,66,"2026-02-09","2026-12-11"],
  ["PRJ-028","Kiltimagh Drainage Works (demo project)","Connacht Infrastructure",330000,"Aisling Walsh",16.0,39,"2026-08-03","2027-01-15"]
].map(r => ({id:r[0], name:r[1], client:r[2], value:r[3], mgr:r[4], marginPct:r[5], progress:r[6], start:r[7], end:r[8]}));

const CATS = [["labour","LAB"],["materials","MAT"],["plant","PLT"],["subcontract","SUB"]];
const MONTHS = ["2026-07","2026-08","2026-09"];
function seedCosts(){
  const rows = [];
  let n = 1;
  const push = (contract, category, code, status, amount, extra) => rows.push(Object.assign({id:"C-" + String(n++).padStart(4,"0"), contract, category, code, status, amount, asset:"", month: status === "posted" ? MONTHS[n % 3] : "Forward", source:"QuickBooks Online sample data", overlay:false}, extra || {}));
  CONTRACTS.forEach(c => {
    if (c.id === "PRJ-027"){
      // posted 278,000 = labour 96,000 + materials 74,000 + plant 62,000 (incl. 1,850 repair) + subcontract 46,000
      push(c.id,"labour","LAB","posted",52000); push(c.id,"labour","LAB","posted",44000,{source:"Spreadsheet import"});
      push(c.id,"materials","MAT","posted",41000); push(c.id,"materials","MAT","posted",33000);
      push(c.id,"plant","PLT","posted",36150,{asset:"EX-022"}); push(c.id,"plant","PLT","posted",24000,{asset:"DU-006"});
      push(c.id,"plant","PLT-REP","posted",1850,{asset:"EX-014",source:"Pulse-created demo record"});
      push(c.id,"subcontract","SUB","posted",46000);
      // commitments 52,000
      push(c.id,"materials","MAT","committed",20000); push(c.id,"subcontract","SUB","committed",32000);
      // further estimate 58,000
      push(c.id,"labour","LAB","estimate",30000); push(c.id,"plant","PLT","estimate",14000,{asset:"EX-022"}); push(c.id,"materials","MAT","estimate",14000);
      return;
    }
    const forecast = c.value * (1 - c.marginPct / 100);
    const shares = {posted:0.62, committed:0.15, estimate:0.23}, cat = [0.30,0.28,0.22,0.20];
    ["posted","committed","estimate"].forEach(st => {
      let rem = Math.round(forecast * shares[st] / 100) * 100;
      CATS.forEach((cc, i) => {
        const amt = i === 3 ? rem : Math.round(forecast * shares[st] * cat[i] / 100) * 100;
        rem -= amt;
        push(c.id, cc[0], cc[1], st, amt, cc[0] === "plant" ? {asset:["EX-012","DU-004","RL-003","LD-002"][n % 4]} : {});
      });
    });
  });
  return rows;
}

function seedAssets(){
  const defs = [["EX","Excavator",16,9],["DU","Dumper",10,1],["RL","Roller",6,1],["LD","Loader",6,1],["TH","Telehandler",4,1],["VN","Van",6,1]];
  const locs = ["Main yard (demo location)","Workshop (demo location)","Site compound (demo location)"];
  const out = [];
  defs.forEach(d => { for (let i = 0; i < d[2]; i++){
    const num = d[3] + i, id = d[0] + "-" + String(num).padStart(3,"0");
    out.push({id, type:d[1], name: d[1] + " " + id, location: locs[out.length % 3], status:"allocated", reason:"", alloc:"", next:"" });
  }});
  const find = id => out.find(a => a.id === id);
  // six unavailable: 4 planned service, 2 defect
  ["EX-017","DU-003","RL-002","LD-004"].forEach((id,i) => { const a = find(id); a.status = "unavailable"; a.reason = "planned service"; a.next = "Back " + (3 + i) + " Oct"; });
  const e14 = find("EX-014"); e14.status = "unavailable"; e14.reason = "defect DEF-028"; e14.name = "14-tonne excavator EX-014";
  const t = find("TH-004"); t.status = "unavailable"; t.reason = "defect DEF-029";
  // eight available incl. EX-022
  ["EX-022","DU-007","DU-009","RL-005","LD-006","TH-002","VN-002","VN-005"].forEach(id => { find(id).status = "available"; });
  find("EX-022").name = "14-tonne excavator EX-022";
  const projs = CONTRACTS.map(c => c.id);
  out.forEach((a, i) => { if (a.status === "allocated"){ a.alloc = projs[i % 8]; } a.next = a.next || "Service due " + (10 + (i * 3) % 18) + " Nov"; });
  return out;
}

function seedHires(){
  return [
    {id:"HIRE-080", customer:"Connacht Infrastructure (demo client)", asset:"DU-005", from:"2026-09-28", to:"2026-10-09", rate:260, status:"dispatched", invoice:"INV-1055"},
    {id:"HIRE-081", customer:"Mayo Roads Programme (demo client)", asset:"RL-004", from:"2026-09-30", to:"2026-10-06", rate:310, status:"dispatched", invoice:"INV-1056"},
    {id:"HIRE-082", customer:"Western Utilities Delivery (demo client)", asset:"LD-003", from:"2026-10-01", to:"2026-10-05", rate:340, status:"dispatched", invoice:"INV-1060"},
    {id:"HIRE-083", customer:"Connacht Infrastructure (demo client)", asset:"EX-011", from:"2026-10-01", to:"2026-10-07", rate:420, status:"dispatched", invoice:"-"},
    {id:"HIRE-084", customer:"Mayo Roads Programme (demo client)", asset:"EX-014", from:"2026-10-02", to:"2026-10-04", rate:420, status:"scheduled", invoice:"-"}
  ];
}

function seedParts(){
  const kinds = ["Hydraulic filter","Fuel filter","Air filter","Oil filter","Track pad","Bucket tooth","Hydraulic hose","Grease cartridge","Fan belt","Alternator","Starter motor","LED work lamp","Coolant 20L","Seal kit","Pin and bush","Wiper blade"];
  const sup = ["West Coast Industrial Supplies (demo supplier)","Atlantic Plant Parts (demo supplier)","Shannon Hydraulics (demo supplier)"];
  const out = [{sku:"HF-220", desc:"Hydraulic filter, 14t excavator", onHand:2, reserved:0, min:6, bin:"A-04-2", supplier:sup[0], cost:48}];
  for (let i = 1; i < 120; i++){
    const k = kinds[i % kinds.length];
    const min = 4 + (i % 5) * 2, onHand = (i % 11 === 0) ? Math.max(0, min - 2) : min + 3 + (i * 7) % 18;
    out.push({sku:"P-" + String(100 + i), desc:k + " type " + (1 + i % 9), onHand, reserved: i % 7 === 0 ? 1 : 0, min, bin:"B-" + String(1 + i % 12).padStart(2,"0") + "-" + (1 + i % 4), supplier:sup[i % 3], cost: 12 + (i * 17) % 160});
  }
  return out;
}

function seedJobCards(){
  const st = ["waiting assessment","awaiting parts","in progress","ready for review"];
  const list = [{id:"WO-0184", asset:"EX-014", fault:"Hydraulic leak at boom cylinder (DEF-028)", mech:"Seán Duffy", status:"awaiting parts", urgent:true, partsCost:1250, hours:10, release:false, check:false, downDays:3}];
  const faults = ["Brake wear","Track tension","Electrical fault","Cab heater","Steering play","Greasing and inspection","Tyre replacement","Hydraulic hose weep","Engine light on","Bucket pin wear","Coolant top-up leak"];
  const assets = ["TH-004","EX-017","DU-003","RL-002","LD-004","EX-012","DU-004","VN-001","LD-002","EX-010","DU-008"];
  for (let i = 0; i < 11; i++) list.push({id:"WO-" + (173 + i).toString().padStart(4,"0"), asset:assets[i], fault:faults[i], mech:["Seán Duffy","Declan Moran","Colm Reilly"][i % 3], status:st[i % 4], urgent:i === 0, partsCost:120 + (i * 90) % 700, hours:2 + i % 6, release:false, check:false, downDays:1 + i % 4});
  return list;
}

function seedInvoices(){
  const overdue = [[42600,"Western Utilities Delivery (demo client)",42,"INV-1048","PRJ-027"],
    [18400,"Connacht Infrastructure (demo client)",35,"INV-1041","PRJ-021"],[16200,"Mayo Roads Programme (demo client)",28,"INV-1043","PRJ-022"],
    [15100,"Western Utilities Delivery (demo client)",51,"INV-1036","PRJ-025"],[14900,"Connacht Infrastructure (demo client)",19,"INV-1046","PRJ-028"],
    [13800,"Mayo Roads Programme (demo client)",66,"INV-1029","PRJ-026"],[12600,"ESB (demo record)",12,"INV-1050","PRJ-023"],
    [11500,"Irish Rail (demo record)",24,"INV-1044","PRJ-024"],[9800,"Western Utilities Delivery (demo client)",47,"INV-1039","PRJ-025"],
    [7900,"Connacht Infrastructure (demo client)",8,"INV-1052","PRJ-021"],[5600,"Mayo Roads Programme (demo client)",15,"INV-1049","PRJ-022"]];
  const notDue = [24000,21500,19800,18200,17600,16400,15300,14100,13500,12800,11900,10600,9700,8900,8100,7400,6600,5800,5200,4500];
  const clients = ["Connacht Infrastructure (demo client)","Mayo Roads Programme (demo client)","Western Utilities Delivery (demo client)","ESB (demo record)","Irish Rail (demo record)"];
  const out = overdue.map(o => ({id:o[3], client:o[1], contract:o[4], amount:o[0], due:daysFrom(-o[2]), overdueDays:o[2], status:"overdue", source:"QuickBooks Online sample data"}));
  const rest = 428600 - 168400 - notDue.reduce((a,b) => a + b, 0);
  notDue.concat([rest]).forEach((amt, i) => out.push({id:"INV-" + (1053 + i), client:clients[i % 5], contract:CONTRACTS[(i * 3) % 8].id, amount:amt, due:daysFrom(3 + (i * 4) % 70), overdueDays:0, status:"unpaid", source:"QuickBooks Online sample data"}));
  return out;
}
export function daysFrom(n){ const d = new Date(Date.UTC(2026,9,1) + n * 86400000); return d.toISOString().slice(0,10); }
export function fmtDate(iso){ const d = new Date(iso + "T00:00:00Z"); return d.getUTCDate() + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear(); }

export function seed(){
  const employees = seedEmployees();
  const missing = employees.filter(e => e.group === "Field" && e.id !== "E-006" && e.id !== "E-008").slice(0, 14).map(e => e.id);
  return {
    employees,
    contracts: CONTRACTS,
    costs: seedCosts(),
    variations: [
      {id:"VAR-006", contract:"PRJ-023", title:"Additional cable duct bank", amount:14100, status:"approved", cost:9800, submitted:"2026-08-12", owner:"Aisling Walsh", next:"Include in contract value"},
      {id:"VAR-007", contract:"PRJ-024", title:"Embankment drainage revision", amount:22400, status:"approved", cost:16100, submitted:"2026-07-30", owner:"Eoin Burke", next:"Invoice with next valuation"},
      {id:"VAR-008", contract:"PRJ-021", title:"Out-of-scope rock breaking", amount:9600, status:"rejected", cost:7200, submitted:"2026-08-20", owner:"Eoin Burke", next:"Review decision with client"},
      {id:"VAR-009", contract:"PRJ-027", title:"Unforeseen service diversion at chainage 420", amount:18750, status:"pending", cost:11200, submitted:"2026-09-24", owner:"Eoin Burke", next:"Prepare submission", evidence:"Site instruction SI-014 and 6 evidence photos", drafted:false},
      {id:"VAR-010", contract:"PRJ-025", title:"Extra valve chamber", amount:7300, status:"pending", cost:5100, submitted:"2026-09-28", owner:"Aisling Walsh", next:"Awaiting client response"}
    ],
    opportunities: [
      {id:"OPP-101", name:"Framework enquiry: regional water mains (demo)", client:"Western Utilities Delivery", stage:"enquiry", value:1800000, next:"Send capability statement", owner:"Eoin Burke", note:"Meeting note MN-0912 filed. Evidence requirements: safety pack, plant register, insurance certificates."},
      {id:"OPP-102", name:"Ballina bypass drainage (demo)", client:"Mayo Roads Programme", stage:"tender", value:640000, next:"Complete tender pricing", owner:"Eoin Burke", note:""},
      {id:"OPP-103", name:"Rail culvert replacement (demo)", client:"Irish Rail (demo record)", stage:"review", value:910000, next:"Clarify programme with client", owner:"Aisling Walsh", note:""},
      {id:"OPP-104", name:"Substation access roads (demo)", client:"ESB (demo record)", stage:"tender", value:380000, next:"Site visit Friday", owner:"Aisling Walsh", note:""},
      {id:"OPP-105", name:"Town centre surface water (demo)", client:"Connacht Infrastructure", stage:"awarded", value:520000, next:"Mobilisation plan", owner:"Eoin Burke", note:""},
      {id:"OPP-106", name:"Plant hire framework renewal (demo)", client:"Mayo Roads Programme", stage:"enquiry", value:260000, next:"Agree rate card", owner:"Patrick Moran", note:""}
    ],
    assets: seedAssets(),
    hires: seedHires(),
    jobcards: seedJobCards(),
    parts: seedParts(),
    movements: [{when:"2026-09-26", sku:"HF-220", kind:"issue", qty:-2, ref:"WO-0176"},{when:"2026-09-18", sku:"HF-220", kind:"issue", qty:-3, ref:"WO-0171"}],
    pos: [],
    payables: [
      {id:"SI-2201", supplier:"West Coast Industrial Supplies (demo supplier)", po:"PO-0412", amount:3860, cost:"PLT-REP", contract:"PRJ-027", match:"matched"},
      {id:"SI-2202", supplier:"Atlantic Plant Parts (demo supplier)", po:"PO-0409", amount:1240, cost:"MAT", contract:"PRJ-024", match:"matched"},
      {id:"SI-2203", supplier:"Shannon Hydraulics (demo supplier)", po:"PO-0415", amount:5420, cost:"PLT-REP", contract:"PRJ-021", match:"exception: price differs from PO"},
      {id:"SI-2204", supplier:"Mayo Aggregates (demo supplier)", po:"PO-0401", amount:18200, cost:"MAT", contract:"PRJ-027", match:"matched"},
      {id:"SI-2205", supplier:"Mayo Aggregates (demo supplier)", po:"PO-0418", amount:9650, cost:"MAT", contract:"PRJ-022", match:"exception: no receipt recorded"},
      {id:"SI-2206", supplier:"Western Pipe Supplies (demo supplier)", po:"PO-0407", amount:22800, cost:"MAT", contract:"PRJ-025", match:"matched"}
    ],
    invoices: seedInvoices(),
    sampleTax: {lines:[
      {desc:"Workshop labour, 6.0 h", net:360, code:"T1"},
      {desc:"Replacement parts (sample)", net:540, code:"T2"},
      {desc:"Call-out fee (sample)", net:85, code:"T1"}]},
    taxCodes: {T1:{label:"Demo code T1", rate:13.5}, T2:{label:"Demo code T2", rate:23}},
    timesheets: missing.map(id => ({emp:id, hrs:0, status:"missing", by:"", est:8})),
    paper: {state:"pending", fields:[
      {k:"Employee", v:"Declan Moran", conf:0.96},{k:"Date", v:"30 Sep 2026", conf:0.93},{k:"Contract", v:"PRJ-027", conf:0.88},{k:"Hours", v:"8.5", conf:0.61, ambiguous:true}]},
    checks: seedChecks(),
    defects: [
      {id:"DEF-028", asset:"EX-014", severity:"high", owner:"Seán Duffy", reported:"2026-09-30 16:20", restriction:"Do not operate", job:"WO-0184"},
      {id:"DEF-029", asset:"TH-004", severity:"medium", owner:"Seán Duffy", reported:"2026-09-29 08:05", restriction:"Do not operate", job:"WO-0180"},
      {id:"DEF-030", asset:"DU-008", severity:"low", owner:"Seán Duffy", reported:"2026-09-30 07:40", restriction:"Operate with care", job:"WO-0183"}],
    evidence: seedEvidence(),
    pack: {id:"SAFE-031", contract:"PRJ-027", state:"incomplete", items: seedPackItems()},
    reminders: {"INV-1048":"none"},
    release: {},
    tasks: [],
    events: [{at:"1 Oct 2026, 08:00", who:"Pulse", text:"Demo snapshot loaded"}]
  };
}

function seedChecks(){
  const st = ["reviewed","submitted","reviewed","scheduled","failed","reviewed","missing","submitted","reviewed","reviewed","scheduled","missing"];
  const ops = ["Declan Moran","Colm Reilly","Brendan Higgins","Tadhg Walsh"];
  return st.map((s, i) => ({id:"CHK-" + (301 + i), asset: ["EX-011","DU-005","EX-014","RL-004","TH-004","LD-003","EX-012","DU-004","VN-001","EX-022","DU-007","LD-002"][i], site:["Main yard (demo location)","Site compound (demo location)"][i % 2], operator:ops[i % 4], at:"2026-10-01 0" + (6 + i % 3) + ":" + (10 + i * 4) + "", status:s, source:"Flex sample data"}));
}
function seedEvidence(){
  const kinds = [["Site induction register","Contract"],["Method statement","Contract"],["Plant inspection certificate","Asset"],["Operator competence cards","Contract"],["Insurance certificate","Contract"],["Lifting equipment thorough exam","Asset"]];
  const out = [];
  for (let i = 0; i < 18; i++){ const k = kinds[i % 6]; out.push({id:"EV-" + (201 + i), title:k[0] + (i > 5 ? " (" + (1 + Math.floor(i / 6)) + ")" : ""), group: k[1] === "Asset" ? ["EX-011","EX-012","DU-004"][i % 3] : CONTRACTS[i % 8].id, status: i % 5 === 3 ? "awaiting review" : "reviewed", expiry: daysFrom(20 + i * 17), source: i % 2 ? "Flex sample data" : "Server documents"}); }
  return out;
}
function seedPackItems(){
  const rows = ["Site induction register","Method statement and risk assessment","Operator competence cards","Insurance certificates","Plant register extract","Daily walk-around checks, last 30 days","Lifting equipment thorough examination","Traffic management plan"].map(t => ({t, state:"reviewed", ev:"EV-" + (201 + Math.floor(Math.random()*0)), }));
  rows.push({t:"Reviewed site inspection record", state:"missing", ev:""});
  rows.push({t:"Asset inspection certificate (EX-022)", state:"missing", ev:""});
  return rows.map((r,i) => ({...r, ev: r.state === "missing" ? "" : "EV-" + (201 + i)}));
}

/* ── persistence ── */
export function loadFx(){
  try { const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY); if (raw){ const f = JSON.parse(raw); if (f && f.v === 1) return f.fx; } } catch(e) {}
  return seed();
}
export function saveFx(fx){ try { localStorage.setItem(KEY, JSON.stringify({v:1, fx})); } catch(e) {} }
export function clearFx(){ try { localStorage.removeItem(KEY); } catch(e) {} }

/* ── derived values ── */
export const eur = n => (n < 0 ? "-€" : "€") + Math.abs(Math.round(n)).toLocaleString("en-IE");
export const pct = n => (Math.round(n * 10) / 10).toFixed(1) + "%";
export function contractFin(fx, id){
  const c = fx.contracts.find(x => x.id === id);
  const sum = st => fx.costs.filter(r => r.contract === id && !r.overlay && r.status === st).reduce((a, r) => a + r.amount, 0);
  const posted = sum("posted"), committed = sum("committed"), estimate = sum("estimate");
  const overlay = fx.costs.filter(r => r.contract === id && r.overlay).reduce((a, r) => a + r.amount, 0);
  const forecast = posted + committed + estimate;
  const margin = c.value - forecast;
  const pending = fx.variations.filter(v => v.contract === id && v.status === "pending").reduce((a, v) => a + v.amount, 0);
  return {c, posted, committed, estimate, overlay, forecast, margin, marginPct: margin / c.value * 100, pending};
}
export function assetStatus(fx){
  const a = fx.assets;
  return {total:a.length, allocated:a.filter(x => x.status === "allocated").length, available:a.filter(x => x.status === "available").length,
    unavailable:a.filter(x => x.status === "unavailable").length,
    service:a.filter(x => x.status === "unavailable" && x.reason === "planned service").length,
    defect:a.filter(x => x.status === "unavailable" && x.reason.indexOf("defect") === 0).length};
}
export function hireDays(h){ return Math.round((Date.parse(h.to) - Date.parse(h.from)) / 86400000) + 1; }
export function hireValue(h){ return hireDays(h) * h.rate; }
export function jobCost(j){ return j.partsCost + j.hours * WORKSHOP_RATE; }
export function partAvail(p){ return p.onHand - p.reserved; }
export function missingStats(fx){
  const missing = fx.timesheets.filter(t => t.status === "missing").length;
  return {expected:94, received:80 + fx.timesheets.length - missing, missing, estHours:missing * 8, estCost:missing * 8 * COST_RATE};
}
export function receivables(fx){
  const unpaid = fx.invoices.filter(i => i.status !== "paid"), over = unpaid.filter(i => i.status === "overdue");
  return {count:unpaid.length, total:unpaid.reduce((a,i) => a + i.amount, 0), overCount:over.length, overTotal:over.reduce((a,i) => a + i.amount, 0)};
}
export function packProgress(p){ const done = p.items.filter(i => i.state === "reviewed").length; return {done, total:p.items.length}; }
export function logEvent(fx, who, text){ fx.events.unshift({at:CLOCK.label + ", " + new Date().toTimeString().slice(0,5), who, text}); }

/* ── actions: (fx, payload) => fx. Deep-cloned so React state stays immutable. ── */
const clone = o => JSON.parse(JSON.stringify(o));
export const ACTIONS = {
  enterHours(fx, p){ const t = fx.timesheets.find(x => x.emp === p.emp); if (t.status === "approved") return fx;
    t.hrs = p.hrs; t.status = "entered"; t.by = p.by || "Liam Joyce (supervisor)"; logEvent(fx, t.by, "Entered " + p.hrs + "h for " + nameOf(fx, p.emp)); return fx; },
  approveTimesheet(fx, p){ const t = fx.timesheets.find(x => x.emp === p.emp); if (!t || t.status !== "entered") return fx;
    t.status = "approved";
    fx.costs.push({id:"C-TS-" + p.emp, contract:"PRJ-027", category:"labour", code:"LAB", status:"posted", amount:t.hrs * COST_RATE, asset:"", month:"2026-09", source:"Pulse-created demo record", overlay:true});
    logEvent(fx, "Ronan Conneely", "Approved " + t.hrs + "h for " + nameOf(fx, p.emp) + "; " + eur(t.hrs * COST_RATE) + " posted to PRJ-027 (once)"); return fx; },
  remindMissing(fx){ logEvent(fx, "Pulse", "Simulated reminder to " + fx.timesheets.filter(t => t.status === "missing").length + " workers (no message sent)"); return fx; },
  approvePaper(fx, p){ fx.paper.state = "approved"; fx.paper.fields.forEach(f => { if (p && p.edits && p.edits[f.k]) f.v = p.edits[f.k]; });
    logEvent(fx, "Ronan Conneely", "Approved extracted paper timesheet (simulated extraction)"); return fx; },
  draftReminder(fx){ fx.reminders["INV-1048"] = "drafted"; logEvent(fx, "Niamh Kelly", "Drafted reminder for INV-1048 (not sent)"); return fx; },
  approveReminder(fx){ if (fx.reminders["INV-1048"] !== "drafted") return fx; fx.reminders["INV-1048"] = "approved"; logEvent(fx, "Ronan Conneely", "Approved reminder for INV-1048 (simulated, nothing sent; invoice still unpaid)"); return fx; },
  reassignHire(fx){ const h = fx.hires.find(x => x.id === "HIRE-084"); if (h.asset === "EX-022") return fx; h.asset = "EX-022";
    logEvent(fx, "Patrick Moran", "Reassigned HIRE-084 from EX-014 to EX-022"); return fx; },
  addHire(fx){ if (fx.hires.find(h => h.id === "HIRE-085")) return fx; fx.hires.push({id:"HIRE-085", customer:"Western Utilities Delivery (demo client)", asset:"DU-007", from:"2026-10-05", to:"2026-10-07", rate:260, status:"scheduled", invoice:"-"});
    logEvent(fx, "Patrick Moran", "Created HIRE-085 on DU-007"); return fx; },
  releaseJob(fx){ const j = fx.jobcards.find(x => x.id === "WO-0184"); j.release = true; logEvent(fx, "Seán Duffy", "Recorded workshop release on WO-0184"); return maybeFree(fx); },
  recordCheck(fx){ const j = fx.jobcards.find(x => x.id === "WO-0184"); j.check = true; logEvent(fx, "Fiona McHale", "Recorded post-repair check on EX-014"); return maybeFree(fx); },
  draftPO(fx){ if (fx.pos.length) return fx; fx.pos.push({id:"PO-0420", sku:"HF-220", qty:10, unit:48, supplier:"West Coast Industrial Supplies (demo supplier)", state:"draft"}); logEvent(fx, "Seán Duffy", "Drafted PO-0420 for 10 x HF-220 (€480)"); return fx; },
  advancePO(fx){ const po = fx.pos[0]; if (!po) return fx;
    if (po.state === "draft"){ po.state = "approved"; logEvent(fx, "Ronan Conneely", "Approved PO-0420 (demo); stock unchanged"); }
    else if (po.state === "approved"){ po.state = "ordered"; logEvent(fx, "Seán Duffy", "PO-0420 marked ordered (simulated)"); }
    else if (po.state === "ordered"){ po.state = "received"; const p = fx.parts.find(x => x.sku === "HF-220"); p.onHand += po.qty;
      fx.movements.unshift({when:"2026-10-01", sku:"HF-220", kind:"receipt", qty:po.qty, ref:po.id}); logEvent(fx, "Seán Duffy", "Received PO-0420; HF-220 stock now " + p.onHand); }
    return fx; },
  draftVariation(fx){ const v = fx.variations.find(x => x.id === "VAR-009"); if (v.drafted) return fx; v.drafted = true; v.next = "Draft ready for approval";
    logEvent(fx, "Eoin Burke", "Prepared draft submission for VAR-009 and approval task"); return fx; },
  approveVariationDraft(fx){ const v = fx.variations.find(x => x.id === "VAR-009"); if (!v.drafted || v.sent) return fx; v.sent = true; v.next = "Submitted to client (simulated); status still pending";
    logEvent(fx, "Ronan Conneely", "Approved VAR-009 submission draft (simulated, not sent)"); return fx; },
  attachEvidence(fx, p){ const it = fx.pack.items[p.i]; if (it.state !== "missing") return fx; it.state = "attached"; it.ev = p.i === 8 ? "EV-SAMPLE-01" : "EV-SAMPLE-02"; logEvent(fx, "Fiona McHale", "Attached sample evidence to: " + it.t); return fx; },
  reviewEvidence(fx, p){ const it = fx.pack.items[p.i]; if (it.state !== "attached") return fx; it.state = "reviewed"; logEvent(fx, "Fiona McHale", "Reviewed: " + it.t); if (fx.pack.items.every(i => i.state === "reviewed")) fx.pack.state = "ready"; return fx; },
  approvePack(fx){ if (fx.pack.state !== "ready") return fx; fx.pack.state = "approved"; logEvent(fx, "Ronan Conneely", "Approved SAFE-031 for release (authorised human)"); return fx; },
  addTask(fx, p){ fx.tasks.unshift({id:"T-" + (fx.tasks.length + 1), title:p.title, owner:p.owner || "Ronan Conneely", related:p.related || ""}); logEvent(fx, "Pulse", "Created task: " + p.title); return fx; }
};
function maybeFree(fx){ const j = fx.jobcards.find(x => x.id === "WO-0184"); if (j.release && j.check){ const a = fx.assets.find(x => x.id === "EX-014"); a.status = "available"; a.reason = ""; logEvent(fx, "Pulse", "EX-014 returned to available after human release and check"); } return fx; }
export function nameOf(fx, id){ const e = fx.employees.find(x => x.id === id); return e ? e.name : id; }
export function apply(fx, name, payload){ const f = ACTIONS[name]; return f ? f(clone(fx), payload || {}) : fx; }
