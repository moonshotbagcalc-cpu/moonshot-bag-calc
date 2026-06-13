import { useState, useRef, useEffect } from "react";

const PI = Math.PI;

// ── Google Fonts ──────────────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
}


// ── Responsive CSS ────────────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const s = document.createElement("style");
  s.textContent = `
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;background-attachment:fixed}
    .ms-app{max-width:520px;margin:0 auto;font-family:Nunito,sans-serif;min-height:100vh}
    @media(min-width:768px){
      .ms-app{max-width:820px}
      .frac-row{display:flex;gap:14px;align-items:flex-start}
      .frac-row>div{flex:1;min-width:0}
    }
  `;
  document.head.appendChild(s);
}

// ── Math helpers ──────────────────────────────────────────────────────────────
function roundTo8th(v) { return Math.round(v * 8) / 8; }
function roundTo4th(v) { return Math.round(v * 4) / 4; }
function smartRound(v) {
  const q = roundTo4th(v);
  return Math.abs(q - v) <= 1/16 ? q : roundTo8th(v);
}
function roundRectPerim(L, W, R) {
  const r = Math.max(0, R);
  return 2*(L+W) + r*(2*PI - 8);
}
// Arc-midpoint split: seam at midpoint of each corner arc
function arcMidSplit(Ls, Ws, Rs) {
  const straightA = Math.max(0, Ls - 2*Rs);
  const straightB = Math.max(0, Ws - 2*Rs);
  const totalArc = 2*PI*Rs;
  const totalStraight = 2*(straightA + straightB);
  const arcPerA = totalStraight > 0 ? totalArc * (straightA / totalStraight) : totalArc / 2;
  const arcPerB = totalArc - arcPerA;
  return {
    sideA_fin: straightA + arcPerA / 2,
    sideB_fin: straightB + arcPerB / 2,
  };
}
// Piping strip width: vinyl-calibrated (anchor: 3/32" + 3/8" SA → 1-1/8")
function pipingStripWidth(dia, sa) { return smartRound(4*dia + 2*sa); }
// Cord length offset: cord curves inside sewline
// offset = 2π × (cord_radius + vinyl_thickness)
function cordOffset(dia, vinylThick) { return 2*PI*(dia/2 + vinylThick); }

// ── Fraction display — numeric, with carry ────────────────────────────────────
const FM = {0:"",0.125:"1/8",0.25:"1/4",0.375:"3/8",0.5:"1/2",0.625:"5/8",0.75:"3/4",0.875:"7/8"};
function fmtInch(v) {
  if (v == null || isNaN(v) || v < 0) return "—";
  const rounded = Math.round(v * 8) / 8;
  const w = Math.floor(rounded);
  const fr = Math.round((rounded - w) * 8) / 8;
  const whole = fr >= 1 ? w + 1 : w;
  const fracVal = fr >= 1 ? 0 : fr;
  const fs = FM[fracVal] ?? "";
  if (whole === 0 && fs) return `${fs}"`;
  if (!fs) return `${whole}"`;
  return `${whole} ${fs}"`;
}

// ── Fraction picker ───────────────────────────────────────────────────────────
const FOPTS = [0,0.125,0.25,0.375,0.5,0.625,0.75,0.875];
const FLBLS = ["0","1/8","1/4","3/8","1/2","5/8","3/4","7/8"];

function FracInput({ label, sub, whole, frac, onWhole, onFrac, th, append }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      {label !== "" && (
        <div style={{ fontSize:14, fontWeight:800, color:th.label, marginBottom:sub?2:6, fontFamily:"Nunito,sans-serif" }}>
          {label}
        </div>
      )}
      {sub && (
        <div style={{ fontSize:12, fontWeight:600, color:th.sub, marginBottom:6, fontFamily:"Nunito,sans-serif", lineHeight:1.4 }}>
          {sub}
        </div>
      )}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input type="number" min="0" step="1"
          value={focused ? (whole===0?"":whole) : whole}
          onFocus={e=>{setFocused(true);e.target.select();}}
          onBlur={e=>{setFocused(false);if(e.target.value==="")onWhole(0);}}
          onChange={e=>onWhole(Math.max(0,parseInt(e.target.value)||0))}
          style={{ width:64, padding:"9px 8px", fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500,
            background:th.inputBg, border:`2px solid ${th.border}`, borderRadius:8,
            color:th.inputTxt, outline:"none", textAlign:"center" }}
        />
        <select value={frac} onChange={e=>onFrac(parseFloat(e.target.value))}
          style={{ padding:"9px 8px", fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500,
            background:th.inputBg, border:`2px solid ${th.border}`, borderRadius:8,
            color:th.inputTxt, outline:"none", cursor:"pointer" }}>
          {FOPTS.map((f,i)=><option key={f} value={f}>{FLBLS[i]}</option>)}
        </select>
        <div style={{ fontSize:20, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.accent, minWidth:56 }}>
          {fmtInch(whole+frac)}
        </div>
        {append && append}
      </div>
    </div>
  );
}

