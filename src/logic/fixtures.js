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
const KEY = "ce-plant-demo-v2";

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
  out.forEach((a, i) => { if (a.status === "allocated"){ a.alloc = projs[i % 8]; } a.next = a.next || "Service due " + (10 + (i * 3) % 18) + " Nov";
    a.year = 2016 + (i * 5) % 9; a.hours = 480 + (i * 137) % 1400; a.nbv = 18000 + ((i * 7919) % 90) * 1000; a.serviceDate = daysFrom(6 + (i * 5) % 70);
    a.util = a.status === "allocated" ? 62 + (i * 13) % 34 : a.status === "available" ? 28 + (i * 7) % 22 : 18 + (i * 5) % 20; });
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
  const list = [{id:"WO-0184", asset:"EX-014", fault:"Hydraulic leak at boom cylinder (DEF-028)", mech:"Seán Duffy", status:"awaiting parts", urgent:true, partsCost:1250, hours:10, release:false, check:false, downDays:3, opened:"2026-09-30", due:"2026-10-03"}];
  const faults = ["Brake wear","Track tension","Electrical fault","Cab heater","Steering play","Greasing and inspection","Tyre replacement","Hydraulic hose weep","Engine light on","Bucket pin wear","Coolant top-up leak"];
  const assets = ["TH-004","EX-017","DU-003","RL-002","LD-004","EX-012","DU-004","VN-001","LD-002","EX-010","DU-008"];
  for (let i = 0; i < 11; i++) list.push({id:"WO-" + (173 + i).toString().padStart(4,"0"), asset:assets[i], fault:faults[i], mech:["Seán Duffy","Declan Moran","Colm Reilly"][i % 3], status:st[i % 4], urgent:i === 0, partsCost:120 + (i * 90) % 700, hours:2 + i % 6, release:false, check:false, downDays:1 + i % 4, opened:daysFrom(-(2 + i * 2)), due:daysFrom(1 + (i * 2) % 9)});
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
  for (let i = 0; i < 28; i++){
    const due = daysFrom(-(100 - i * 3)), late = ((i * 5) % 19) - 5;
    out.push({id:"INV-" + (1001 + i), client:clients[(i * 2 + 1) % 5], contract:CONTRACTS[(i * 5) % 8].id, amount:Math.round((9200 + (i * 3170) % 46000) / 100) * 100, due, overdueDays:0, status:"paid", paidOn:daysFrom(-(100 - i * 3) + late), source:"QuickBooks Online sample data"});
  }
  return out;
}
export function daysFrom(n){ const d = new Date(Date.UTC(2026,9,1) + n * 86400000); return d.toISOString().slice(0,10); }
export function fmtDate(iso){ const d = new Date(iso + "T00:00:00Z"); return d.getUTCDate() + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear(); }


/* ───────── static history and reference data (not persisted; illustrative) ───────── */
export const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
const CIVIL = [640000,702000,815000,880000,940000,990000,1010000,1030000,1060000];
const HIREREV = [128000,121000,139000,148000,156000,162000,171000,168000,180000];
const COSTPCT = [0.80,0.805,0.80,0.81,0.805,0.80,0.81,0.815,0.82];
const OVERHEAD = [118000,119000,121000,124000,126000,127000,129000,131000,132000];
export const HIST = (() => {
  const rev = CIVIL.map((c, i) => c + HIREREV[i]);
  const cost = rev.map((r, i) => Math.round(r * COSTPCT[i] / 1000) * 1000);
  const net = rev.map((r, i) => r - cost[i] - OVERHEAD[i]);
  return {
    labels: MONTH_LABELS, civil: CIVIL, hire: HIREREV, rev, cost, overhead: OVERHEAD, net,
    marginPct: net.map((n, i) => n / rev[i] * 100),
    cashIn: [610000,660000,770000,840000,910000,980000,1000000,1040000,1080000],
    cashOut: cost.map((c, i) => Math.round((c + OVERHEAD[i]) * (0.97 + (i % 3) * 0.015) / 1000) * 1000),
    fleetUtil: [64,62,66,68,70,72,73,71,70.8],
    workshopJobs: [18,16,21,19,22,20,24,21,17], workshopCost: [14200,12800,17500,16100,18900,17200,21400,19000,15700],
    nearMiss: [3,2,4,3,5,2,4,3,2], recordable: [1,0,1,0,2,0,1,1,0], inductions: [14,9,22,18,11,15,19,12,8],
    weekLabels: ["W-7","W-6","W-5","W-4","W-3","W-2","W-1","This wk"],
    weeklyHours: [4010,4180,4290,4220,4330,4260,4180,3990], weeklyOvertime: [310,355,402,380,420,398,361,290]
  };
})();