// ── Themes ────────────────────────────────────────────────────────────────────
const T = {
  purple:{
    sec:"#ede8f7", hdr:"#5a2da0", hdrTxt:"#fff",
    card:"#faf8ff", border:"#b09ee0",
    label:"#4a1f96", sub:"#8a70c0", accent:"#5a2da0",
    inputBg:"#f3f0fc", inputTxt:"#2e1060",
    resBg:"#e2daf5", resAccent:"#4a1f96", resTxt:"#2e1060",
    btnOn:"#5a2da0", btnOnTxt:"#fff", btnOff:"#e2daf5", btnOffTxt:"#4a1f96",
    info:"#ede8f7", infoBdr:"#9880d0", infoTxt:"#3a1880",
    ok:"#e0f5ea", okBdr:"#5aaa80", okTxt:"#1a5c38",
    warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
    nudgeBg:"#e2daf5", nudgeTxt:"#4a1f96", pageBg:"#f0ecfc",
  },
  green:{
    sec:"#e2f5e8", hdr:"#1a6e3a", hdrTxt:"#fff",
    card:"#f4fbf6", border:"#72c490",
    label:"#165c30", sub:"#3a9e60", accent:"#1a6e3a",
    inputBg:"#eaf7ee", inputTxt:"#0e3d20",
    resBg:"#ceeedd", resAccent:"#165c30", resTxt:"#0e3d20",
    btnOn:"#1a6e3a", btnOnTxt:"#fff", btnOff:"#ceeedd", btnOffTxt:"#165c30",
    info:"#e2f5e8", infoBdr:"#72c490", infoTxt:"#0e3d20",
    warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
    nudgeBg:"#ceeedd", nudgeTxt:"#165c30", pageBg:"#ecf8f0",
  },
  advanced:{
    sec:"#f5eaec", hdr:"#7a1a2e", hdrTxt:"#fff",
    card:"#fdf5f6", border:"#c48090",
    label:"#5c1020", sub:"#a04060", accent:"#7a1a2e",
    inputBg:"#f8eef0", inputTxt:"#3a0818",
    resBg:"#eeccd4", resAccent:"#5c1020", resTxt:"#3a0818",
    btnOn:"#7a1a2e", btnOnTxt:"#fff", btnOff:"#eeccd4", btnOffTxt:"#5c1020",
    info:"#f5eaec", infoBdr:"#b06070", infoTxt:"#3a0818",
    ok:"#e0f5ea", okBdr:"#5aaa80", okTxt:"#1a5c38",
    warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
    nudgeBg:"#eeccd4", nudgeTxt:"#5c1020", pageBg:"#f2e8ea",
  },
  blue:{
    sec:"#e0eaf7", hdr:"#1a4a7a", hdrTxt:"#fff",
    card:"#f4f8ff", border:"#7aaad8",
    label:"#0e3060", sub:"#3a70a8", accent:"#1a4a7a",
    inputBg:"#eaf2fc", inputTxt:"#0a1e40",
    resBg:"#ccdff5", resAccent:"#0e3060", resTxt:"#0a1e40",
    btnOn:"#1a4a7a", btnOnTxt:"#fff", btnOff:"#ccdff5", btnOffTxt:"#0e3060",
    info:"#e0eaf7", infoBdr:"#5a90c8", infoTxt:"#0a1e40",
    ok:"#e0f5ea", okBdr:"#5aaa80", okTxt:"#1a5c38",
    warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
    nudgeBg:"#ccdff5", nudgeTxt:"#0e3060", pageBg:"#eaf2fc",
  },
  magenta:{
    sec:"#f5e2f8", hdr:"#8e1a9e", hdrTxt:"#fff",
    card:"#fdf5ff", border:"#d090e0",
    label:"#741880", sub:"#c060d8", accent:"#8e1a9e",
    inputBg:"#f8eefb", inputTxt:"#4a0a58",
    resBg:"#eecef5", resAccent:"#741880", resTxt:"#4a0a58",
    btnOn:"#8e1a9e", btnOnTxt:"#fff", btnOff:"#eecef5", btnOffTxt:"#741880",
    info:"#f5e2f8", infoBdr:"#c070d8", infoTxt:"#4a0a58",
    warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
    nudgeBg:"#eecef5", nudgeTxt:"#741880", pageBg:"#f8eefb",
  }
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
function SecHeader({ title, sub, th }) {
  return (
    <div style={{ background:th.hdr, borderRadius:"14px 14px 0 0", padding:"18px 22px 14px" }}>
      <div style={{ fontSize:24, fontWeight:900, color:th.hdrTxt, fontFamily:"Nunito,sans-serif", letterSpacing:"-0.01em" }}>{title}</div>
      {sub && <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.85)", marginTop:5, fontFamily:"Nunito,sans-serif", lineHeight:1.45 }}>{sub}</div>}
    </div>
  );
}
function Card({ children, th, style:st }) {
  return (
    <div style={{ background:th.card, border:`1.5px solid ${th.border}`, borderRadius:10,
      padding:"16px 18px", marginBottom:12, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", ...st }}>
      {children}
    </div>
  );
}
function CardTitle({ children, th }) {
  return (
    <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
      color:th.label, marginBottom:12, fontFamily:"Nunito,sans-serif",
      borderBottom:`2px solid ${th.border}`, paddingBottom:8 }}>
      {children}
    </div>
  );
}
function RRow({ label, value, accent, big, th }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
      padding:"7px 0", borderBottom:`1px solid ${th.border}` }}>
      <div style={{ fontSize:15, fontWeight:700, color:th.label, fontFamily:"Nunito,sans-serif" }}>{label}</div>
      <div style={{ fontSize:big?24:19, fontFamily:"DM Mono,monospace", fontWeight:500,
        color:accent?th.resAccent:th.resTxt }}>{value}</div>
    </div>
  );
}
function InfoBox({ children, th }) {
  return (
    <div style={{ background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:15, fontWeight:600, color:th.infoTxt,
      fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}
function NoteBox({ children }) {
  return (
    <div style={{ background:"#fdf4e0", border:"1.5px solid #d4a820", borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:15, fontWeight:600, color:"#6b4400",
      fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}
function SubTabs({ tabs, active, set, th }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {tabs.map(tab=>(
        <button key={tab.id} onClick={()=>set(tab.id)} style={{
          flex:1, minWidth:80, padding:"10px 6px", fontSize:12, fontWeight:800,
          fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em", textTransform:"uppercase",
          borderRadius:8, border:"none", cursor:"pointer",
          background:active===tab.id?th.btnOn:th.btnOff,
          color:active===tab.id?"#fff":th.btnOffTxt,
          transition:"all 0.15s"
        }}>{tab.label}</button>
      ))}
    </div>
  );
}
function Nudge({ label, onClick, th }) {
  return (
    <button onClick={onClick} style={{ width:46, height:46, fontSize:14, fontWeight:800,
      fontFamily:"DM Mono,monospace", background:th.nudgeBg, color:th.nudgeTxt,
      border:`1.5px solid ${th.border}`, borderRadius:6, cursor:"pointer" }}>
      {label}
    </button>
  );
}
function Divider({ th }) {
  return <div style={{ borderTop:`2px dashed ${th.border}`, margin:"14px 0", opacity:0.5 }} />;
}
function SABar({ sa, setSa, cSa, setCsa, th }) {
  const presets=[{l:'1/4"',v:0.25},{l:'3/8"',v:0.375},{l:'1/2"',v:0.5}];
  const isCustom=!presets.some(p=>p.v===sa);
  return (
    <div style={{ background:th.card, border:`1.5px solid ${th.border}`, borderRadius:10,
      padding:"14px 16px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
        color:th.label, marginBottom:10, fontFamily:"Nunito,sans-serif",
        borderBottom:`2px solid ${th.border}`, paddingBottom:8 }}>
        Seam Allowance
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {presets.map(p=>(
          <button key={p.v} onClick={()=>{setSa(p.v);setCsa("");}} style={{
            padding:"10px 14px", fontSize:16, fontFamily:"DM Mono,monospace", fontWeight:500,
            borderRadius:8, cursor:"pointer",
            background:sa===p.v?th.btnOn:th.btnOff,
            color:sa===p.v?"#fff":th.btnOffTxt,
            border:`2px solid ${sa===p.v?th.btnOn:th.border}`,
            transition:"all 0.15s"
          }}>{p.l}</button>
        ))}
        <input type="number" min="0.0625" max="1" step="0.0625" placeholder="custom"
          value={cSa}
          onChange={e=>{setCsa(e.target.value);const v=parseFloat(e.target.value);if(!isNaN(v)&&v>0)setSa(v);}}
          style={{ width:88, padding:"10px 8px", fontSize:14, fontFamily:"DM Mono,monospace",
            fontWeight:500, borderRadius:8, textAlign:"center",
            background:isCustom?"#fef3c7":th.inputBg,
            border:`2px solid ${isCustom?"#c08800":th.border}`,
            color:th.inputTxt, outline:"none" }}
        />
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// PANEL DIAGRAM — SVG infographic for Lid/Bottom tab
// ══════════════════════════════════════════════════════════════════════════════

const SVG_NS = "http://www.w3.org/2000/svg";

const DT = {
  lidFill:"#ede8f7", lidStroke:"#5a2da0",
  sideFill:"#e2daf5", sideStroke:"#4a1f96",
  sewStroke:"#8a70c0", sewDash:"5 3.5",
  panelName:"#4a1f96", panelSub:"#8a70c0",
  radDot:"#5a2da0", radText:"#4a1f96",
  dimLine:"#5a2da0",
  warnBg:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
  svgBg:"#ffffff",
  FUI:"Nunito,sans-serif", FMO:"DM Mono,monospace",
};

function diagFmt(v) {
  if (!v || v <= 0) return '0"';
  const s = Math.round(v * 8) / 8;
  const w = Math.floor(s);
  const n = Math.round((s - w) * 8);
  const m = {0:"",1:"1/8",2:"1/4",3:"3/8",4:"1/2",5:"5/8",6:"3/4",7:"7/8"};
  const fp = n ? m[n] : "";
  if (w && fp) return `${w} ${fp}"`;
  if (w) return `${w}"`;
  return `${fp}"`;
}

function dse(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function dap(parent, child) { parent.appendChild(child); return child; }

function buildDiagramSVG(svg, lidW_in, lidH_in, bagH_in, sideBW_in, radius_in, sa_in, sAcut_in, sBcut_in) {
  svg.innerHTML = "";
  if (!lidW_in || !lidH_in || !sideBW_in) return "0 0 400 120";

  // ── Step 1: compute panel pixel sizes ────────────────────────────────────
  // S (scale) is based ONLY on horizontal panel widths — height never affects it
  const MAX_W = 480;
  const horizIn = lidW_in + lidW_in + sideBW_in; // three panel widths side by side
  const PAD_H  = 24;
  const GAP    = 36;
  const gapIn  = (PAD_H * 2 + GAP * 2) / 44; // approximate gap allowance in "inches"
  let S = Math.floor(MAX_W / (horizIn + gapIn + 4));
  // Clamp S so no horizontal panel dimension is tiny, but ignore height
  const minHorizDim = Math.min(lidW_in, lidH_in, sideBW_in);
  if (minHorizDim * S < 40) S = Math.ceil(40 / minHorizDim);
  if (S > 44) S = 44;

  const pLW = lidW_in   * S;
  const pLH = lidH_in   * S;
  const pAH = (bagH_in  || lidH_in) * S;
  const pBH = (bagH_in  || lidH_in) * S;
  const pAW = lidW_in   * S;
  const pBW = sideBW_in * S;
  const pR  = Math.max(0, Math.min(radius_in * S, pLW / 2, pLH / 2));
  const pSA = Math.max(0, sa_in * S);
  const SO  = 12;

  // ── Step 2: compute totalW so we can derive font sizes from it ───────────
  const lidX  = PAD_H;
  const aX    = lidX + pLW + GAP;
  const bX    = aX   + pAW + GAP;
  const totalW = bX + pBW + 12 + PAD_H; // 12 = SO shadow offset

  // ── Step 3: font sizes in px — renders at exact screen size always ───────
  const FST = 15;  // panel headers: "Lid / Bottom", "Side A", "Side B"
  const FSS = 12;  // "x 2" label inside panels
  const FSR = 12;  // radius callout "r = 1""
  const FSD = 12;  // dimension strip below panels

  // ── Step 4: layout heights ────────────────────────────────────────────────
  const TITLE_H   = FST + 14 + 8;      // header row height — +8 top breathing room
  const PAD_T     = TITLE_H + 10;      // top padding
  const nameY     = 8 + (TITLE_H - 8) / 2;  // centered within padded header area
  const tallest   = Math.max(pLH, pAH, pBH);
  const lidY      = PAD_T + (tallest - pLH) / 2;
  const aY        = PAD_T + (tallest - pAH) / 2;
  const bY        = PAD_T + (tallest - pBH) / 2;
  const panelBot  = PAD_T + tallest + SO;  // bottom of panels incl shadow

  // Radius leader: dot is inside the panel corner, leader exits below the panel
  // Leader length = enough to clear the panel outline + reach text
  const LL        = Math.max(28, pR * 0.6 + 20);
  // ly2 = dotY + LL*0.707; worst case dotY = lidY + pLH - pR/2
  // We need ly2 + FSR + 4 <= panelBot + RAD_CLEARANCE
  const dotY_max  = lidY + pLH - pR / 2;
  const ly2_max   = dotY_max + LL * 0.707;
  const radTextBottom = ly2_max + FSR + 6;
  const RAD_CLEARANCE = radius_in > 0 ? Math.max(0, radTextBottom - panelBot + 4) : 0;

  // Dim strip: always exactly 20px below max(panelBot, radTextBottom)
  const DIM_GAP   = 20;
  const aboveDims = radius_in > 0 ? Math.max(panelBot, radTextBottom) : panelBot;
  const dimY1     = aboveDims + DIM_GAP;
  const dimY2     = dimY1 + FSD + 4;

  // Bottom padding: 20px below the last dim line
  const BOT_PAD   = 20;
  const totalH    = dimY2 + FSD + BOT_PAD;
  const vb        = `0 0 ${totalW} ${totalH}`;

  // ── Background ────────────────────────────────────────────────────────────
  dap(svg, dse("rect", { x:0, y:0, width:totalW, height:totalH, fill:DT.svgBg }));

  // ── Panel name headers ────────────────────────────────────────────────────
  const makeTxt = (x, y, str, size, weight, fill, anchor, font) => {
    const t = dse("text", { x, y,
      "text-anchor": anchor || "middle", "dominant-baseline": "central",
      "font-size": (typeof size === "number" ? size+"px" : size), "font-weight": weight,
      "font-family": font || DT.FUI, fill });
    t.textContent = str; dap(svg, t); return t;
  };
  makeTxt(lidX + pLW/2, nameY, "Lid / Bottom", FST, "800", DT.panelName);
  makeTxt(aX   + pAW/2, nameY, "Side A",       FST, "800", DT.panelName);
  makeTxt(bX   + pBW/2, nameY, "Side B",       FST, "800", DT.panelName);

  // ── Panel renderer ────────────────────────────────────────────────────────
  const drawPanel = (x, y, w, h, r, fill, stroke, sub, ghost) => {
    if (ghost) dap(svg, dse("rect", { x:x+SO, y:y-SO, width:w, height:h, rx:r,
      fill, stroke, "stroke-width":1.5, opacity:0.28 }));
    dap(svg, dse("rect", { x, y, width:w, height:h, rx:r, fill, stroke:"none" }));
    const sewW = w - pSA*2, sewH = h - pSA*2;
    if (pSA > 2 && sewW > 6 && sewH > 6) {
      const sewR = Math.max(0, r - pSA);
      dap(svg, dse("rect", { x:x+pSA, y:y+pSA, width:sewW, height:sewH, rx:sewR,
        fill:"none", stroke:DT.sewStroke, "stroke-width":1.3,
        "stroke-dasharray":DT.sewDash, opacity:0.85 }));
    }
    dap(svg, dse("rect", { x, y, width:w, height:h, rx:r, fill:"none", stroke, "stroke-width":2 }));
    if (sub) makeTxt(x+w/2, y+h/2, sub, FSS, "700", DT.panelSub);
  };

  drawPanel(lidX, lidY, pLW, pLH, pR, DT.lidFill,  DT.lidStroke,  null,  false);
  drawPanel(aX,   aY,   pAW, pAH, 0,  DT.sideFill, DT.sideStroke, "x 2", true);
  drawPanel(bX,   bY,   pBW, pBH, 0,  DT.sideFill, DT.sideStroke, "x 2", true);

  // ── Radius callout ────────────────────────────────────────────────────────
  // Dot: center of the corner's defining square = (lidX+pR/2, lidY+pLH-pR/2)
  // Leader: long enough to always clear the panel outline
  if (radius_in > 0) {
    const dotX = lidX + pR / 2;
    const dotY = lidY + pLH - pR / 2;
    const lx2  = dotX + LL * 0.707;
    const ly2  = dotY + LL * 0.707;
    dap(svg, dse("circle", { cx:dotX, cy:dotY, r:3, fill:DT.radDot }));
    dap(svg, dse("line", { x1:dotX, y1:dotY, x2:lx2, y2:ly2,
      stroke:DT.radDot, "stroke-width":1, "stroke-dasharray":"3 3" }));
    const rt = dse("text", { x:lx2+4, y:ly2+2,
      "text-anchor":"start", "dominant-baseline":"hanging",
      "font-size":FSR+"px", "font-weight":"700", "font-family":DT.FUI, fill:DT.radText });
    const rk = dse("tspan", { "font-family":DT.FUI, "font-weight":"700", fill:DT.radText });
    rk.textContent = "r = ";
    const rv = dse("tspan", { "font-family":DT.FMO, "font-weight":"500", fill:DT.panelName });
    rv.textContent = diagFmt(radius_in);
    rt.appendChild(rk); rt.appendChild(rv);
    dap(svg, rt);
  }

  // ── Dimension strip ───────────────────────────────────────────────────────
  const putDim = (cx, line1, line2) => {
    const t1 = dse("text", { x:cx, y:dimY1, "text-anchor":"middle",
      "dominant-baseline":"hanging", "font-size":FSD+"px", "font-weight":"600",
      "font-family":DT.FUI, fill:DT.panelSub });
    t1.textContent = line1; dap(svg, t1);
    if (line2) {
      const t2 = dse("text", { x:cx, y:dimY2, "text-anchor":"middle",
        "dominant-baseline":"hanging", "font-size":FSD+"px", "font-weight":"600",
        "font-family":DT.FUI, fill:DT.panelSub });
      t2.textContent = line2; dap(svg, t2);
    }
  };

  putDim(lidX + pLW/2, diagFmt(lidW_in)+" L", diagFmt(lidH_in)+" W");
  if (sAcut_in) putDim(aX+pAW/2, diagFmt(sAcut_in)+" W", bagH_in?diagFmt(bagH_in)+" H":"");
  if (sBcut_in) putDim(bX+pBW/2, diagFmt(sBcut_in)+" W", bagH_in?diagFmt(bagH_in)+" H":"");

  return vb;
}

function MeasRow({ label, cut, sew, th }) {
  return (
    <tr style={{ borderBottom:`1px solid ${th.border}` }}>
      <td style={{ padding:"8px 4px", fontSize:15, fontWeight:700,
        color:th.label, fontFamily:"Nunito,sans-serif", width:"46%" }}>{label}</td>
      <td style={{ padding:"8px 4px", fontSize:16, fontWeight:500,
        color:th.accent, fontFamily:"DM Mono,monospace", textAlign:"right" }}>{cut}</td>
      <td style={{ padding:"8px 4px", fontSize:13, fontWeight:400,
        color:th.sub, fontFamily:"DM Mono,monospace", textAlign:"right",
        fontStyle:"italic", whiteSpace:"nowrap" }}>{sew ? `Sewline: ${sew}` : ""}</td>
    </tr>
  );
}

function MeasSection({ title, rows, th }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:13, fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase",
        color:th.hdr, background:th.sec, padding:"6px 12px", borderRadius:7,
        marginBottom:10, display:"inline-block", fontFamily:"Nunito,sans-serif" }}>
        {title}
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <tbody>
          {rows.map((r,i) => <MeasRow key={i} label={r.label} cut={r.cut} sew={r.sew} th={th} />)}
        </tbody>
      </table>
    </div>
  );
}

function PanelDiagram({ mode, lidL, lidW, rC, sa, sAc, sBc, pH, sLid_Lc, sLid_Wc, s2A, s2B, s2r, lidP, sidesP, delta, sLP }) {
  const th = T.purple;
  const svgRef = useRef(null);
  const [vb, setVb] = useState("0 0 400 120");
  const isLidMode = mode === "lid";
  const lidW_in   = isLidMode ? lidL    : sLid_Lc;
  const lidH_in   = isLidMode ? lidW    : sLid_Wc;
  const bagH_in   = pH;
  const sideBW_in = isLidMode ? lidW    : s2B;
  const radius_in = isLidMode ? rC      : s2r;
  const sa_in     = sa;
  const sAcut_in  = isLidMode ? sAc     : s2A;
  const sBcut_in  = isLidMode ? sBc     : s2B;
  const hasHeight = bagH_in > 0;
  const hasDims   = lidW_in > 0 && lidH_in > 0 && sideBW_in > 0;

  useEffect(() => {
    if (!svgRef.current) return;
    const viewBox = buildDiagramSVG(svgRef.current, lidW_in, lidH_in, bagH_in, sideBW_in, radius_in, sa_in, sAcut_in, sBcut_in);
    setVb(viewBox);
  }, [lidW_in, lidH_in, bagH_in, sideBW_in, radius_in, sa_in]);

  // Perimeter calcs for measurement table
  const lidCutP  = isLidMode ? roundRectPerim(lidL, lidW, rC) : roundRectPerim(sLid_Lc, sLid_Wc, s2r);
  const lidSewP  = isLidMode ? lidP : sLP;
  const sACutP   = 2*(sAcut_in + (hasHeight ? bagH_in : 0));
  const sASewP   = 2*(Math.max(0,sAcut_in-2*sa_in) + (hasHeight ? Math.max(0,bagH_in-2*sa_in) : 0));
  const sBCutP   = 2*(sBcut_in + (hasHeight ? bagH_in : 0));
  const sBSewP   = 2*(Math.max(0,sBcut_in-2*sa_in) + (hasHeight ? Math.max(0,bagH_in-2*sa_in) : 0));

  // Fix: in sides mode, sidesP should use the entered side dimensions, not the auto-split values
  const sidesP_check = isLidMode ? sidesP : 2*(Math.max(0,sAcut_in-2*sa_in) + Math.max(0,sBcut_in-2*sa_in));
  const delta_check  = (isLidMode ? lidP : sLP) - sidesP_check;

  const warns = [];
  if (!hasDims) warns.push("Enter dimensions above to see the diagram.");
  else {
    const dims = [lidW_in, lidH_in, sideBW_in];
    if (hasHeight) dims.push(bagH_in);
    const mx = Math.max(...dims), mn = Math.min(...dims);
    if (mn > 0 && mx/mn > 15) warns.push("Extreme proportions — diagram is approximate.");
    if (radius_in > Math.min(lidW_in, lidH_in)/2) warns.push("Radius clamped to fit panel.");
  }

  const sl = (v) => sa_in > 0 ? diagFmt(Math.max(0, v - 2*sa_in)) : null;
  const sewRad = (r) => diagFmt(Math.max(0, r - sa_in));

  const measSections = [
    {
      title: isLidMode ? "Lid / Bottom" : "Lid / Bottom (derived)",
      rows: [
        { label:"Length — cut",  cut:diagFmt(lidW_in),   sew:sl(lidW_in)   },
        { label:"Width — cut",   cut:diagFmt(lidH_in),   sew:sl(lidH_in)   },
        { label:"Corner radius", cut:diagFmt(radius_in), sew: sa_in > 0 && radius_in > 0 ? sewRad(radius_in) : null },
        { label:"Cut perimeter", cut:diagFmt(lidCutP),   sew:diagFmt(lidSewP) },
      ],
    },
    {
      title:"Side A — Cut 2",
      rows: [
        { label:"Width — cut",   cut:diagFmt(sAcut_in),                        sew:sl(sAcut_in) },
        { label:"Height — cut",  cut:hasHeight?diagFmt(bagH_in):"add height",  sew:hasHeight?sl(bagH_in):null },
        { label:"Cut perimeter", cut:hasHeight?diagFmt(sACutP):"—",            sew:hasHeight?diagFmt(sASewP):null },
      ],
    },
    {
      title:"Side B — Cut 2",
      rows: [
        { label:"Width — cut",   cut:diagFmt(sBcut_in),                        sew:sl(sBcut_in) },
        { label:"Height — cut",  cut:hasHeight?diagFmt(bagH_in):"add height",  sew:hasHeight?sl(bagH_in):null },
        { label:"Cut perimeter", cut:hasHeight?diagFmt(sBCutP):"—",            sew:hasHeight?diagFmt(sBSewP):null },
      ],
    },
  ];

  // Delta check
  const perimToCheck = isLidMode ? lidP : sLP;
  const deltaOk = Math.abs(delta_check) < 0.07;
  const deltaLabel = isLidMode
    ? "✓ Perfect match"
    : "✓ Perimeters compatible";

  return (
    <div style={{ background:th.card, border:`1.5px solid ${th.border}`,
      borderRadius:14, overflow:"hidden", marginTop:4,
      boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>

      {/* Warnings */}
      {warns.length > 0 && (
        <div style={{ background:DT.warnBg, borderBottom:`1.5px solid ${DT.warnBdr}`,
          color:DT.warnTxt, fontSize:12, fontWeight:700,
          padding:"8px 16px", fontFamily:"Nunito,sans-serif" }}>
          {warns.join("  ·  ")}
        </div>
      )}
      {!hasHeight && hasDims && (
        <div style={{ background:th.info, borderBottom:`1px solid ${th.infoBdr}`,
          color:th.infoTxt, fontSize:12, fontWeight:600,
          padding:"8px 16px", fontFamily:"Nunito,sans-serif", fontStyle:"italic" }}>
          Add bag height below to complete the diagram and perimeter totals.
        </div>
      )}

      {/* SVG */}
      <div style={{ background:"#fff" }}>
        <svg ref={svgRef} viewBox={vb} style={{ display:"block", width:"100%" }} />
      </div>

      {/* Measurement table */}
      <div style={{ borderTop:`1.5px solid ${th.border}`, padding:"20px 20px 16px" }}>
        <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase",
          color:th.sub, marginBottom:16, fontFamily:"Nunito,sans-serif" }}>
          Cut Measurements
        </div>
        {measSections.map((sec,i) => (
          <MeasSection key={i} title={sec.title} rows={sec.rows} th={th} />
        ))}
      </div>

      {/* Delta / perimeter match check */}
      {hasDims && (
        <div style={{ margin:"0 20px 20px",
          background: deltaOk ? th.ok : th.warn,
          border:`1.5px solid ${deltaOk ? th.okBdr : th.warnBdr}`,
          borderRadius:8, padding:"11px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
            padding:"5px 0", borderBottom:`1px solid ${deltaOk?th.okBdr:th.warnBdr}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>Lid/Bottom sewline perimeter</div>
            <div style={{ fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500, color:deltaOk?th.okTxt:th.warnTxt }}>{diagFmt(perimToCheck)}</div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
            padding:"5px 0", borderBottom:`1px solid ${deltaOk?th.okBdr:th.warnBdr}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>Sides sewline perimeter</div>
            <div style={{ fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500, color:deltaOk?th.okTxt:th.warnTxt }}>{diagFmt(sidesP_check)}</div>
          </div>
          <div style={{ textAlign:"center", marginTop:8, fontSize:14, fontWeight:800,
            color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>
            {deltaOk
              ? (isLidMode ? "✓ Perfect match" : "✓ Perimeters compatible")
              : `Delta ${delta_check>0?"+":"-"}${diagFmt(Math.abs(smartRound(delta_check)))} — ease across the 4 corner seams when sewing`}
          </div>
          {!isLidMode && (
            <div style={{ textAlign:"center", marginTop:6, fontSize:11, fontWeight:600,
              color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif", fontStyle:"italic" }}>
              Perimeter check — any small gap can be eased across the 4 corner seams.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — LID / BOTTOM
// ══════════════════════════════════════════════════════════════════════════════
function LidPage() {
  const th=T.purple;
  const [sa,setSa]=useState(0.375); const [cSa,setCsa]=useState("");
  const [mode,setMode]=useState("lid");
  const [lLW,setLLW]=useState(0); const [lLF,setLLF]=useState(0);
  const [lWW,setLWW]=useState(0); const [lWF,setLWF]=useState(0);
  const [rCW,setRCW]=useState(0); const [rCF,setRCF]=useState(0);
  const [nudgeA,setNudgeA]=useState(0);
  const [sAW,setSAW]=useState(0); const [sAF,setSAF]=useState(0);
  const [sBW,setSBW]=useState(0); const [sBF,setSBF]=useState(0);
  const [srW,setSrW]=useState(0); const [srF,setSrF]=useState(0);
  const [phW,setPhW]=useState(0); const [phF,setPhF]=useState(0);

  const lidL=lLW+lLF, lidW=lWW+lWF, rC=rCW+rCF;
  const Ls=Math.max(0,lidL-2*sa), Ws=Math.max(0,lidW-2*sa), Rs=Math.max(0,rC-sa);
  const lidP=roundRectPerim(Ls,Ws,Rs);
  const {sideA_fin:autoA,sideB_fin:autoB}=arcMidSplit(Ls,Ws,Rs);
  const sAf=smartRound(autoA+nudgeA), sBf=smartRound(autoB-nudgeA);
  const sAc=sAf+2*sa, sBc=sBf+2*sa;
  const sidesP=2*(sAf+sBf), delta=lidP-sidesP;

  const s2A=sAW+sAF, s2B=sBW+sBF, s2r=srW+srF;
  const s2Af=s2A-2*sa, s2Bf=s2B-2*sa, s2Rs=Math.max(0,s2r-sa);
  const sLidPerim=2*(s2Af+s2Bf)+2*PI*s2Rs;
  const sLidLplusW=(sLidPerim-s2Rs*(2*PI-8))/2;
  const sRatio=s2Af>0&&s2Bf>0?s2Af/s2Bf:1;
  const sLid_Ws=sLidLplusW/(1+sRatio), sLid_Ls=sLidLplusW-sLid_Ws;
  const sLid_Lc=sLid_Ls+2*sa, sLid_Wc=sLid_Ws+2*sa;
  const sLP=roundRectPerim(sLid_Ls,sLid_Ws,s2Rs);
  const pH=phW+phF;

  // Finished bag dimensions — based on lid sewline (the true footprint)
  const finL = mode==="lid" ? Ls : sLid_Ls;
  const finW = mode==="lid" ? Ws : sLid_Ws;
  const finH = Math.max(0, pH - 2*sa);

  return (
    <div style={{ minHeight:"100vh", padding:"16px 16px 48px" }}>
      <SABar th={th} sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} />
      <div style={{ background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(90,45,160,0.12)" }}>
        <SecHeader th={th} title="Lid & Bottom Panels"
          sub="A 4-sided panel (your bag's bottom or lid) with square or rounded corners, plus the 4 matching side panels that assemble around it. The corner radius applies to the bottom/lid only — side panels are always plain rectangles." />
        <div style={{ padding:"16px 16px 20px" }}>

          {/* Tab switcher + caption */}
          <SubTabs th={th} active={mode} set={v=>{setMode(v);setNudgeA(0);}}
            tabs={[{id:"lid",label:"Lid/Bottom → Sides"},{id:"sides",label:"Sides → Lid/Bottom"}]} />
          <div style={{ fontSize:13, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
            fontStyle:"italic", marginBottom:14, marginTop:-6, lineHeight:1.4 }}>
            {mode==="lid"
              ? "Know your Lid/Bottom size? Start here — corner radius determines your side panel lengths."
              : "Know your side lengths? Start here — we'll calculate the Lid/Bottom to match."}
          </div>

          {/* ── Lid → Sides inputs ── */}
          {mode==="lid" && (
            <Card th={th}>
              <CardTitle th={th}>Lid / Bottom — Cut Dimensions</CardTitle>
              <InfoBox th={th}>Enter the cut (pre-sewn) size of your lid or bottom panel. Sewline dimensions are derived by subtracting the seam allowance.</InfoBox>
              <div style={{marginTop:14}}>
                <div className="frac-row">
                  <FracInput th={th} label="Length (cut)" whole={lLW} frac={lLF} onWhole={setLLW} onFrac={setLLF} />
                  <FracInput th={th} label="Width (cut)" whole={lWW} frac={lWF} onWhole={setLWW} onFrac={setLWF} />
                </div>
              </div>
              <Divider th={th} />
              <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid & bottom)</div>
              {lidL > 0 && lidW > 0 && (
                <div style={{ fontSize:12, fontWeight:600, color:th.accent, fontFamily:"Nunito,sans-serif",
                  fontStyle:"italic", marginBottom:10 }}>
                  Max radius for these dimensions: {fmtInch(smartRound(Math.min(Ls, Ws) / 2))}
                </div>
              )}
              <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={rCW} frac={rCF} onWhole={setRCW} onFrac={setRCF} />
              <Divider th={th} />
              <CardTitle th={th}>Side Panels</CardTitle>
              <InfoBox th={th}>4 panels total: 2 pairs of matching rectangles (Sides A and Sides B). Seams default to the midpoint of the lid/bottom corners. Nudge either pair by 1/8" — the other pair updates automatically to maintain the correct perimeter.</InfoBox>
              <div style={{marginTop:14}}>
                {[["Side A — Cut 2",sAc,sAf,1],["Side B — Cut 2",sBc,sBf,-1]].map(([lbl,cut,fin,dir])=>(
                  <div key={lbl} style={{marginBottom:14}}>
                    <div style={{ fontSize:14, fontWeight:800, color:th.label, marginBottom:6, fontFamily:"Nunito,sans-serif" }}>{lbl}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <div style={{ flex:1, background:th.resBg, border:`2px solid ${th.border}`, borderRadius:8, padding:"10px 14px", textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:900, color:th.label, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2, fontFamily:"Nunito,sans-serif" }}>Cut</div>
                        <div style={{ fontSize:28, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>{fmtInch(cut)}</div>
                        <div style={{ fontSize:12, color:th.sub, marginTop:2, fontFamily:"Nunito,sans-serif" }}>finished {fmtInch(fin)}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <Nudge th={th} label="+1/8" onClick={()=>setNudgeA(n=>roundTo8th(n+0.125*dir))} />
                        <Nudge th={th} label="-1/8" onClick={()=>setNudgeA(n=>roundTo8th(n-0.125*dir))} />
                      </div>
                    </div>
                  </div>
                ))}
                {nudgeA!==0 && <button onClick={()=>setNudgeA(0)} style={{
                  fontSize:12, fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase",
                  background:th.btnOff, border:`1.5px solid ${th.border}`, borderRadius:6,
                  padding:"6px 14px", cursor:"pointer", color:th.btnOffTxt, marginBottom:12, fontFamily:"Nunito,sans-serif"
                }}>Reset to auto</button>}
                {sAc > 0 && sBc > 0 && Math.abs(sAc - sBc) < 0.01 && (
                  <div style={{background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:8,
                    padding:"10px 13px", marginBottom:12, fontSize:13, fontWeight:600,
                    color:th.infoTxt, fontFamily:"Nunito,sans-serif", lineHeight:1.5}}>
                    ✓ Sides A and B are the same size — you can cut all 4 panels from one template.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── Sides → Lid inputs ── */}
          {mode==="sides" && <>
            <Card th={th}>
              <CardTitle th={th}>Side Panels — Enter Cut Dimensions</CardTitle>
              <InfoBox th={th}>Enter your cut side panel lengths and the Lid/Bottom corner radius. The required Lid/Bottom cut dimensions will be calculated to match.</InfoBox>
              <div style={{marginTop:14}}>
                <div className="frac-row">
                  <FracInput th={th} label="Side A — width (cut)" whole={sAW} frac={sAF} onWhole={setSAW} onFrac={setSAF} />
                  <FracInput th={th} label="Side B — width (cut)" whole={sBW} frac={sBF} onWhole={setSBW} onFrac={setSBF} />
                </div>
              </div>
              <Divider th={th} />
              <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid & bottom)</div>
              {s2A > 0 && s2B > 0 && (
                <div style={{ fontSize:12, fontWeight:600, color:th.accent, fontFamily:"Nunito,sans-serif",
                  fontStyle:"italic", marginBottom:10 }}>
                  Max radius for derived Lid/Bottom: {fmtInch(smartRound(Math.min(sLid_Ls, sLid_Ws) / 2))}
                </div>
              )}
              <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={srW} frac={srF} onWhole={setSrW} onFrac={setSrF} />
            </Card>
          </>}

          {/* ── Bag Height — optional, outside tabs ── */}
          <div style={{ background:th.card, border:`1.5px dashed ${th.border}`, borderRadius:10,
            padding:"14px 16px", marginBottom:12, marginTop:4 }}>
            <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
              color:th.sub, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>
              Bag Height
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
              fontStyle:"italic", marginBottom:12 }}>
              Optional — add for diagram, perimeter totals, and finished size.
            </div>
            <FracInput th={th} label="Side panel height — cut" whole={phW} frac={phF} onWhole={setPhW} onFrac={setPhF} />
            {pH > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
                marginTop:4, padding:"6px 10px", background:th.resBg, borderRadius:6 }}>
                <div style={{ fontSize:13, fontWeight:700, color:th.label, fontFamily:"Nunito,sans-serif" }}>
                  Finished height
                </div>
                <div style={{ fontSize:16, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>
                  {fmtInch(finH)}
                  <span style={{ fontSize:11, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
                    marginLeft:6, fontStyle:"italic" }}>
                    (after {fmtInch(sa)} SA top & bottom)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Diagram + measurements + delta ── */}
          <PanelDiagram
            mode={mode}
            lidL={lidL} lidW={lidW} rC={rC} sa={sa}
            sAc={sAc} sBc={sBc} pH={pH}
            sLid_Lc={sLid_Lc} sLid_Wc={sLid_Wc}
            s2A={s2A} s2B={s2B} s2r={s2r}
            lidP={lidP} sidesP={sidesP} delta={delta} sLP={sLP}
          />

          {/* ── Finished Bag Size — very bottom ── */}
          <div style={{ background:"#2a1860", borderRadius:10, padding:"16px 18px", marginTop:12 }}>
            <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase",
              color:"#b8a8e8", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>
              Finished Bag Size
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Length</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color: finL>0?"#e8e0ff":"rgba(255,255,255,0.25)" }}>
                {finL>0 ? fmtInch(finL) : "—"}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Width</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color: finW>0?"#e8e0ff":"rgba(255,255,255,0.25)" }}>
                {finW>0 ? fmtInch(finW) : "—"}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Height</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500,
                color: pH>0 ? "#e8e0ff" : "rgba(255,255,255,0.25)" }}>
                {pH>0 ? fmtInch(finH) : "add height above"}
              </div>
            </div>
            <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.35)",
              fontFamily:"Nunito,sans-serif", fontStyle:"italic", marginTop:10, lineHeight:1.4 }}>
              Estimated. Assumes SA taken at top edge to finish the bag opening.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — GUSSET
// ══════════════════════════════════════════════════════════════════════════════

// ── Gusset SVG Diagram ────────────────────────────────────────────────────────
function GussetDiagram({ mode, panelW, panelH, cornerR, gussetCutW, gussetLen, sa }) {
  const th = T.green;
  if (!panelW || !panelH) return null;

  const SVG_W = 600;
  const PANEL_MAX_W = 340, PANEL_MAX_H = 220;
  const MARGIN_X = 30, MARGIN_TOP = 28, GAP = 32;
  const STRIP_H_MAX = 60, STRIP_MIN_H = 12;

  // ── Scale panel to fit ────────────────────────────────────────────────────
  const S = Math.min(PANEL_MAX_W / panelW, PANEL_MAX_H / panelH, 14);
  const pW  = panelW  * S;
  const pH  = panelH  * S;
  const pR  = Math.min(cornerR * S, pW/2, pH/2);
  const saP = sa * S;
  const gW  = gussetCutW > 0 ? Math.max(STRIP_MIN_H, Math.min(gussetCutW * S, STRIP_H_MAX)) : STRIP_MIN_H;

  // Center panel horizontally
  const panelX = (SVG_W - pW) / 2;
  const panelY = MARGIN_TOP;

  // ── Heights ───────────────────────────────────────────────────────────────
  const PANEL_BLOCK = panelY + pH + 14; // bottom of panel + label gap
  const STRIP_Y     = PANEL_BLOCK + GAP;
  const STRIP_LABEL_Y = STRIP_Y + gW + 18;
  const SVG_H       = STRIP_LABEL_Y + 22;

  // ── Panel paths ───────────────────────────────────────────────────────────
  // Bag panel shape
  const panelPath = mode === "three"
    // 3-sided: rounded bottom corners only
    ? `M ${panelX} ${panelY}
       L ${panelX+pW} ${panelY}
       L ${panelX+pW} ${panelY+pH-pR}
       A ${pR} ${pR} 0 0 1 ${panelX+pW-pR} ${panelY+pH}
       L ${panelX+pR} ${panelY+pH}
       A ${pR} 0 0 0 1 ${panelX} ${panelY+pH-pR}
       Z`
    // 4-sided: all corners (same radius)
    : `M ${panelX+pR} ${panelY}
       L ${panelX+pW-pR} ${panelY}
       A ${pR} ${pR} 0 0 1 ${panelX+pW} ${panelY+pR}
       L ${panelX+pW} ${panelY+pH-pR}
       A ${pR} ${pR} 0 0 1 ${panelX+pW-pR} ${panelY+pH}
       L ${panelX+pR} ${panelY+pH}
       A ${pR} ${pR} 0 0 1 ${panelX} ${panelY+pH-pR}
       L ${panelX} ${panelY+pR}
       A ${pR} ${pR} 0 0 1 ${panelX+pR} ${panelY}
       Z`;

  // Sewline path (inset by SA)
  const sewPath = mode === "three"
    ? `M ${panelX+saP} ${panelY+saP}
       L ${panelX+pW-saP} ${panelY+saP}
       L ${panelX+pW-saP} ${panelY+pH-pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-pR} ${panelY+pH-saP}
       L ${panelX+pR} ${panelY+pH-saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+saP} ${panelY+pH-pR}
       Z`
    : `M ${panelX+pR} ${panelY+saP}
       L ${panelX+pW-pR} ${panelY+saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-saP} ${panelY+pR}
       L ${panelX+pW-saP} ${panelY+pH-pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-pR} ${panelY+pH-saP}
       L ${panelX+pR} ${panelY+pH-saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+saP} ${panelY+pH-pR}
       L ${panelX+saP} ${panelY+pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pR} ${panelY+saP}
       Z`;

  // Gusset overlay path — the 3 (or 4) edges where gusset attaches
  // Use thick stroke at gusset width along the sewline path
  const gussetPath = mode === "three"
    ? `M ${panelX+saP} ${panelY}
       L ${panelX+saP} ${panelY+pH-pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pR} ${panelY+pH-saP}
       L ${panelX+pW-pR} ${panelY+pH-saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-saP} ${panelY+pH-pR}
       L ${panelX+pW-saP} ${panelY}`
    : `M ${panelX+saP} ${panelY+pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pR} ${panelY+saP}
       L ${panelX+pW-pR} ${panelY+saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-saP} ${panelY+pR}
       L ${panelX+pW-saP} ${panelY+pH-pR}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+pW-pR} ${panelY+pH-saP}
       L ${panelX+pR} ${panelY+pH-saP}
       A ${Math.max(0,pR-saP)} ${Math.max(0,pR-saP)} 0 0 1 ${panelX+saP} ${panelY+pH-pR}
       Z`;

  // ── Gusset strip with AutoCAD break ──────────────────────────────────────
  const STRIP_SHOW = 100; // px of strip shown on each side of break
  const BREAK_W = 28;     // break symbol width
  const totalStripW = STRIP_SHOW*2 + BREAK_W;
  const stripX = (SVG_W - totalStripW) / 2;
  const stripY = STRIP_Y;

  // Left piece
  const lx1=stripX, lx2=stripX+STRIP_SHOW;
  // Right piece
  const rx1=stripX+STRIP_SHOW+BREAK_W, rx2=rx1+STRIP_SHOW;
  // Break zigzag (classic autocad S-break)
  const bMid = stripX+STRIP_SHOW + BREAK_W/2;
  const bY1=stripY, bY2=stripY+gW;
  const breakPath = `M ${lx2} ${bY1}
    L ${lx2+4} ${bY1}
    L ${lx2+BREAK_W*0.35} ${(bY1+bY2)/2-gW*0.15}
    L ${lx2+BREAK_W*0.65} ${(bY1+bY2)/2+gW*0.15}
    L ${lx2+BREAK_W-4} ${bY2}
    L ${rx1} ${bY2}`;

  const fs = 12; // label font size
  const hasGusset = gussetCutW > 0;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{width:"100%",height:"auto",display:"block"}}
      xmlns="http://www.w3.org/2000/svg">

      {/* ── Bag panel ─────────────────────────────────────────────────── */}
      <path d={panelPath} fill="#c8e8d4" stroke="#2a7a4a" strokeWidth="2"/>
      {/* Sewline dashes */}
      {saP > 2 && <path d={sewPath} fill="none" stroke="#1a6e3a" strokeWidth="1.2"
        strokeDasharray="5,3" opacity="0.6"/>}
      {/* Gusset overlay — thick colored stroke */}
      <path d={gussetPath} fill="none" stroke="#1a6e3a" strokeWidth={Math.max(4, gW*0.5)}
        strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>

      {/* ── Panel dimension labels ────────────────────────────────────── */}
      {/* Width arrow */}
      <line x1={panelX} y1={panelY-10} x2={panelX+pW} y2={panelY-10}
        stroke="#2a7a4a" strokeWidth="1" markerStart="url(#gArrL)" markerEnd="url(#gArrR)"/>
      <text x={panelX+pW/2} y={panelY-14} textAnchor="middle" fontSize={fs}
        fontWeight="700" fontFamily="DM Mono,monospace" fill="#1a6e3a">{fmtInch(panelW)} W</text>
      {/* Height arrow */}
      <line x1={panelX+pW+10} y1={panelY} x2={panelX+pW+10} y2={panelY+pH}
        stroke="#2a7a4a" strokeWidth="1" markerStart="url(#gArrT)" markerEnd="url(#gArrB)"/>
      <text x={panelX+pW+14} y={panelY+pH/2} textAnchor="start" dominantBaseline="middle"
        fontSize={fs} fontWeight="700" fontFamily="DM Mono,monospace" fill="#1a6e3a">{fmtInch(panelH)} H</text>

      {/* ── Open top label (3-sided) ──────────────────────────────────── */}
      {mode==="three" && (
        <text x={panelX+pW/2} y={panelY-2} textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="600" fontFamily="Nunito,sans-serif"
          fill="#2a7a4a" opacity="0.6" letterSpacing="0.05em">open top</text>
      )}

      {/* ── Gusset strip ─────────────────────────────────────────────── */}
      {/* Left rect */}
      <rect x={lx1} y={stripY} width={STRIP_SHOW} height={gW}
        fill="#a8d8b8" stroke="#2a7a4a" strokeWidth="1.5"/>
      {/* Right rect */}
      <rect x={rx1} y={stripY} width={STRIP_SHOW} height={gW}
        fill="#a8d8b8" stroke="#2a7a4a" strokeWidth="1.5"/>
      {/* Break symbol */}
      <path d={breakPath} fill="none" stroke="#2a7a4a" strokeWidth="1.5"
        strokeLinejoin="round"/>
      {/* Clip the break edges cleanly */}
      <rect x={lx2-1} y={stripY-1} width={BREAK_W+2} height={gW+2}
        fill="white" opacity="0.7"/>
      <path d={breakPath} fill="none" stroke="#2a7a4a" strokeWidth="1.5"
        strokeLinejoin="round"/>

      {/* Strip dimension labels */}
      {hasGusset && (
        <>
          {/* Width label */}
          <line x1={lx1-8} y1={stripY} x2={lx1-8} y2={stripY+gW}
            stroke="#2a7a4a" strokeWidth="1" markerStart="url(#gArrT)" markerEnd="url(#gArrB)"/>
          <text x={lx1-12} y={stripY+gW/2} textAnchor="end" dominantBaseline="middle"
            fontSize={fs} fontWeight="700" fontFamily="DM Mono,monospace" fill="#1a6e3a">
            {fmtInch(gussetCutW)} W
          </text>
        </>
      )}
      {/* Strip length label */}
      <text x={SVG_W/2} y={STRIP_LABEL_Y} textAnchor="middle"
        fontSize={fs} fontWeight="600" fontFamily="Nunito,sans-serif" fill="#2a7a4a" opacity="0.8">
        {gussetLen > 0 ? `Strip cut length: ${fmtInch(gussetLen)}` : "Enter gusset width to see strip dimensions"}
      </text>

      {/* ── Arrow markers ─────────────────────────────────────────────── */}
      <defs>
        <marker id="gArrL" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <polyline points="6,0.5 1,3 6,5.5" fill="none" stroke="#2a7a4a" strokeWidth="1.2"/>
        </marker>
        <marker id="gArrR" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
          <polyline points="0,0.5 5,3 0,5.5" fill="none" stroke="#2a7a4a" strokeWidth="1.2"/>
        </marker>
        <marker id="gArrT" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <polyline points="0.5,6 3,1 5.5,6" fill="none" stroke="#2a7a4a" strokeWidth="1.2"/>
        </marker>
        <marker id="gArrB" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <polyline points="0.5,0 3,5 5.5,0" fill="none" stroke="#2a7a4a" strokeWidth="1.2"/>
        </marker>
      </defs>
    </svg>
  );
}
function GussetPage() {
  const th=T.green;
  const [sa,setSa]=useState(0.375); const [cSa,setCsa]=useState("");
  const [mode,setMode]=useState("three");

  // shared inputs
  const [pLW,setPLW]=useState(0); const [pLF,setPLF]=useState(0);
  const [pHW,setPHW]=useState(0); const [pHF,setPHF]=useState(0);
  const [rW,setRW]=useState(0);   const [rF,setRF]=useState(0);
  const [gWW,setGWW]=useState(0); const [gWF,setGWF]=useState(0);

  const pL=pLW+pLF, pH=pHW+pHF, rC=rW+rF;
  const Rs=Math.max(0,rC-sa);
  const gFin=gWW+gWF, gCut=gFin+2*sa;

  // Sewline dims — top edge NOT reduced by SA for 2-sided and 3-sided
  // Width sewline: pL - 2*sa (SA on both left/right edges)
  // Height sewline: pH - sa (SA on bottom only, top is raw)
  const Ls_open = Math.max(0, pL - 2*sa);   // width sewline (open-top variants)
  const Hs_open = Math.max(0, pH - sa);      // height sewline (bottom SA only)
  // 4-sided: all 4 edges get SA
  const Ls_closed = Math.max(0, pL - 2*sa);
  const Hs_closed = Math.max(0, pH - 2*sa);

  // ── 3-sided: bottom + 2 sides, 2 corners ────────────────────────────────
  const bot3 = Math.max(0, Ls_open - 2*Rs);
  const side3 = Math.max(0, Hs_open - Rs);
  const arc3 = PI*Rs;                            // two quarter-circle arcs
  const sewLen3 = bot3 + arc3 + 2*side3;         // both ends raw/open

  // ── 4-sided (enclosed): full perimeter ──────────────────────────────────
  const sewLen4 = roundRectPerim(Ls_closed, Hs_closed, Rs);
  const stripLen4 = sewLen4 + 2*sa;              // +2×SA to close the loop

  const sewLen = mode==="three" ? sewLen3 : stripLen4;
  const Ls_disp = mode==="four" ? Ls_closed : Ls_open;
  const Hs_disp = mode==="four" ? Hs_closed : Hs_open;

  return (
    <div style={{ minHeight:"100vh", padding:"16px 16px 48px" }}>
      <SABar th={th} sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} />
      <div style={{ background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(26,110,58,0.12)" }}>
        <SecHeader th={th} title="Gusset Strip"
          sub="Calculates the cut length and width of a gusset strip based on how many sides of the bag panel it wraps. Choose 3-sided (open top) or fully enclosed (4-sided)." />
        <div style={{ padding:"16px 16px 20px" }}>
          <SubTabs th={th} active={mode} set={setMode}
            tabs={[{id:"three",label:"3-Sided"},{id:"four",label:"4-Sided (Enclosed)"}]} />

          {mode==="three" && (
            <InfoBox th={th}>
              <strong>3-Sided:</strong> The strip wraps around 2 bottom corners, covering the bottom and both sides. Both short ends are raw top edges — left unsewn or finished separately. No end seam allowance is added to the strip length. Assumes 2 rounded corners (or 0 for square).
            </InfoBox>
          )}
          {mode==="four" && (
            <InfoBox th={th}>
              <strong>4-Sided (Enclosed):</strong> The strip wraps all 4 sides of the panel, forming a closed loop. Both short ends are sewn together — 2 seam allowances are included in the strip length. Assumes 4 rounded corners (or 0 for square). All 4 panel edges are sewn, so seam allowance is subtracted from all sides in the sewline calculation.
            </InfoBox>
          )}

          <Card th={th} style={{marginTop:12}}>
            <CardTitle th={th}>Bag Panel — Cut Dimensions</CardTitle>
            <div className="frac-row">
              <FracInput th={th} label="Panel width (cut)" whole={pLW} frac={pLF} onWhole={setPLW} onFrac={setPLF} />
              <FracInput th={th} label="Panel height (cut)" whole={pHW} frac={pHF} onWhole={setPHW} onFrac={setPHF} />
            </div>
            <Divider th={th} />
            <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>
              {mode==="three"?"Bottom Corner Radius (2 corners)":"Corner Radius (all 4 corners)"}
            </div>
            <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={rW} frac={rF} onWhole={setRW} onFrac={setRF} />
            <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px", marginTop:4 }}>
              {mode!=="four" && (
                <RRow th={th} label="Gusset sewline run" value={fmtInch(sewLen3)} accent />
              )}
              {mode==="four" && (
                <RRow th={th} label="Enclosed sewline perimeter" value={fmtInch(sewLen4)} accent />
              )}
            </div>
            <Divider th={th} />
            <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:8, fontFamily:"Nunito,sans-serif" }}>
              Sewline Dimensions
            </div>
            <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px" }}>
              <RRow th={th} label="Panel sewline width" value={fmtInch(Ls_disp)} />
              <RRow th={th} label="Panel sewline height" value={fmtInch(Hs_disp)} />
              <RRow th={th} label="Sewline corner radius" value={fmtInch(Rs)} />
            </div>
            {mode!=="four" && (
              <NoteBox>
                The panel sewline height reflects SA on the bottom edge only — the top edge is assumed to be the bag opening and is left unsewn at this stage.
              </NoteBox>
            )}
          </Card>

          <Card th={th}>
            <CardTitle th={th}>Gusset Strip Dimensions</CardTitle>
            <FracInput th={th} label="Gusset finished width" sub="(finished interior depth of bag)" whole={gWW} frac={gWF} onWhole={setGWW} onFrac={setGWF} />
            <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px", marginTop:8 }}>
              <RRow th={th} label="Strip cut length" value={fmtInch(sewLen)} accent big />
              <RRow th={th} label="Strip cut width" value={fmtInch(gCut)} accent big />
              <RRow th={th} label="Strip finished width" value={fmtInch(gFin)} />
            </div>
            {mode==="three" && <NoteBox>Strip length equals the 3-sided sewline run exactly — no end seam allowance added. Both short ends are left raw as the bag's top edges.</NoteBox>}
            {mode==="four" && <NoteBox>Strip length includes 2 seam allowances for joining the short ends into a closed loop. Press the joining seam open before attaching the strip to the panel.</NoteBox>}
            <NoteBox>
              <strong>Easing at corners:</strong> Clip the strip's seam allowance at each rounded corner every 1/4"–3/8" (into but not through the seam allowance) so it lies flat around the curve.
            </NoteBox>
          </Card>

          {/* ── Gusset diagram ── */}
          {pL > 0 && pH > 0 && (
            <div style={{ background:"#fff", border:`1.5px solid ${th.border}`, borderRadius:14,
              overflow:"hidden", marginTop:4, padding:"16px 12px 8px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:12, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase",
                color:th.sub, marginBottom:12, fontFamily:"Nunito,sans-serif" }}>
                Panel &amp; Gusset Diagram
              </div>
              <GussetDiagram
                mode={mode}
                panelW={pL} panelH={pH} cornerR={rC}
                gussetCutW={gCut} gussetLen={sewLen} sa={sa}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — PIPING
// ══════════════════════════════════════════════════════════════════════════════
const CORDS=[{l:'3/32"',d:3/32},{l:'1/8"',d:1/8},{l:'5/32"',d:5/32},{l:'1/4"',d:1/4}];

function PipingPage() {
  const th=T.magenta;
  const [sa,setSa]=useState(0.375); const [cSa,setCsa]=useState("");
  const [shape,setShape]=useState("rect");
  const [cIdx,setCIdx]=useState(0);
  const [vinylThick,setVinylThick]=useState(1/32);

  // Rectangle
  const [rLW,setRLW]=useState(0); const [rLF,setRLF]=useState(0);
  const [rWW,setRWW]=useState(0); const [rWF,setRWF]=useState(0);
  const [rrW,setRrW]=useState(0); const [rrF,setRrF]=useState(0);
  const [rManual,setRManual]=useState(false);
  const [rManW,setRManW]=useState(0); const [rManF,setRManF]=useState(0);

  // Oval
  const [oAW,setOAW]=useState(0); const [oAF,setOAF]=useState(0);
  const [oBW,setOBW]=useState(0); const [oBF,setOBF]=useState(0);
  const [oManual,setOManual]=useState(false);
  const [oManW,setOManW]=useState(0); const [oManF,setOManF]=useState(0);

  // 3-sided
  const [tLW,setTLW]=useState(0); const [tLF,setTLF]=useState(0);
  const [tHW,setTHW]=useState(0); const [tHF,setTHF]=useState(0);
  const [trW,setTrW]=useState(0); const [trF,setTrF]=useState(0);

  const cord=CORDS[cIdx];
  const sw=pipingStripWidth(cord.d,sa);

  // Cut perimeters — calculated directly from cut dimensions (what you can measure)
  const rL_cut=rLW+rLF, rW2_cut=rWW+rWF, rRs_cut=rrW+rrF;
  const rectPcalc=roundRectPerim(rL_cut, rW2_cut, rRs_cut);
  const rectCutP=rManual?(rManW+rManF):rectPcalc;

  const oA_cut=(oAW+oAF)/2, oB2_cut=(oBW+oBF)/2;
  const hh=(oA_cut+oB2_cut)>0?(oA_cut-oB2_cut)**2/(oA_cut+oB2_cut)**2:0;
  const ovalPcalc=oA_cut+oB2_cut>0?PI*(oA_cut+oB2_cut)*(1+(3*hh)/(10+Math.sqrt(4-3*hh))):0;
  const ovalCutP=oManual?(oManW+oManF):ovalPcalc;

  const tL_cut=tLW+tLF, tH_cut=tHW+tHF, tRs_cut=trW+trF;
  const tBot=Math.max(0,tL_cut-2*tRs_cut), tSide=Math.max(0,tH_cut-tRs_cut);
  const threeCutP=tBot+2*tSide+PI*tRs_cut;

  const cutP=shape==="rect"?rectCutP:shape==="oval"?ovalCutP:threeCutP;
  // Sewline perimeter = cut perimeter minus SA on all enclosed edges
  const sewP = cutP - (shape==="three" ? (4*sa) : (4*sa));  // all shapes: 2 dims × 2×SA each
  const closed=shape!=="three";

  // ── Geometric values ─────────────────────────────────────────────────────
  // Strip: based on sewline perimeter
  const stripLen=closed?smartRound(sewP+2*sa):smartRound(sewP+2);
  // Cord: sewline minus cord-curve offset = 2π × (cord_radius + vinyl_thickness)
  const offset=cordOffset(cord.d, vinylThick);
  const cordLen=smartRound(sewP-offset);

  // ── Empirical / snug-fit values ──────────────────────────────────────────
  // Derived from real-world anchor: 32.25" cut perimeter → 30.625" strip, 29.5" cord
  // (3/32" cord, 1/4" strip SA, 3/8" bag SA — dialed in over 6 builds)
  // Strip = 95.0% of cut perimeter; Cord = 91.5% of cut perimeter
  const STRIP_PCT = 0.950;
  const CORD_PCT  = 0.915;
  const empStripLen = smartRound(cutP * STRIP_PCT);
  const empCordLen  = smartRound(cutP * CORD_PCT);

  const togStyle=(on)=>({
    padding:"6px 14px", fontSize:13, fontWeight:800, fontFamily:"Nunito,sans-serif",
    borderRadius:6, border:`1.5px solid ${th.border}`, cursor:"pointer",
    background:on?th.btnOn:th.btnOff, color:on?"#fff":th.btnOffTxt,
  });

  const vinylPresets=[{l:'1/32"',v:1/32},{l:'1/16"',v:1/16},{l:'3/32"',v:3/32}];

  return (
    <div style={{ minHeight:"100vh", padding:"16px 16px 48px" }}>
      <SABar th={th} sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} />
      <div style={{ background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(142,26,158,0.12)" }}>
        <SecHeader th={th} title="Piping"
          sub="Calculates piping cord length and fabric/vinyl strip dimensions. Cord length accounts for the cord curving inside the sewline." />
        <div style={{ padding:"16px 16px 20px" }}>

          <Card th={th}>
            <CardTitle th={th}>Piping Cord Size</CardTitle>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {CORDS.map((c,i)=>(
                <button key={i} onClick={()=>setCIdx(i)} style={{
                  padding:"10px 16px", fontSize:19, fontFamily:"DM Mono,monospace", fontWeight:500,
                  borderRadius:8, cursor:"pointer",
                  background:cIdx===i?th.btnOn:th.btnOff,
                  color:cIdx===i?"#fff":th.btnOffTxt,
                  border:`2px solid ${cIdx===i?th.btnOn:th.border}`,
                  transition:"all 0.15s"
                }}>{c.l}</button>
              ))}
            </div>
            <div style={{ background:th.resBg, borderRadius:8, padding:"11px 14px", marginTop:12 }}>
              <RRow th={th} label="Fabric/vinyl strip width (cut)" value={fmtInch(sw)} accent big />
            </div>
            <NoteBox>
              <strong>Strip width is calibrated for vinyl/faux leather.</strong> Woven fabric is thinner and more compressible — try a strip 1/8" narrower and test-wrap your cord before cutting the full length.
            </NoteBox>
          </Card>

          <Card th={th}>
            <CardTitle th={th}>Material Thickness</CardTitle>
            <div style={{ fontSize:15, fontWeight:700, color:th.label, marginBottom:8, fontFamily:"Nunito,sans-serif" }}>Vinyl / fabric thickness</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
              {vinylPresets.map(p=>(
                <button key={p.l} onClick={()=>setVinylThick(p.v)} style={{
                  padding:"8px 14px", fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500,
                  borderRadius:8, cursor:"pointer",
                  background:Math.abs(vinylThick-p.v)<0.001?th.btnOn:th.btnOff,
                  color:Math.abs(vinylThick-p.v)<0.001?"#fff":th.btnOffTxt,
                  border:`2px solid ${Math.abs(vinylThick-p.v)<0.001?th.btnOn:th.border}`,
                  transition:"all 0.15s"
                }}>{p.l}</button>
              ))}
            </div>
            <InfoBox th={th}>
              Vinyl thickness affects cord length — the cord must curve along a slightly smaller radius than the sewline, staying clear of the needle. Default is 1/32" (standard vinyl/faux leather). Use 1/16" for heavier upholstery vinyl or cork. Adjust with easing as needed.
            </InfoBox>
          </Card>

          <Card th={th}>
            <CardTitle th={th}>Shape</CardTitle>
            <SubTabs th={th} active={shape} set={setShape}
              tabs={[{id:"rect",label:"Rectangle"},{id:"oval",label:"Oval/Circle"},{id:"three",label:"3-Sided"}]} />

            {shape==="rect"&&<>
              <InfoBox th={th}>Enter the cut dimensions of the panel receiving piping around its full perimeter. Use 0 for corner radius on square panels. Or enter the cut perimeter directly — use a flexible tape measure run along the cut edge of your panel.</InfoBox>
              <div style={{ display:"flex", gap:8, margin:"12px 0 4px" }}>
                <button style={togStyle(!rManual)} onClick={()=>setRManual(false)}>Calculate</button>
                <button style={togStyle(rManual)} onClick={()=>setRManual(true)}>Enter perimeter</button>
              </div>
              {!rManual?(
                <div style={{marginTop:10}}>
                  <div className="frac-row">
                    <FracInput th={th} label="Length (cut)" whole={rLW} frac={rLF} onWhole={setRLW} onFrac={setRLF} />
                    <FracInput th={th} label="Width (cut)" whole={rWW} frac={rWF} onWhole={setRWW} onFrac={setRWF} />
                  </div>
                  <FracInput th={th} label="Corner radius" sub="(cut edge — 0 for square)" whole={rrW} frac={rrF} onWhole={setRrW} onFrac={setRrF} />
                </div>
              ):(
                <div style={{marginTop:10}}>
                  <FracInput th={th} label="Cut perimeter (measured)" sub="— run a flexible tape along the cut edge" whole={rManW} frac={rManF} onWhole={setRManW} onFrac={setRManF} />
                </div>
              )}
            </>}

            {shape==="oval"&&<>
              <InfoBox th={th}>Enter the cut dimensions of the oval or circle. For a perfect circle, enter the same value for both axes. Or enter the cut perimeter directly — use a flexible tape measure run along the cut edge of your panel.</InfoBox>
              <div style={{ display:"flex", gap:8, margin:"12px 0 4px" }}>
                <button style={togStyle(!oManual)} onClick={()=>setOManual(false)}>Calculate</button>
                <button style={togStyle(oManual)} onClick={()=>setOManual(true)}>Enter perimeter</button>
              </div>
              {!oManual?(
                <div style={{marginTop:10}}>
                  <div className="frac-row">
                    <FracInput th={th} label="Long axis (cut)" whole={oAW} frac={oAF} onWhole={setOAW} onFrac={setOAF} />
                    <FracInput th={th} label="Short axis (cut)" whole={oBW} frac={oBF} onWhole={setOBW} onFrac={setOBF} />
                  </div>
                </div>
              ):(
                <div style={{marginTop:10}}>
                  <FracInput th={th} label="Cut perimeter (measured)" sub="— run a flexible tape along the cut edge" whole={oManW} frac={oManF} onWhole={setOManW} onFrac={setOManF} />
                </div>
              )}
            </>}

            {shape==="three"&&<>
              <InfoBox th={th}>Piping runs along the bottom and both sides of the panel. The strip has open tails at the top edge and does not form a closed loop.</InfoBox>
              <div style={{marginTop:14}}>
                <div className="frac-row">
                  <FracInput th={th} label="Panel width (cut)" whole={tLW} frac={tLF} onWhole={setTLW} onFrac={setTLF} />
                  <FracInput th={th} label="Panel height (cut)" whole={tHW} frac={tHF} onWhole={setTHW} onFrac={setTHF} />
                </div>
                <FracInput th={th} label="Corner radius" sub="(cut edge — 0 for square)" whole={trW} frac={trF} onWhole={setTrW} onFrac={setTrF} />
              </div>
            </>}
          </Card>

          <Card th={th}>
            <CardTitle th={th}>Cut Lengths</CardTitle>

            {/* Reference perimeters */}
            <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px", marginBottom:12 }}>
              <RRow th={th} label="Cut edge perimeter" value={fmtInch(cutP)} />
              <RRow th={th} label="Sewline perimeter" value={fmtInch(sewP)} />
              <RRow th={th} label="Strip width" value={fmtInch(sw)} />
            </div>

            {/* Two-column results */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              {/* Geometric */}
              <div style={{ background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:10, padding:"12px 12px 14px" }}>
                <div style={{ fontSize:11, fontWeight:900, letterSpacing:"0.08em", textTransform:"uppercase",
                  color:th.label, marginBottom:10, fontFamily:"Nunito,sans-serif",
                  borderBottom:`1.5px solid ${th.infoBdr}`, paddingBottom:6 }}>
                  Geometric
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:th.label, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>Strip length</div>
                <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent, marginBottom:10 }}>{fmtInch(stripLen)}</div>
                <div style={{ fontSize:11, fontWeight:700, color:th.label, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>Cord length</div>
                <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>{fmtInch(cordLen)}</div>
              </div>

              {/* Empirical */}
              <div style={{ background:th.resBg, border:`2px solid ${th.resAccent}`, borderRadius:10, padding:"12px 12px 14px" }}>
                <div style={{ fontSize:11, fontWeight:900, letterSpacing:"0.08em", textTransform:"uppercase",
                  color:th.resAccent, marginBottom:10, fontFamily:"Nunito,sans-serif",
                  borderBottom:`1.5px solid ${th.border}`, paddingBottom:6 }}>
                  Snug Fit
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:th.label, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>Strip length</div>
                <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent, marginBottom:10 }}>{fmtInch(empStripLen)}</div>
                <div style={{ fontSize:11, fontWeight:700, color:th.label, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>Cord length</div>
                <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>{fmtInch(empCordLen)}</div>
              </div>
            </div>

            <InfoBox th={th}>
              <strong>Geometric</strong> uses pure math — sewline perimeter offset by cord radius and vinyl thickness. <strong>Snug Fit</strong> is experience-derived, producing intentionally tighter results that ease cleanly onto the panel without puckering or shifting. For larger cord sizes, cross-check against the geometric value.
            </InfoBox>

            {closed?(
              <NoteBox>
                <strong>Closed loop assembly:</strong> Sew the fabric/vinyl strip into a loop first, pressing or taping the seam allowance open flat. Secure the cord inside with double-sided tape, then glue or tape the strip closed around the cord before easing it onto the panel and stitching.
                <br/><br/>
                <strong>Cord trim note:</strong> The cord is intentionally shorter than the strip. Trim it so each end sits between the open seam allowances of the vinyl strip — this reduces bulk when the piping is folded and closed up, and keeps the needle clear of the cord at the join.
                <br/><br/>
                <strong>Easing:</strong> Clip into the strip's seam allowance at curves and corners every 1/4"–3/8". A slightly snug fit is ideal — gentle stretching produces tighter, cleaner corners.
              </NoteBox>
            ):(
              <NoteBox>
                <strong>Open 3-sided run:</strong> Strip length includes a 1" tail at each end extending past the bag's top edge. These tails are caught in the top seam or trimmed after assembly.
                <br/><br/>
                <strong>Cord trim note:</strong> Trim the cord so each end sits between the open seam allowances of the vinyl strip — this reduces bulk when the piping is folded and closed up, and keeps the needle clear of the cord at the seam.
                <br/><br/>
                <strong>Easing:</strong> Clip into the strip's seam allowance at each rounded corner every 1/4"–3/8". A slightly snug fit is ideal — gentle stretching produces tighter, cleaner corners.
              </NoteBox>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — COLLAPSIBLE BOTTLE POCKET
// ══════════════════════════════════════════════════════════════════════════════

// ── Accordion SVG diagram ─────────────────────────────────────────────────────
function AccordionSVG({ segs, cutWidth, isDouble }) {
  const W=600, H=260;
  const mL=16, mR=16, mT=78, mB=48;  // mT=78 gives plenty of space above panels for cut width + dimension line
  const drawW = W - mL - mR;
  const px = drawW / cutWidth;
  const pH = H - mT - mB;
  const frontTop=mT, frontBot=mT+pH;
  const lift = pH*0.28;
  const backTop=frontTop-lift, backBot=frontBot-lift;
  const fillC   = { outer:"#7a5010", flap:"#2a5c1a", pf:"#1a5080", gap:"#6a1010" };
  const strokeC = { outer:"#c8900a", flap:"#60b830", pf:"#40b0e0", gap:"#d04040" };
  let xs=[mL];
  segs.forEach(s=>xs.push(xs[xs.length-1]+s.w*px));
  function planeFor(i){ const l=i>0?segs[i-1].t:null; const r=i<segs.length?segs[i].t:null; return (l==="pf"||r==="pf")?"front":"back"; }
  function tY(p){return p==="front"?frontTop:backTop;}
  function bY(p){return p==="front"?frontBot:backBot;}
  const polys=segs.map((seg,i)=>{ const x1=xs[i],x2=xs[i+1]; const pL=planeFor(i),pR=planeFor(i+1); return { x1,x2,tL:tY(pL),bL:bY(pL),tR:tY(pR),bR:bY(pR), fill:fillC[seg.t],stroke:strokeC[seg.t],label:seg.label,t:seg.t,w:x2-x1,lx:(x1+x2)/2 }; });
  const order=["outer","gap","flap","pf"];
  const sorted=[...polys].sort((a,b)=>order.indexOf(a.t)-order.indexOf(b.t));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="bpArrR" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto"><polyline points="0,0.5 5,3.5 0,6.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/></marker>
        <marker id="bpArrL" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polyline points="7,0.5 2,3.5 7,6.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/></marker>
        <filter id="bpSh" x="-4%" y="-4%" width="112%" height="112%"><feDropShadow dx="1" dy="1.5" stdDeviation="1.8" floodColor="rgba(0,0,0,0.55)"/></filter>
      </defs>

      {/* Cut width dimension line — top */}
      <line x1={mL+3} y1={backTop-16} x2={W-mR-3} y2={backTop-16} stroke="rgba(255,255,255,0.25)" strokeWidth="1" markerStart="url(#bpArrL)" markerEnd="url(#bpArrR)"/>
      <text x={W/2} y={backTop-22} textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="11" fill="rgba(255,255,255,0.45)">cut width: {fmtInch(cutWidth)}</text>

      {/* Panels */}
      {sorted.map((p,i)=>(
        <g key={i}>
          <polygon points={`${p.x1},${p.tL} ${p.x2},${p.tR} ${p.x2},${p.bR} ${p.x1},${p.bL}`} fill={p.fill} stroke={p.stroke} strokeWidth="1.3" filter="url(#bpSh)"/>
          {p.t==="gap" && (
            <>
              <line x1={p.lx} y1={p.tL+8} x2={p.lx} y2={p.bL-8} stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="4,3"/>
              {/* sew / rivet label — inside the gap panel, vertically centered */}
              <text x={p.lx} y={(p.tL+p.bL)/2} textAnchor="middle" dominantBaseline="middle" fontFamily="Nunito,sans-serif" fontSize="11" fontWeight="700" fill="rgba(255,200,120,0.95)">sew /</text>
              <text x={p.lx} y={(p.tL+p.bL)/2+14} textAnchor="middle" dominantBaseline="middle" fontFamily="Nunito,sans-serif" fontSize="11" fontWeight="700" fill="rgba(255,200,120,0.95)">rivet</text>
            </>
          )}
        </g>
      ))}

      {/* Panel labels */}
      {polys.map((p,i)=>( p.w>14 && p.t!=="gap" && <text key={i} x={p.lx} y={(p.tL+p.bL)/2} textAnchor="middle" dominantBaseline="middle" fontFamily="DM Mono,monospace" fontSize={p.w>60?13:p.w>32?11:9} fontWeight="600" fill="rgba(255,255,255,0.93)">{p.label}</text> ))}

      {/* Open bottom line + label */}
      <line x1={mL} y1={frontBot+4} x2={W-mR} y2={frontBot+4} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="5,4"/>
      <text x={W/2} y={frontBot+18} textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.35)" letterSpacing="0.06em">Pockets Open to Bottom of Bag</text>
    </svg>
  );
}

// ── Fit/validation notice ─────────────────────────────────────────────────────
function BPNotice({ type, children, th }) {
  const styles = {
    ok:   { bg:th.ok,   bdr:th.okBdr,   txt:th.okTxt   },
    warn: { bg:th.warn, bdr:th.warnBdr, txt:th.warnTxt },
    info: { bg:th.info, bdr:th.infoBdr, txt:th.infoTxt },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ background:s.bg, border:`1.5px solid ${s.bdr}`, borderRadius:8,
      padding:"10px 13px", marginTop:8, fontSize:14, fontWeight:600,
      color:s.txt, fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}

// ── Diameter illustration icon ────────────────────────────────────────────────
function DiameterIcon({ color }) {
  return (
    <svg viewBox="0 0 52 52" width="58" height="58"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink:0, opacity:0.85 }}>
      {/* Circle — lighter tint */}
      <circle cx="26" cy="26" r="19" fill="none" stroke={color} strokeWidth="2" opacity="0.35"/>
      {/* Dashed diameter line — full color */}
      <line x1="6" y1="26" x2="46" y2="26" stroke={color} strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* Left arrowhead — full color */}
      <polyline points="11,21 6,26 11,31" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Right arrowhead — full color */}
      <polyline points="41,21 46,26 41,31" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* ⌀ symbol */}
      <text x="26" y="20" textAnchor="middle" fontSize="11" fontWeight="800"
        fill={color} fontFamily="Nunito,sans-serif">⌀</text>
    </svg>
  );
}

function BottlePocketPage() {
  const th = T.blue;
  const [mode, setMode]             = useState("single");
  const [freeDouble, setFreeDouble] = useState(false);
  const [sa,  setSa]                = useState(0.375);
  const [cSa, setCsa]               = useState("");

  // Core inputs
  const [bagW,setBagW]=useState(0); const [bagF,setBagF]=useState(0);
  const [diaW,setDiaW]=useState(0); const [diaF,setDiaF]=useState(0);
  const [htW, setHtW] =useState(0); const [htF, setHtF] =useState(0);
  const [bufW,setBufW]=useState(0); const [bufF,setBufF]=useState(0);

  // Shared flap/pf — used in single, bottle-double, freeform-single
  const [flapW,setFlapW]=useState(0); const [flapF,setFlapF]=useState(0);
  const [pfW,  setPfW] =useState(0);  const [pfF,  setPfF] =useState(0);
  const [flapAuto, setFlapAuto] = useState(true);
  const [pfAuto,   setPfAuto]   = useState(true);

  // Independent flap/pf — freeform double only
  const [flap1W,setFlap1W]=useState(0); const [flap1F,setFlap1F]=useState(0);
  const [flap2W,setFlap2W]=useState(0); const [flap2F,setFlap2F]=useState(0);
  const [pf1W,  setPf1W] =useState(0);  const [pf1F,  setPf1F] =useState(0);
  const [pf2W,  setPf2W] =useState(0);  const [pf2F,  setPf2F] =useState(0);
  const [flap1Auto,setFlap1Auto]=useState(true);
  const [flap2Auto,setFlap2Auto]=useState(true);
  const [pf1Auto,  setPf1Auto]  =useState(true);
  const [pf2Auto,  setPf2Auto]  =useState(true);

  const isDouble        = mode==="double" || (mode==="freeform" && freeDouble);
  const isFreeform      = mode==="freeform";
  const isFreeformDouble= mode==="freeform" && freeDouble;

  const bagWidth   = bagW + bagF;
  const bottleDiam = diaW + diaF;
  const pocketHt   = htW  + htF;
  const buffer     = bufW + bufF;

  // ── Shared flap/pf (all modes except freeform-double) ────────────────────
  const neededCirc = isFreeform ? 0 : Math.ceil(bottleDiam * PI * 8) / 8;
  let flap = flapAuto
    ? (isFreeform ? 1.5 : roundTo8th(bottleDiam/2))
    : roundTo8th(flapW+flapF);
  if (isNaN(flap)||flap<=0) flap = isFreeform ? 1.5 : roundTo8th(bottleDiam/2);

  const minPF = roundTo8th(flap*2 + 0.25);
  let pf = pfAuto
    ? roundTo8th(Math.max(isDouble?(bagWidth-flap*6)/2 : bagWidth-flap*4, minPF))
    : roundTo8th(pfW+pfF);
  if (isNaN(pf)||pf<=0) pf = minPF;

  const stitchLoss = isDouble ? 0.625 : 0.5;
  const actualCirc = roundTo8th(pf*2 + flap*4 - stitchLoss);
  const circumDiff = roundTo8th(actualCirc - neededCirc);

  // ── Freeform-double independent flap/pf ──────────────────────────────────
  let flap1 = flap1Auto ? 1.5 : roundTo8th(flap1W+flap1F);
  if (isNaN(flap1)||flap1<=0) flap1 = 1.5;
  let flap2 = flap2Auto ? 1.5 : roundTo8th(flap2W+flap2F);
  if (isNaN(flap2)||flap2<=0) flap2 = 1.5;

  const outer1   = roundTo8th(flap1 + sa + buffer);
  const outer2   = roundTo8th(flap2 + sa + buffer);
  const gap12    = roundTo8th(flap1 + flap2);
  const minPF1   = roundTo8th(flap1*2 + 0.25);
  const minPF2   = roundTo8th(flap2*2 + 0.25);
  const sc12     = 1.0; // stitch compensation
  const totalForPFs = roundTo8th(bagWidth - 4*flap1 - 4*flap2 - 2*(sa+buffer) - sc12);

  let pf1, pf2;
  if (pf1Auto && pf2Auto) {
    pf1 = pf2 = roundTo8th(Math.max(totalForPFs/2, Math.max(minPF1, minPF2)));
  } else if (pf1Auto) {
    pf2 = roundTo8th(pf2W+pf2F); if(isNaN(pf2)||pf2<=0) pf2=minPF2;
    pf1 = roundTo8th(Math.max(totalForPFs - pf2, minPF1));
  } else if (pf2Auto) {
    pf1 = roundTo8th(pf1W+pf1F); if(isNaN(pf1)||pf1<=0) pf1=minPF1;
    pf2 = roundTo8th(Math.max(totalForPFs - pf1, minPF2));
  } else {
    pf1 = roundTo8th(pf1W+pf1F); if(isNaN(pf1)||pf1<=0) pf1=minPF1;
    pf2 = roundTo8th(pf2W+pf2F); if(isNaN(pf2)||pf2<=0) pf2=minPF2;
  }

  // ── Unified cut dimensions ────────────────────────────────────────────────
  const outerEach  = roundTo8th(flap + sa + buffer);
  const stitchComp = isDouble ? 1.0 : 0.5;
  let cutWidth, finFaceW, segs;

  if (isFreeformDouble) {
    cutWidth  = roundTo8th(outer1+flap1+pf1+flap1+gap12+flap2+pf2+flap2+outer2+sc12);
    finFaceW  = roundTo8th(pf1+pf2);
    segs = [
      {t:"outer",w:outer1,label:"Outer 1"},
      {t:"flap", w:flap1, label:"F1"},
      {t:"pf",   w:pf1,   label:"PF 1"},
      {t:"flap", w:flap1, label:"F1"},
      {t:"gap",  w:gap12, label:"Gap"},
      {t:"flap", w:flap2, label:"F2"},
      {t:"pf",   w:pf2,   label:"PF 2"},
      {t:"flap", w:flap2, label:"F2"},
      {t:"outer",w:outer2,label:"Outer 2"},
    ];
  } else if (isDouble) {
    cutWidth  = roundTo8th(outerEach*2+flap*6+pf*2+stitchComp);
    finFaceW  = roundTo8th(pf*2);
    segs = [
      {t:"outer",w:outerEach,label:"Outer"},
      {t:"flap", w:flap,     label:"F"},
      {t:"pf",   w:pf,       label:"PF 1"},
      {t:"flap", w:flap,     label:"F"},
      {t:"gap",  w:flap*2,   label:"Gap"},
      {t:"flap", w:flap,     label:"F"},
      {t:"pf",   w:pf,       label:"PF 2"},
      {t:"flap", w:flap,     label:"F"},
      {t:"outer",w:outerEach,label:"Outer"},
    ];
  } else {
    cutWidth  = roundTo8th(outerEach*2+flap*2+pf+stitchComp);
    finFaceW  = pf;
    segs = [
      {t:"outer",w:outerEach,label:"Outer"},
      {t:"flap", w:flap,     label:"F"},
      {t:"pf",   w:pf,       label:"PF"},
      {t:"flap", w:flap,     label:"F"},
      {t:"outer",w:outerEach,label:"Outer"},
    ];
  }

  const cutHeight  = roundTo8th(pocketHt + 0.5);
  const stabHeight = roundTo8th(pocketHt - 0.25);
  const ready      = bagWidth>0 && pocketHt>0 && (isFreeform||bottleDiam>0);

  // ── Centering: split extra panel width equally between both outer edges ───
  // When bagWidth is set and larger than the raw cut width, the extra space is
  // divided equally so the pocket assembly sits centered within the panel.
  const extraPerSide = (bagWidth>0 && cutWidth<bagWidth)
    ? Math.max(0, roundTo8th((bagWidth - cutWidth) / 2)) : 0;
  const outerEachC = roundTo8th(outerEach + extraPerSide);
  const outer1C    = roundTo8th((isFreeformDouble?outer1:outerEach) + extraPerSide);
  const outer2C    = roundTo8th((isFreeformDouble?outer2:outerEach) + extraPerSide);
  const cutWidthFinal = roundTo8th(cutWidth + 2*extraPerSide);
  const stabWidth     = roundTo8th(cutWidthFinal - sa*2 - 1.0);
  // Patch segs outer widths in-place so marking guide and SVG auto-update
  if (extraPerSide > 0) {
    segs[0] = {...segs[0], w: isFreeformDouble?outer1C:outerEachC};
    segs[segs.length-1] = {...segs[segs.length-1], w: isFreeformDouble?outer2C:outerEachC};
  }

  // ── Fit notice (bottle modes only) ───────────────────────────────────────
  let fitType="info", fitMsg="";
  if (!isFreeform && ready) {
    if (circumDiff < 0)
      { fitType="warn"; fitMsg="Too tight — won" + "'" + "t fit. Increase flap or pocket front."; }
    else if (circumDiff < 0.125)
      { fitType="warn"; fitMsg="Very snug — no ease. Consider adding 1/8" + '"' + "–1/4" + '"' + "."; }
    else if (circumDiff < 0.5)
      { fitType="ok";   fitMsg="Snug fit — good for bottles. Pocket will hold securely."; }
    else if (circumDiff < neededCirc*0.20)
      { fitType="ok";   fitMsg="Comfortable fit — bottle sits well with a little room."; }
    else
      { fitType="info"; fitMsg="Roomy fit — may not hold securely when bag moves."; }
  }

  // ── Bag width validation ──────────────────────────────────────────────────
  let bagType="ok", bagMsg="";
  if (ready) {
    if (finFaceW > bagWidth)
      { bagType="warn"; bagMsg="Pocket face (" + fmtInch(finFaceW) + ") exceeds available width (" + fmtInch(bagWidth) + "). Reduce pocket front width."; }
    else if (bagWidth - finFaceW < 0.25)
      { bagType="info"; bagMsg="Pocket face (" + fmtInch(finFaceW) + ") fits with very little clearance."; }
    else
      { bagType="ok";   bagMsg="Pocket face (" + fmtInch(finFaceW) + ") fits within the available width (" + fmtInch(bagWidth) + ")."; }
  }

  // ── Cumulative marking guide ──────────────────────────────────────────────
  let cum=0;
  const cumItems = segs.map((s,i)=>{
    cum = roundTo8th(cum+s.w);
    const names={outer:"Outer edge",flap:"Flap",pf:"Pocket Front",gap:"Center Gap"};
    return {cum, name:names[s.t]||s.label, w:s.w, last:i===segs.length-1};
  });

  function resetAutos(){ setFlapAuto(true);setPfAuto(true);setFlap1Auto(true);setFlap2Auto(true);setPf1Auto(true);setPf2Auto(true); }

  const modeTabs = [
    {id:"single",   label:"Single Bottle"},
    {id:"double",   label:"Double Bottle"},
    {id:"freeform", label:"Freeform"},
  ];
  const modeCaption = {
    single:   "Sized for one bottle or object. Pocket face width is auto-calculated to fit your panel.",
    double:   "Two side-by-side pockets on one strip, joined at a shared center gap.",
    freeform: "Set your own flap and pocket front dimensions without a bottle diameter.",
  };

  // ── Auto/custom badge + reset row ────────────────────────────────────────
  function AutoBadge({isAuto, onReset, th}) {
    return (
      <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,fontWeight:700,background:isAuto?th.resBg:"#fff3e0",
          color:isAuto?th.resAccent:"#b25a00",padding:"2px 8px",borderRadius:10,fontFamily:"Nunito,sans-serif"}}>
          {isAuto?"auto":"custom"}
        </span>
        {!isAuto && <button onClick={onReset} style={{fontSize:11,fontWeight:800,fontFamily:"Nunito,sans-serif",
          background:"transparent",border:`1px solid ${th.border}`,borderRadius:6,
          padding:"2px 8px",cursor:"pointer",color:th.sub}}>reset</button>}
      </span>
    );
  }

  return (
    <div style={{minHeight:"100vh", padding:"16px 16px 80px"}}>
      <SABar sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} th={th}/>

      <div style={{background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(26,74,122,0.12)"}}>
        <SecHeader th={th}
          title="Accordion Pocket Calculator"
          sub="An open-bottomed accordion-fold pocket that expands to fit its contents and collapses flat when empty — ideal for water bottles, sunglass cases, or anything that benefits from a self-adjusting fit."/>

        <div style={{padding:"16px 16px 20px"}}>

          {/* Explainer */}
          <InfoBox th={th}>
            Unlike a fixed pocket, the open bottom means depth is never constrained — the pocket grows with its contents and folds away when not in use. The accordion fold distributes material evenly on both sides of the pocket face, keeping the profile slim and the construction clean. Single-bottle mode fits one object; Double fits two side by side; Freeform lets you define your own proportions.
          </InfoBox>

          {/* Mode tabs */}
          <div style={{marginTop:14}}>
            <SubTabs th={th} active={mode} set={v=>{setMode(v);resetAutos();}} tabs={modeTabs}/>
            <div style={{fontSize:13,fontWeight:600,color:th.sub,fontFamily:"Nunito,sans-serif",
              fontStyle:"italic",marginBottom:14,marginTop:-6,lineHeight:1.4}}>
              {modeCaption[mode]}
            </div>
          </div>

          {mode==="freeform" && (
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,
              padding:"10px 14px",background:th.card,border:`1.5px solid ${th.border}`,borderRadius:8}}>
              <span style={{fontSize:14,fontWeight:700,color:th.label,fontFamily:"Nunito,sans-serif"}}>
                {freeDouble?"Double":"Single"} pocket
              </span>
              <button onClick={()=>setFreeDouble(d=>!d)} style={{
                padding:"6px 14px",fontSize:13,fontWeight:800,fontFamily:"Nunito,sans-serif",
                borderRadius:8,border:"none",cursor:"pointer",background:th.btnOn,color:"#fff"}}>
                Toggle
              </button>
            </div>
          )}

          {/* Inputs */}
          <Card th={th}>
            <CardTitle th={th}>Measurements</CardTitle>
            <div style={{marginTop:4}}>
              <FracInput th={th}
                label="Available Panel Width"
                sub="finished width of the area where the pocket will be applied"
                whole={bagW} frac={bagF}
                onWhole={v=>{setBagW(v);resetAutos();}} onFrac={v=>{setBagF(v);resetAutos();}}/>

              {!isFreeform && (
                <FracInput th={th} label="Bottle / Object Diameter" sub={`measure at the widest point, then add 1/4" so it slides in and out easily`}
                  whole={diaW} frac={diaF}
                  onWhole={v=>{setDiaW(v);resetAutos();}} onFrac={v=>{setDiaF(v);resetAutos();}}
                  append={<DiameterIcon color={th.label}/>}/>              )}

              <FracInput th={th} label="Finished Pocket Height"
                  whole={htW} frac={htF} onWhole={setHtW} onFrac={setHtF}/>
              <FracInput th={th} label="Outer Buffer (each side)" sub="extra fabric on each side — will be trimmed to your SA when sewing the pocket into the bag"
                  whole={bufW} frac={bufF} onWhole={setBufW} onFrac={setBufF}/>
            </div>

            <Divider th={th}/>

            {/* ── Freeform-double: independent flap1/pf1 and flap2/pf2 ── */}
            {isFreeformDouble ? (<>
              {/* Pocket 1 */}
              <div style={{background:th.resBg,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.07em",textTransform:"uppercase",
                  color:th.resAccent,marginBottom:8,fontFamily:"Nunito,sans-serif"}}>Pocket 1</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Flap Width</div>
                  <AutoBadge isAuto={flap1Auto} onReset={()=>setFlap1Auto(true)} th={th}/>
                </div>
                <FracInput th={th} label="" sub="how wide each fold is for pocket 1 — controls how much it expands"
                  whole={flap1Auto?Math.floor(flap1):flap1W}
                  frac={flap1Auto?roundTo8th(flap1-Math.floor(flap1)):flap1F}
                  onWhole={v=>{setFlap1Auto(false);setFlap1W(v);setFlap1F(roundTo8th(flap1-Math.floor(flap1)));}}
                  onFrac={v=>{setFlap1Auto(false);setFlap1F(v);setFlap1W(Math.floor(flap1));}}/>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,marginTop:4}}>
                  <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Pocket Front Width</div>
                  <AutoBadge isAuto={pf1Auto} onReset={()=>setPf1Auto(true)} th={th}/>
                </div>
                <FracInput th={th} label="" sub={`the visible face of pocket 1 — must be at least twice the flap width plus 1/4"`}
                  whole={pf1Auto?Math.floor(pf1):pf1W}
                  frac={pf1Auto?roundTo8th(pf1-Math.floor(pf1)):pf1F}
                  onWhole={v=>{setPf1Auto(false);setPf1W(v);setPf1F(roundTo8th(pf1-Math.floor(pf1)));}}
                  onFrac={v=>{setPf1Auto(false);setPf1F(v);setPf1W(Math.floor(pf1));}}/>
                {ready && pf1 < minPF1 && <BPNotice type="warn" th={th}>Pocket front 1 ({fmtInch(pf1)}) must be at least {fmtInch(minPF1)} (flap1 x 2 + 1/4").</BPNotice>}
              </div>

              {/* Pocket 2 */}
              <div style={{background:th.resBg,borderRadius:8,padding:"10px 12px",marginBottom:4}}>
                <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.07em",textTransform:"uppercase",
                  color:th.resAccent,marginBottom:8,fontFamily:"Nunito,sans-serif"}}>Pocket 2</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Flap Width</div>
                  <AutoBadge isAuto={flap2Auto} onReset={()=>setFlap2Auto(true)} th={th}/>
                </div>
                <FracInput th={th} label="" sub="how wide each fold is for pocket 2 — controls how much it expands"
                  whole={flap2Auto?Math.floor(flap2):flap2W}
                  frac={flap2Auto?roundTo8th(flap2-Math.floor(flap2)):flap2F}
                  onWhole={v=>{setFlap2Auto(false);setFlap2W(v);setFlap2F(roundTo8th(flap2-Math.floor(flap2)));}}
                  onFrac={v=>{setFlap2Auto(false);setFlap2F(v);setFlap2W(Math.floor(flap2));}}/>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,marginTop:4}}>
                  <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Pocket Front Width</div>
                  <AutoBadge isAuto={pf2Auto} onReset={()=>setPf2Auto(true)} th={th}/>
                </div>
                <FracInput th={th} label="" sub={`the visible face of pocket 2 — must be at least twice the flap width plus 1/4"`}
                  whole={pf2Auto?Math.floor(pf2):pf2W}
                  frac={pf2Auto?roundTo8th(pf2-Math.floor(pf2)):pf2F}
                  onWhole={v=>{setPf2Auto(false);setPf2W(v);setPf2F(roundTo8th(pf2-Math.floor(pf2)));}}
                  onFrac={v=>{setPf2Auto(false);setPf2F(v);setPf2W(Math.floor(pf2));}}/>
                {ready && pf2 < minPF2 && <BPNotice type="warn" th={th}>Pocket front 2 ({fmtInch(pf2)}) must be at least {fmtInch(minPF2)} (flap2 x 2 + 1/4").</BPNotice>}
              </div>

              <div style={{background:th.info,border:`1.5px solid ${th.infoBdr}`,borderRadius:8,
                padding:"8px 12px",marginTop:8,fontSize:13,fontWeight:600,color:th.infoTxt,fontFamily:"Nunito,sans-serif"}}>
                Center gap = Flap 1 ({fmtInch(flap1)}) + Flap 2 ({fmtInch(flap2)}) = <strong>{fmtInch(gap12)}</strong>
              </div>
              {ready && <div style={{marginTop:8}}><BPNotice type={bagType} th={th}>{bagMsg}</BPNotice></div>}
            </>) : (<>
              {/* Shared flap */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Flap Width (each)</div>
                <AutoBadge isAuto={flapAuto} onReset={()=>setFlapAuto(true)} th={th}/>
              </div>
              <FracInput th={th} label=""
                sub={isFreeform?"how wide each fold is — controls how much the pocket expands":"half your bottle diameter — controls how wide the pocket folds open"}
                whole={flapAuto?Math.floor(flap):flapW}
                frac={flapAuto?roundTo8th(flap-Math.floor(flap)):flapF}
                onWhole={v=>{setFlapAuto(false);setFlapW(v);setFlapF(roundTo8th(flap-Math.floor(flap)));}}
                onFrac={v=>{setFlapAuto(false);setFlapF(v);setFlapW(Math.floor(flap));}}/>
              {!isFreeform && ready && fitMsg && (
                <BPNotice type={fitType} th={th}>
                  Pocket circumference: {fmtInch(actualCirc)} · Needed for {fmtInch(bottleDiam)} bottle: {fmtInch(neededCirc)} · {fitMsg}
                </BPNotice>
              )}

              {/* Shared pf */}
              <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0 4px"}}>
                <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>Pocket Front Width</div>
                <AutoBadge isAuto={pfAuto} onReset={()=>setPfAuto(true)} th={th}/>
              </div>
              <FracInput th={th} label=""
                sub="the visible face of the pocket — auto-set to fit your panel width. Tap reset to return to auto."
                whole={pfAuto?Math.floor(pf):pfW}
                frac={pfAuto?roundTo8th(pf-Math.floor(pf)):pfF}
                onWhole={v=>{setPfAuto(false);setPfW(v);setPfF(roundTo8th(pf-Math.floor(pf)));}}
                onFrac={v=>{setPfAuto(false);setPfF(v);setPfW(Math.floor(pf));}}/>
              {ready && pf < minPF && (
                <BPNotice type="warn" th={th}>
                  Pocket front ({fmtInch(pf)}) must be at least {fmtInch(minPF)} (flap x 2 + 1/4") for accordion construction.
                </BPNotice>
              )}
              {ready && <div style={{marginTop:8}}><BPNotice type={bagType} th={th}>{bagMsg}</BPNotice></div>}
            </>)}
          </Card>

          {/* Results */}
          {ready && (<>
            <Card th={th}>
              <CardTitle th={th}>Calculated Dimensions · {isFreeformDouble?"Freeform Double":isDouble?"Double":"Single"}</CardTitle>
              <div style={{fontSize:13, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
                lineHeight:1.5, marginBottom:10}}>
                Cut <strong style={{color:th.label}}>2 identical pieces</strong> at these dimensions — they'll be placed right-sides-together, sewn along the top and bottom edges, then turned right-side-out to form the pocket.
              </div>
              <NoteBox>
                <strong>Interfacing tip:</strong> For quilting cotton, fuse a woven fusible interfacing to the wrong side of <strong>both</strong> pieces before sewing — interfacing both layers prevents wrinkling and gives the pocket a crisp, durable finish. Recommended: Pellon SF101 Shape-Flex or Profuse Flexible Fusible Woven (both available at wawak.com). For vinyl, canvas, or structured fabrics, skip the interfacing.
              </NoteBox>
              <div style={{background:th.resBg,borderRadius:8,padding:"12px 14px"}}>
                {[
                  ["Cut Fabric Width",   fmtInch(cutWidthFinal),  true],
                  ["Cut Fabric Height",  fmtInch(cutHeight), true],
                  isFreeformDouble
                    ? ["Pocket Face 1 Width", fmtInch(pf1), false]
                    : [isDouble?"Finished Pocket Faces Width":"Finished Pocket Face Width", fmtInch(finFaceW), false],
                  ...(isFreeformDouble?[["Pocket Face 2 Width", fmtInch(pf2), false]]:[]),
                  ["Finished Pocket Height", fmtInch(pocketHt), false],
                  isFreeformDouble
                    ? ["Flap 1 Width", fmtInch(flap1), false]
                    : ["Flap Width (each)", fmtInch(flap), false],
                  ...(isFreeformDouble?[["Flap 2 Width", fmtInch(flap2), false]]:[]),
                  isFreeformDouble
                    ? ["Outer Edge 1", fmtInch(outer1C), false]
                    : ["Outer Edge (each side)", fmtInch(outerEachC), false],
                  ...(isFreeformDouble?[["Outer Edge 2", fmtInch(outer2C), false]]:[]),
                  isFreeformDouble
                    ? ["Center Gap (Flap1 + Flap2)", fmtInch(gap12), false]
                    : isDouble?["Center Gap (2 flaps)", fmtInch(flap*2), false]:null,
                  ["Seam Allowance", fmtInch(sa), false],
                  ["Outer Buffer",   fmtInch(buffer), false],
                ].filter(Boolean).map(([lbl,val,big])=>(
                  <RRow key={lbl} th={th} label={lbl} value={val} accent={big} big={big}/>
                ))}
              </div>
              <InfoBox th={th}>
                {isFreeformDouble
                  ? "The outer pocket edges (Outer 1: " + fmtInch(outer1C) + ", Outer 2: " + fmtInch(outer2C) + ") will be unfinished. Baste those raw edges to your desired bag panel and trim any excess."
                  : "The outer pocket edges (" + fmtInch(outerEachC) + " each side) will be unfinished. Baste those raw edges to your desired bag panel and trim any excess."}
              </InfoBox>
            </Card>

            <Card th={th}>
              <CardTitle th={th}>✦ Stabilizer — Decovil Light 525 or Thin Foam</CardTitle>
              <div style={{background:th.resBg,borderRadius:8,padding:"12px 14px"}}>
                <RRow th={th} label="Stabilizer Width"  value={fmtInch(stabWidth)} />
                <RRow th={th} label="Stabilizer Height" value={fmtInch(stabHeight)}/>
              </div>
            </Card>

            <div style={{background:"#1a2a3a",borderRadius:10,padding:"4px 10px 10px",marginBottom:12}}>
              <AccordionSVG segs={segs} cutWidth={cutWidthFinal} isDouble={isDouble}/>
            </div>

            <Card th={th}>
              <CardTitle th={th}>Fabric Marking Guide — measure from one raw edge</CardTitle>
              {cumItems.map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"baseline",gap:10,padding:"5px 0",borderBottom:`1px solid ${th.border}`}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:17,fontWeight:500,color:th.resAccent,minWidth:64,textAlign:"right"}}>{fmtInch(c.cum)}</div>
                  <div style={{fontSize:13,color:"rgba(0,0,0,0.4)",flexShrink:0}}>—</div>
                  <div style={{fontSize:13,fontWeight:600,color:th.label,fontFamily:"Nunito,sans-serif"}}>
                    {c.last?"end of fabric":`mark at ${fmtInch(c.cum)}`}
                    <span style={{fontWeight:400,color:th.sub}}> · {c.name} = {fmtInch(c.w)}</span>
                  </div>
                </div>
              ))}
            </Card>

            <Card th={th}>
              <CardTitle th={th}>✦ Important Notes</CardTitle>
              {[
                ["Pocket Placement","Position the pocket at least 1/2\" above the bag" + "'" + "s bottom seam or any curved angles. Keep clear of seam allowances and curved seam areas."],
                ...(isDouble?[["Attachment at Center Gap", isFreeformDouble
                  ? "Mark the center of the gap (" + fmtInch(gap12) + ") and sew a straight stitch or place several rivets through the gap into the bag interior."
                  : "After attaching outer edges, sew a straight stitch or place rivets through the center gap to secure the pocket to the bag interior."
                ]]:[] ),
                isFreeformDouble
                  ? ["Outer Edges","Outer edge 1 (" + fmtInch(outer1C) + ") and outer edge 2 (" + fmtInch(outer2C) + ") are raw — trim each to your exact SA when attaching to the bag interior."]
                  : ["Outer Buffer","The outer edges (" + fmtInch(outerEachC) + " each side) include extra fabric. Trim to your exact SA when attaching."],
                ["Fold Direction","All flaps fold away from the pocket front so the pocket collapses flat when empty."],
                ["Stress Points","Backstitch several times at the top and bottom of each 1/8\" fold stitch — these points take the most wear."],
              ].map(([title,body])=>(
                <div key={title} style={{padding:"6px 0",borderBottom:`1px solid ${th.border}`}}>
                  <div style={{fontSize:14,fontWeight:800,color:th.label,fontFamily:"Nunito,sans-serif"}}>{title}</div>
                  <div style={{fontSize:13,fontWeight:600,color:th.sub,fontFamily:"Nunito,sans-serif",lineHeight:1.5,marginTop:2}}>{body}</div>
                </div>
              ))}
            </Card>

            <Card th={th}>
              <CardTitle th={th}>Construction Steps</CardTitle>
              {[
                "Cut 2 fabric pieces: " + fmtInch(cutWidthFinal) + " wide x " + fmtInch(cutHeight) + " tall. Cut 1 stabilizer: " + fmtInch(stabWidth) + " x " + fmtInch(stabHeight) + ".",
                "Center and fuse stabilizer to wrong side of one fabric piece, leaving even margins on all sides.",
                "Place pieces right sides together. Sew top and bottom edges at " + fmtInch(sa) + " SA. Turn right side out and press flat. Add binding to top edge if desired.",
                "Mark all fold lines using the guide above — measure from one raw edge using an erasable or heat pen.",
                "Sew exactly on each marked line with matching thread. Remove marks with heat or a stiff brush.",
                "Fold accordion-style, all flaps folding away from the pocket front(s). At each fold, stitch 1/8\" from the folded edge, backstitching several times at top and bottom.",
                "Position the pocket at least 1/2\" above the bag's bottom seam. Baste the outer raw edges to your bag panel and trim any excess. Leave the bottom open." + (isDouble?" Secure the center gap with a stitch line or rivets.":""),
              ].map((step,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${th.border}`}}>
                  <div style={{fontSize:13,fontWeight:900,color:th.accent,fontFamily:"DM Mono,monospace",minWidth:20,flexShrink:0}}>{i+1}.</div>
                  <div style={{fontSize:13,fontWeight:600,color:th.label,fontFamily:"Nunito,sans-serif",lineHeight:1.55}}>{step}</div>
                </div>
              ))}
            </Card>
          </>)}

          {!ready && (
            <div style={{textAlign:"center",padding:"32px 20px",color:th.sub,fontFamily:"Nunito,sans-serif",fontSize:15,fontWeight:600}}>
              Enter the available panel width and pocket height{!isFreeform?" and bottle diameter":""} above to calculate.
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom warning banner */}
      {ready && finFaceW > bagWidth && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:520,zIndex:50,background:"#b91c1c",
          borderTop:"3px solid #fca5a5",padding:"14px 20px 22px",
          boxShadow:"0 -4px 24px rgba(185,28,28,0.5)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{fontSize:22,flexShrink:0}}>⚠️</div>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:"#fff",fontFamily:"Nunito,sans-serif",marginBottom:3}}>
                Pocket too wide for this panel!
              </div>
              <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.88)",fontFamily:"Nunito,sans-serif",lineHeight:1.4}}>
                Pocket face ({fmtInch(finFaceW)}) exceeds the available panel width ({fmtInch(bagWidth)}). Reduce pocket front width or increase the available width.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Obfuscated email footer ───────────────────────────────────────────────────
function ContactFooter() {
  const [shown, setShown] = useState(false);
  // assembled at runtime — never a plain string in source
  const parts = ["moonshot", ".", "bagcalc", "@", "gmail", ".", "com"];
  const email = parts.join("");
  return (
    <div style={{
      background:"#140d30", borderTop:"1px solid rgba(255,255,255,0.08)",
      padding:"24px 20px 32px", textAlign:"center", borderRadius:"5px 5px 0 0",
    }}>
      <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.35)", marginBottom:10, fontFamily:"Nunito,sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" }}>
        Questions or feedback?
      </div>
      {!shown ? (
        <button onClick={()=>setShown(true)} style={{
          fontSize:13, fontWeight:800, fontFamily:"Nunito,sans-serif",
          background:"rgba(152,128,216,0.15)", color:"#b8a8e8",
          border:"1.5px solid rgba(152,128,216,0.3)", borderRadius:8,
          padding:"8px 18px", cursor:"pointer",
        }}>
          Show contact email
        </button>
      ) : (
        <a href={`mailto:${email}`} style={{
          fontSize:14, fontWeight:700, fontFamily:"DM Mono,monospace",
          color:"#b8a8e8", textDecoration:"none",
          borderBottom:"1px dashed rgba(184,168,232,0.4)",
        }}>{email}</a>
      )}
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:16, fontFamily:"Nunito,sans-serif" }}>
        © Moonshot · made with love for the bag-making community
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 5 — ADVANCED PANELS (Coming Soon)
// ══════════════════════════════════════════════════════════════════════════════
function AdvancedPage() {
  const th = T.advanced;
  const [sub, setSub] = useState("trapezoid");

  const subTabs = [
    {id:"trapezoid", label:"Trapezoid"},
    {id:"bezier",    label:"Bezier Curves"},
    {id:"oval",      label:"Oval Panels"},
    {id:"asymmetric",label:"Asymmetric"},
  ];

  return (
    <div style={{minHeight:"100vh", padding:"16px 16px 48px"}}>
      <div style={{background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(44,74,110,0.12)"}}>
        <SecHeader th={th}
          title="Advanced Panels"
          sub="Complex panel shapes for sophisticated bag construction — trapezoids, Bezier curves, ovals, and asymmetric forms."/>

        <div style={{padding:"16px 16px 20px"}}>
          <SubTabs th={th} active={sub} set={setSub} tabs={subTabs}/>

          {/* Coming Soon banner */}
          <div style={{background:"#7a1a2e", borderRadius:10, padding:"24px 20px",
            textAlign:"center", marginBottom:16}}>
            <div style={{fontSize:32, marginBottom:8}}>🚀</div>
            <div style={{fontSize:20, fontWeight:900, color:"#fff",
              fontFamily:"Nunito,sans-serif", marginBottom:8}}>
              Coming Soon
            </div>
            <div style={{fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.75)",
              fontFamily:"Nunito,sans-serif", lineHeight:1.6}}>
              This section is actively in development.<br/>
              Advanced panel calculations are on the way!
            </div>
          </div>

          {sub==="trapezoid" && (
            <Card th={th}>
              <CardTitle th={th}>Trapezoid with Rounded Corners</CardTitle>
              <InfoBox th={th}>
                Calculate cut dimensions for a 4-sided panel where the top and bottom edges differ in length — like a tapered bag bottom or a wedge-shaped panel. Supports rounded corners on all 4 vertices with independent radii.
              </InfoBox>
              <div style={{marginTop:12, padding:"20px", textAlign:"center",
                background:th.resBg, borderRadius:8, color:th.sub,
                fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:600}}>
                Inputs: Top width · Bottom width · Height · 4 corner radii · SA<br/>
                Outputs: Cut dimensions · Sewline perimeter · Side panel lengths
              </div>
            </Card>
          )}

          {sub==="bezier" && (
            <Card th={th}>
              <CardTitle th={th}>Bezier-Crowned Sides</CardTitle>
              <InfoBox th={th}>
                Add a gentle outward curve (crown) to the straight sections of a rectangular or trapezoidal panel. The curved sides connect smoothly into the corner arcs. Perimeter is calculated using numerical integration for precision cutting.
              </InfoBox>
              <div style={{marginTop:12, padding:"20px", textAlign:"center",
                background:th.resBg, borderRadius:8, color:th.sub,
                fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:600}}>
                Inputs: Panel L × W · Corner radius · Crown height · SA<br/>
                Outputs: Cut dimensions · True curved perimeter · Gusset strip length
              </div>
            </Card>
          )}

          {sub==="oval" && (
            <Card th={th}>
              <CardTitle th={th}>Oval & Ellipse Panels</CardTitle>
              <InfoBox th={th}>
                True oval and ellipse panel calculations — not just a rectangle with large corner radii. Uses the Ramanujan approximation for ellipse perimeter, with side panel sizing for attaching to a gusset strip.
              </InfoBox>
              <div style={{marginTop:12, padding:"20px", textAlign:"center",
                background:th.resBg, borderRadius:8, color:th.sub,
                fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:600}}>
                Inputs: Long axis · Short axis · SA<br/>
                Outputs: Cut dimensions · Sewline perimeter · Gusset strip length
              </div>
            </Card>
          )}

          {sub==="asymmetric" && (
            <Card th={th}>
              <CardTitle th={th}>Asymmetric Panels</CardTitle>
              <InfoBox th={th}>
                For panels where opposite sides differ — different radii per corner, non-parallel edges, or mixed straight and curved sections. Useful for structured bags with unique silhouettes.
              </InfoBox>
              <div style={{marginTop:12, padding:"20px", textAlign:"center",
                background:th.resBg, borderRadius:8, color:th.sub,
                fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:600}}>
                Inputs: Per-corner dimensions and radii · SA<br/>
                Outputs: Full perimeter · Side panel pair lengths
              </div>
            </Card>
          )}

          <NoteBox>
            <strong>Want to help shape this section?</strong> If you have specific panel shapes you work with regularly, reach out — your real-world examples directly influence what gets built next.
          </NoteBox>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
const PAGES=[
  {id:"lid",    label:"Lid & Bottom", color:"#5a2da0"},
  {id:"gusset", label:"Gusset",       color:"#1a6e3a"},
  {id:"piping", label:"Piping",       color:"#8e1a9e"},
  {id:"bottle",   label:"Accordion",   color:"#1a4a7a"},
  {id:"advanced", label:"Advanced",    color:"#7a1a2e"},
];

function IntroCard() {
  return (
    <div style={{
      margin:"0", padding:"18px 20px",
      background:"linear-gradient(135deg, #2a1860 0%, #1a0e40 100%)",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
      borderRadius:"0 0 5px 5px",
      marginTop:-6, paddingTop:24,
      position:"relative", zIndex:1,
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#c8b8f0", marginBottom:6, fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em" }}>
        Hi, I'm Abby 👋
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.72)", lineHeight:1.6, fontFamily:"Nunito,sans-serif" }}>
        I'm a bag maker and designer obsessed with getting the math right. I built this calculator for myself and figured other makers could use it too. It's free, it's a work in progress, and I hope it saves you some seam-ripping.
      </div>
    </div>
  );
}

export default function MoonshotBagCalc() {
  const [page, setPage] = useState("lid");
  const scrollPositions = useRef({});
  const visitedTabs     = useRef(new Set(["lid"]));

  // ── Page-reactive background patterns ──────────────────────────────────────
  const PAGE_PATTERNS = {
    lid: {
      color: "#f0ecfc",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cline x1='0' y1='44' x2='44' y2='0' stroke='%235a2da0' stroke-width='0.7' opacity='0.09'/%3E%3C/svg%3E")`,
    },
    gusset: {
      color: "#ecf8f0",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Cpath d='M30 0 L0 0 0 30' fill='none' stroke='%231a6e3a' stroke-width='0.6' opacity='0.1'/%3E%3C/svg%3E")`,
    },
    piping: {
      color: "#f8eefb",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Cline x1='11' y1='0' x2='11' y2='22' stroke='%238e1a9e' stroke-width='0.6' opacity='0.1'/%3E%3C/svg%3E")`,
    },
    bottle: {
      color: "#eaf2fc",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20'%3E%3Cpolyline points='0%2C10%2010%2C0%2020%2C10%2030%2C0%2040%2C10' fill='none' stroke='%231a4a7a' stroke-width='0.7' opacity='0.1'/%3E%3C/svg%3E")`,
    },
    advanced: {
      color: "#f2e8ea",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='11' cy='11' r='1.5' fill='%237a1a2e' opacity='0.11'/%3E%3C/svg%3E")`,
    },
  };

  useEffect(() => {
    const p = PAGE_PATTERNS[page] || PAGE_PATTERNS.lid;
    document.body.style.transition = "background-color 0.4s ease";
    document.body.style.backgroundColor = p.color;
    document.body.style.backgroundImage = p.img;
    document.body.style.backgroundRepeat = "repeat";
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
    };
  }, [page]);

  function handleTabClick(newPage) {
    // Save current scroll position for the tab we're leaving
    scrollPositions.current[page] = window.scrollY;
    setPage(newPage);
    // After React renders the new tab, scroll appropriately
    requestAnimationFrame(() => {
      if (!visitedTabs.current.has(newPage)) {
        // First visit — scroll to top
        window.scrollTo({top: 0, behavior: "instant"});
        visitedTabs.current.add(newPage);
      } else {
        // Return visit — restore saved position
        window.scrollTo({top: scrollPositions.current[newPage] || 0, behavior: "instant"});
      }
    });
  }

  return (
    <div className="ms-app">

      {/* ── Sticky header ── */}
      <div style={{ background:"#1e1040", padding:"16px 20px 0", position:"sticky", top:0, zIndex:10,
        boxShadow:"0 2px 12px rgba(0,0,0,0.4)", borderRadius:"0 0 5px 5px" }}>
        {/* Moonshot wordmark — scales to ~90% of container width */}
        <div style={{ marginBottom:4 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontSize:"clamp(28px, 8vw, 42px)", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", fontFamily:"Nunito,sans-serif", lineHeight:1.05 }}>
              Moonshot
              <span style={{ color:"#9880d8" }}> Bag Calculator</span>
            </div>
            {/* Units toggle — metric coming soon */}
            <div style={{ flexShrink:0, marginLeft:10, marginTop:4, textAlign:"right", display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#fff",
                fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
                background:"rgba(152,128,216,0.25)", border:"1.5px solid rgba(152,128,216,0.4)",
                borderRadius:20, padding:"4px 10px", whiteSpace:"nowrap" }}>
                🇺🇸 Freedom Units
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.35)",
                fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
                background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.12)",
                borderRadius:20, padding:"4px 10px", whiteSpace:"nowrap" }}>
                Metric Coming Soon
              </div>
            </div>
          </div>
          <div style={{ fontSize:"clamp(14px, 3.5vw, 18px)", fontWeight:700, color:"rgba(255,255,255,0.5)",
            fontFamily:"Nunito,sans-serif", marginTop:4, marginBottom:12,
            letterSpacing:"0.01em", fontStyle:"italic" }}>
            Houston, we have the math.
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display:"flex", gap:0 }}>
          {PAGES.map(p=>(
            <button key={p.id} onClick={()=>handleTabClick(p.id)} style={{
              flex:1, padding:"11px 0", fontSize:12, fontWeight:800,
              fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
              border:"none", cursor:"pointer", transition:"all 0.15s",
              borderRadius:"8px 8px 0 0",
              background:page===p.id?p.color:"rgba(255,255,255,0.08)",
              color:page===p.id?"#fff":"rgba(255,255,255,0.55)",
              borderBottom:page===p.id?`3px solid ${p.color}`:"3px solid transparent",
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ── Intro (shows only on first tab) ── */}
      {page==="lid" && <IntroCard />}

      {/* ── Page content — always mounted, shown/hidden to preserve state ── */}
      <div style={{display:page==="lid"      ?"block":"none"}}><LidPage /></div>
      <div style={{display:page==="gusset"   ?"block":"none"}}><GussetPage /></div>
      <div style={{display:page==="piping"   ?"block":"none"}}><PipingPage /></div>
      <div style={{display:page==="bottle"   ?"block":"none"}}><BottlePocketPage /></div>
      <div style={{display:page==="advanced" ?"block":"none"}}><AdvancedPage /></div>

      {/* ── Footer ── */}
      <ContactFooter />
    </div>
  );
}