/* canonical short names so "Connacht Infrastructure (demo client)" and "... (demo record)" line up */
export const shortName = n => String(n || "").replace(/ \((demo client|demo record|demo supplier|demo project)\)$/, "");
export const CLIENTS = [
  {name:"Connacht Infrastructure", sector:"Regional roads and drainage", terms:30, limit:250000, contact:"Rónán Fahy, Programme Manager", since:2019, rating:"A", pay:34},
  {name:"Mayo Roads Programme", sector:"Local authority roads", terms:30, limit:200000, contact:"Gráinne Cusack, Roads Engineer", since:2017, rating:"A", pay:41},
  {name:"Western Utilities Delivery", sector:"Water and wastewater", terms:30, limit:300000, contact:"Accounts payable desk", since:2021, rating:"B", pay:52},
  {name:"ESB", sector:"Power and networks", terms:45, limit:350000, contact:"Contracts team", since:2020, rating:"A", pay:44},
  {name:"Irish Rail", sector:"Rail infrastructure", terms:45, limit:400000, contact:"Civils package manager", since:2022, rating:"A", pay:47},
  {name:"Mayo County Council", sector:"Local authority civils", terms:30, limit:150000, contact:"Capital projects office", since:2016, rating:"A", pay:38},
  {name:"Galway Port Company", sector:"Marine and harbour", terms:30, limit:120000, contact:"Estates manager", since:2023, rating:"B", pay:36},
  {name:"Atlantic Wind Farms", sector:"Renewables", terms:30, limit:180000, contact:"Construction lead", since:2024, rating:"B", pay:29}
];
export const SUPPLIERS = [
  {name:"West Coast Industrial Supplies", category:"Plant parts and filters", terms:30, rating:4.4, onTime:93},
  {name:"Atlantic Plant Parts", category:"Plant parts", terms:30, rating:4.1, onTime:88},
  {name:"Shannon Hydraulics", category:"Hydraulics", terms:30, rating:3.8, onTime:81},
  {name:"Mayo Aggregates", category:"Aggregates and stone", terms:30, rating:4.6, onTime:96},
  {name:"Western Pipe Supplies", category:"Pipe and fittings", terms:45, rating:4.3, onTime:90},
  {name:"Castlebar Concrete", category:"Readymix concrete", terms:30, rating:4.5, onTime:95},
  {name:"Connaught Fuels", category:"Diesel and lubricants", terms:14, rating:4.2, onTime:98},
  {name:"Ballina Steel Fabrications", category:"Steel and fabrication", terms:30, rating:3.9, onTime:84}
];
export const INCIDENTS = [
  {id:"INC-061", date:"2026-09-29", type:"near miss", where:"PRJ-027", what:"Excavator slew close to pedestrian walkway at chainage 380", sev:"medium", state:"investigating", owner:"Fiona McHale"},
  {id:"INC-060", date:"2026-09-26", type:"property damage", where:"PRJ-021", what:"Dumper reversed into temporary fencing", sev:"low", state:"closed", owner:"Fiona McHale"},
  {id:"INC-059", date:"2026-09-18", type:"near miss", where:"PRJ-025", what:"Unmarked live cable found during trial hole", sev:"high", state:"closed", owner:"Fiona McHale"},
  {id:"INC-058", date:"2026-09-11", type:"first aid", where:"Main yard", what:"Minor hand laceration during hose change", sev:"low", state:"closed", owner:"Seán Duffy"},
  {id:"INC-057", date:"2026-09-04", type:"near miss", where:"PRJ-024", what:"Trench edge slumped, no one in excavation", sev:"medium", state:"closed", owner:"Fiona McHale"},
  {id:"INC-056", date:"2026-08-27", type:"environmental", where:"PRJ-028", what:"Small hydraulic oil drip on grass verge, spill kit used", sev:"low", state:"closed", owner:"Fiona McHale"},
  {id:"INC-055", date:"2026-08-19", type:"near miss", where:"PRJ-022", what:"Traffic cone line struck by passing HGV", sev:"medium", state:"closed", owner:"Liam Joyce"},
  {id:"INC-054", date:"2026-08-08", type:"recordable", where:"PRJ-023", what:"Ankle sprain stepping from cab, 3 days restricted duty", sev:"medium", state:"closed", owner:"Fiona McHale"}
];
export const TRAINING = [
  {id:"TR-301", person:"Declan Moran", cert:"CSCS Plant Operator", expiry:"2026-10-14", state:"expiring"},
  {id:"TR-302", person:"Colm Reilly", cert:"Manual Handling", expiry:"2026-10-21", state:"expiring"},
  {id:"TR-303", person:"Brendan Higgins", cert:"Safe Pass", expiry:"2026-10-30", state:"expiring"},
  {id:"TR-304", person:"Tadhg Walsh", cert:"Lifting Operations (LOLER)", expiry:"2026-11-08", state:"expiring"},
  {id:"TR-305", person:"Oisín Heneghan", cert:"Banksman and Slinger", expiry:"2026-09-27", state:"expired"},
  {id:"TR-306", person:"Pádraig Gallagher", cert:"Abrasive Wheels", expiry:"2026-11-19", state:"expiring"},
  {id:"TR-307", person:"Ciarán Durkan", cert:"Excavator 360 Ticket", expiry:"2026-12-04", state:"valid"},
  {id:"TR-308", person:"Seán Duffy", cert:"Workshop Pressure Systems", expiry:"2026-12-12", state:"valid"},
  {id:"TR-309", person:"Liam Joyce", cert:"Temporary Works Coordinator", expiry:"2027-01-15", state:"valid"},
  {id:"TR-310", person:"Fiona McHale", cert:"Safety Representative Course", expiry:"2027-03-02", state:"valid"}
];
/* planned vs actual progress curve for a contract, 0 to 100, sampled monthly Jan to Dec 2026 */
export function contractCurve(c){
  const t0 = Date.parse(c.start), t1 = Date.parse(c.end), now = Date.UTC(2026,9,1);
  const planned = [], actual = [];
  for (let m = 0; m < 12; m++){
    const t = Date.UTC(2026, m, 28), f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    const sc = f * f * (3 - 2 * f);
    planned.push(Math.round(sc * 100));
    const nowF = Math.max(0, Math.min(1, (now - t0) / (t1 - t0))), nowSc = nowF * nowF * (3 - 2 * nowF) || 1;
    actual.push(t <= now ? Math.round(Math.min(100, sc / nowSc * c.progress)) : null);
  }
  return {planned, actual};
}

function seedQuotes(){
  const q = (id, title, client, value, status, prob, owner, issued, expiry, margin, opp) => ({id, title, client, value, status, prob, owner, issued, expiry, margin, opp:opp || ""});
  return [
    q("Q-0241","Ballina bypass drainage","Mayo Roads Programme",640000,"negotiation",65,"Eoin Burke","2026-09-02","2026-10-30",16.5,"OPP-102"),
    q("Q-0242","Substation access roads","ESB",380000,"sent",40,"Aisling Walsh","2026-09-18","2026-10-16",18.2,"OPP-104"),
    q("Q-0243","Rail culvert replacement","Irish Rail",910000,"sent",35,"Aisling Walsh","2026-09-21","2026-11-06",17.4,"OPP-103"),
    q("Q-0244","Regional water mains framework","Western Utilities Delivery",1800000,"draft",25,"Eoin Burke","","2026-11-20",14.8,"OPP-101"),
    q("Q-0245","Plant hire framework renewal","Mayo Roads Programme",260000,"draft",70,"Patrick Moran","","2026-10-23",24.0,"OPP-106"),
    q("Q-0246","Town centre surface water","Connacht Infrastructure",520000,"won",100,"Eoin Burke","2026-07-14","2026-08-31",17.9,"OPP-105"),
    q("Q-0247","Castlebar depot hardstanding","Mayo County Council",148000,"won",100,"Aisling Walsh","2026-07-02","2026-08-02",19.6),
    q("Q-0248","Westport quay wall repairs","Galway Port Company",295000,"lost",0,"Eoin Burke","2026-06-20","2026-08-20",15.1),
    q("Q-0249","Wind farm access track","Atlantic Wind Farms",410000,"negotiation",55,"Aisling Walsh","2026-09-09","2026-10-28",18.8),
    q("Q-0250","Swinford extra valve chamber","Western Utilities Delivery",36500,"won",100,"Aisling Walsh","2026-09-04","2026-09-30",20.1),
    q("Q-0251","Claremorris culvert headwall","Irish Rail",88000,"won",100,"Eoin Burke","2026-08-11","2026-09-10",18.3),
    q("Q-0252","Ballina road marking and ducting","Mayo Roads Programme",72000,"lost",0,"Patrick Moran","2026-08-03","2026-09-03",12.4),
    q("Q-0253","Kiltimagh footpath renewal","Mayo County Council",164000,"sent",45,"Aisling Walsh","2026-09-25","2026-11-13",17.0),
    q("Q-0254","Galway Port yard drainage","Galway Port Company",233000,"sent",50,"Eoin Burke","2026-09-23","2026-11-04",16.8),
    q("Q-0255","Belmullet pier access","Mayo Roads Programme",119000,"won",100,"Eoin Burke","2026-07-22","2026-08-22",19.0),
    q("Q-0256","ESB cable trench reinstatement","ESB",91000,"draft",60,"Aisling Walsh","","2026-10-29",21.5),
    q("Q-0257","Ballinrobe flood relief","Mayo County Council",540000,"lost",0,"Eoin Burke","2026-06-05","2026-08-05",14.2),
    q("Q-0258","Wind farm crane hardstands","Atlantic Wind Farms",312000,"negotiation",60,"Aisling Walsh","2026-09-14","2026-10-24",18.1)
  ];
}
function seedPOHistory(){
  const sup = ["West Coast Industrial Supplies","Atlantic Plant Parts","Shannon Hydraulics","Mayo Aggregates","Western Pipe Supplies","Castlebar Concrete","Connaught Fuels","Ballina Steel Fabrications"];
  const what = ["Hydraulic filters and seals","Track pads","Hydraulic hose assemblies","Type 1 aggregate, 400t","225mm PE pipe and fittings","C32/40 readymix, 60m3","Red diesel, 12,000L","Reinforcement cages","Bucket teeth set","Drainage chambers","6F2 stone, 300t","Valves and couplers","Lubricants and grease","Edge protection steel","Fan belts and filters","Culvert pipes","Hydraulic cylinder reseal kit","Tyres, 2 dumpers","Backfill sand, 250t","Concrete kerb units","Fuel filters","Geotextile rolls"];
  const out = [];
  for (let i = 0; i < 22; i++){
    const state = i >= 19 ? "ordered" : i === 17 ? "part received" : "received";
    out.push({id:"PO-" + String(398 + i).padStart(4,"0"), supplier:sup[(i * 3) % 8], what:what[i], contract:CONTRACTS[(i * 5 + 1) % 8].id, value:Math.round((1800 + (i * 4130) % 21000) / 10) * 10, date:daysFrom(-(74 - i * 3)), state});
  }
  return out;
}

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
    quotes: seedQuotes(),
    poHistory: seedPOHistory(),
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
  setQuote(fx, p){ const q = fx.quotes.find(x => x.id === p.id); if (!q || q.status === p.status) return fx; q.status = p.status; if (p.status === "sent" && !q.issued) q.issued = "2026-10-01";
    if (p.status === "won") q.prob = 100; if (p.status === "lost") q.prob = 0;
    logEvent(fx, p.who || "Eoin Burke", "Quote " + q.id + " marked " + p.status + " (" + eur(q.value) + ")"); return fx; },
  addTask(fx, p){ fx.tasks.unshift({id:"T-" + (fx.tasks.length + 1), title:p.title, owner:p.owner || "Ronan Conneely", related:p.related || ""}); logEvent(fx, "Pulse", "Created task: " + p.title); return fx; }
};
function maybeFree(fx){ const j = fx.jobcards.find(x => x.id === "WO-0184"); if (j.release && j.check){ const a = fx.assets.find(x => x.id === "EX-014"); a.status = "available"; a.reason = ""; logEvent(fx, "Pulse", "EX-014 returned to available after human release and check"); } return fx; }
export function nameOf(fx, id){ const e = fx.employees.find(x => x.id === id); return e ? e.name : id; }
export function apply(fx, name, payload){ const f = ACTIONS[name]; return f ? f(clone(fx), payload || {}) : fx; }

/* ── more derived values for the ERP pages ── */
export function quoteStats(fx){
  const open = fx.quotes.filter(q => ["draft","sent","negotiation"].indexOf(q.status) > -1), won = fx.quotes.filter(q => q.status === "won"), lost = fx.quotes.filter(q => q.status === "lost");
  const sum = a => a.reduce((t, q) => t + q.value, 0);
  const closed = won.length + lost.length;
  return {open, won, lost, openValue:sum(open), weighted:Math.round(open.reduce((t, q) => t + q.value * q.prob / 100, 0)), wonValue:sum(won), lostValue:sum(lost), winRate:closed ? won.length / closed * 100 : 0,
    expiring:open.filter(q => q.status !== "draft" && q.expiry <= daysFrom(21))};
}
export function ageing(fx){
  const un = fx.invoices.filter(i => i.status !== "paid");
  const b = [{label:"Not yet due", list:un.filter(i => i.status === "unpaid")}, {label:"1-30 days", list:un.filter(i => i.status === "overdue" && i.overdueDays <= 30)}, {label:"31-60 days", list:un.filter(i => i.status === "overdue" && i.overdueDays > 30 && i.overdueDays <= 60)}, {label:"60+ days", list:un.filter(i => i.status === "overdue" && i.overdueDays > 60)}];
  b.forEach(x => { x.total = x.list.reduce((t, i) => t + i.amount, 0); });
  return b;
}
export function dso(fx){
  const paid = fx.invoices.filter(i => i.status === "paid" && i.paidOn);
  return paid.length ? Math.round(paid.reduce((t, i) => t + (Date.parse(i.paidOn) - Date.parse(i.due)) / 86400000, 0) / paid.length + 30) : 0;
}
export function utilByType(fx){
  const types = [...new Set(fx.assets.map(a => a.type))];
  return types.map(t => { const l = fx.assets.filter(a => a.type === t); return {type:t, total:l.length, allocated:l.filter(a => a.status === "allocated").length, available:l.filter(a => a.status === "available").length, down:l.filter(a => a.status === "unavailable").length, util:Math.round(l.reduce((s, a) => s + a.util, 0) / l.length)}; });
}
export function partsHealth(fx){
  const low = fx.parts.filter(p => partAvail(p) < p.min), out = fx.parts.filter(p => partAvail(p) <= 0);
  return {total:fx.parts.length, low:low.length, out:out.length, ok:fx.parts.length - low.length, value:fx.parts.reduce((t, p) => t + p.onHand * p.cost, 0)};
}
