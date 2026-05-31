import { useState } from "react";

const PI = Math.PI;

// ── Google Fonts ──────────────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
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

function FracInput({ label, sub, whole, frac, onWhole, onFrac, th }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:14, fontWeight:800, color:th.label, marginBottom:6, fontFamily:"Nunito,sans-serif" }}>
        {label}
        {sub && <span style={{ fontWeight:600, color:th.sub, marginLeft:6, fontSize:12 }}>{sub}</span>}
      </div>
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
      {sub && <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)", marginTop:5, fontFamily:"Nunito,sans-serif", lineHeight:1.45 }}>{sub}</div>}
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
      <div style={{ fontSize:13, fontWeight:700, color:th.label, fontFamily:"Nunito,sans-serif" }}>{label}</div>
      <div style={{ fontSize:big?24:19, fontFamily:"DM Mono,monospace", fontWeight:500,
        color:accent?th.resAccent:th.resTxt }}>{value}</div>
    </div>
  );
}
function InfoBox({ children, th }) {
  return (
    <div style={{ background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:13, fontWeight:600, color:th.infoTxt,
      fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}
function NoteBox({ children }) {
  return (
    <div style={{ background:"#fdf4e0", border:"1.5px solid #d4a820", borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:13, fontWeight:600, color:"#6b4400",
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
            padding:"10px 18px", fontSize:20, fontFamily:"DM Mono,monospace", fontWeight:500,
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
          style={{ width:88, padding:"10px 8px", fontSize:17, fontFamily:"DM Mono,monospace",
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

  return (
    <div style={{ background:th.pageBg, minHeight:"100vh", padding:"16px 16px 48px" }}>
      <SABar th={th} sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} />
      <div style={{ background:th.sec, borderRadius:14, boxShadow:"0 4px 18px rgba(90,45,160,0.12)" }}>
        <SecHeader th={th} title="Lid & Bottom Panels"
          sub="Cut dimensions for a 4-sided panel with rounded corners, and the 4 matching side panels (2 long + 2 short) that assemble around it. Side panels are plain rectangles — the corner radius applies to the lid only." />
        <div style={{ padding:"16px 16px 20px" }}>
          <SubTabs th={th} active={mode} set={v=>{setMode(v);setNudgeA(0);}}
            tabs={[{id:"lid",label:"Lid → Sides"},{id:"sides",label:"Sides → Lid"}]} />

          {mode==="lid" && <>
            <Card th={th}>
              <CardTitle th={th}>Lid / Bottom — Cut Dimensions</CardTitle>
              <InfoBox th={th}>Enter the cut (pre-sewn) size of your lid or bottom panel. Sewline dimensions are derived by subtracting the seam allowance.</InfoBox>
              <div style={{marginTop:14}}>
                <FracInput th={th} label="Length (cut)" whole={lLW} frac={lLF} onWhole={setLLW} onFrac={setLLF} />
                <FracInput th={th} label="Width (cut)" whole={lWW} frac={lWF} onWhole={setLWW} onFrac={setLWF} />
              </div>
              <Divider th={th} />
              <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid only)</div>
              <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={rCW} frac={rCF} onWhole={setRCW} onFrac={setRCF} />
              <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px", marginTop:4 }}>
                <RRow th={th} label="Sewline size" value={`${fmtInch(Ls)} x ${fmtInch(Ws)}`} />
                <RRow th={th} label="Sewline radius" value={fmtInch(Rs)} />
                <RRow th={th} label="Lid sewline perimeter" value={fmtInch(lidP)} accent />
              </div>
            </Card>

            <Card th={th}>
              <CardTitle th={th}>Side Panels — Cut Dimensions</CardTitle>
              <InfoBox th={th}>4 side panels in 2 matching pairs (A x2, B x2). Side panels are plain rectangles with no corner radius. The seam falls at the midpoint of each corner arc on the lid. Nudge +/- 1/8" to land on a clean ruler measurement — Side B updates automatically.</InfoBox>
              <div style={{marginTop:14}}>
                {[["Side A — long pair (x2)",sAc,sAf,1],["Side B — short pair (x2)",sBc,sBf,-1]].map(([lbl,cut,fin,dir])=>(
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
                {nudgeA!==0&&<button onClick={()=>setNudgeA(0)} style={{
                  fontSize:12, fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase",
                  background:th.btnOff, border:`1.5px solid ${th.border}`, borderRadius:6,
                  padding:"6px 14px", cursor:"pointer", color:th.btnOffTxt, marginBottom:12, fontFamily:"Nunito,sans-serif"
                }}>Reset to auto</button>}
              </div>
              <div style={{ background:Math.abs(delta)<0.07?th.ok:th.warn,
                border:`1.5px solid ${Math.abs(delta)<0.07?th.okBdr:th.warnBdr}`,
                borderRadius:8, padding:"11px 14px" }}>
                <RRow th={th} label="Lid sewline perimeter" value={fmtInch(lidP)} />
                <RRow th={th} label="Sides sewline perimeter" value={fmtInch(sidesP)} />
                <div style={{ textAlign:"center", marginTop:8, fontSize:14, fontWeight:800,
                  color:Math.abs(delta)<0.07?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>
                  {Math.abs(delta)<0.07?"✓ Perfect match"
                    :`Delta ${delta>0?"+":"-"}${fmtInch(Math.abs(smartRound(delta)))} — ease across seams when sewing`}
                </div>
              </div>
            </Card>
          </>}

          {mode==="sides" && <>
            <Card th={th}>
              <CardTitle th={th}>Side Panels — Enter Cut Dimensions</CardTitle>
              <InfoBox th={th}>Enter your cut side panel lengths and the lid corner radius. The required lid cut dimensions will be calculated to match.</InfoBox>
              <div style={{marginTop:14}}>
                <FracInput th={th} label="Side A (long pair) — cut" whole={sAW} frac={sAF} onWhole={setSAW} onFrac={setSAF} />
                <FracInput th={th} label="Side B (short pair) — cut" whole={sBW} frac={sBF} onWhole={setSBW} onFrac={setSBF} />
              </div>
              <Divider th={th} />
              <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid only)</div>
              <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={srW} frac={srF} onWhole={setSrW} onFrac={setSrF} />
            </Card>
            <Card th={th}>
              <CardTitle th={th}>Lid / Bottom — Required Cut Dimensions</CardTitle>
              <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px" }}>
                <RRow th={th} label="Length — cut" value={fmtInch(sLid_Lc)} accent big />
                <RRow th={th} label="Width — cut" value={fmtInch(sLid_Wc)} accent big />
                <RRow th={th} label="Corner radius — cut" value={fmtInch(s2r)} />
                <RRow th={th} label="Sewline size" value={`${fmtInch(sLid_Ls)} x ${fmtInch(sLid_Ws)}`} />
                <RRow th={th} label="Lid sewline perimeter" value={fmtInch(sLP)} accent />
              </div>
            </Card>
          </>}

          <Card th={th}>
            <CardTitle th={th}>Finished Assembled Size</CardTitle>
            <FracInput th={th} label="Side panel height — finished" whole={phW} frac={phF} onWhole={setPhW} onFrac={setPhF} />
            <div style={{ background:"#2a1860", borderRadius:8, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>L x W x H</div>
              <div style={{ fontSize:20, fontFamily:"DM Mono,monospace", fontWeight:500, color:"#e8e0ff" }}>
                {mode==="lid"?`${fmtInch(sAf)} x ${fmtInch(sBf)} x ${fmtInch(pH)}`:`${fmtInch(s2Af)} x ${fmtInch(s2Bf)} x ${fmtInch(pH)}`}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — GUSSET
// ══════════════════════════════════════════════════════════════════════════════
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
    <div style={{ background:th.pageBg, minHeight:"100vh", padding:"16px 16px 48px" }}>
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
            <FracInput th={th} label="Panel width (cut)" whole={pLW} frac={pLF} onWhole={setPLW} onFrac={setPLF} />
            <FracInput th={th} label="Panel height (cut)" whole={pHW} frac={pHF} onWhole={setPHW} onFrac={setPHF} />
            <Divider th={th} />
            <div style={{ fontSize:12, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>
              {mode==="three"?"Bottom Corner Radius (2 corners)":"Corner Radius (all 4 corners)"}
            </div>
            <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={rW} frac={rF} onWhole={setRW} onFrac={setRF} />
            <div style={{ background:th.resBg, borderRadius:8, padding:"12px 14px", marginTop:4 }}>
              <RRow th={th} label="Panel sewline width" value={fmtInch(Ls_disp)} />
              <RRow th={th} label="Panel sewline height" value={fmtInch(Hs_disp)} />
              <RRow th={th} label="Sewline corner radius" value={fmtInch(Rs)} />
              {mode!=="four" && (
                <RRow th={th} label="Gusset sewline run" value={fmtInch(sewLen3)} accent />
              )}
              {mode==="four" && (
                <RRow th={th} label="Enclosed sewline perimeter" value={fmtInch(sewLen4)} accent />
              )}
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
    <div style={{ background:th.pageBg, minHeight:"100vh", padding:"16px 16px 48px" }}>
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
            <div style={{ fontSize:13, fontWeight:700, color:th.label, marginBottom:8, fontFamily:"Nunito,sans-serif" }}>Vinyl / fabric thickness</div>
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
                  <FracInput th={th} label="Length (cut)" whole={rLW} frac={rLF} onWhole={setRLW} onFrac={setRLF} />
                  <FracInput th={th} label="Width (cut)" whole={rWW} frac={rWF} onWhole={setRWW} onFrac={setRWF} />
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
                  <FracInput th={th} label="Long axis (cut)" whole={oAW} frac={oAF} onWhole={setOAW} onFrac={setOAF} />
                  <FracInput th={th} label="Short axis (cut)" whole={oBW} frac={oBF} onWhole={setOBW} onFrac={setOBF} />
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
                <FracInput th={th} label="Panel width (cut)" whole={tLW} frac={tLF} onWhole={setTLW} onFrac={setTLF} />
                <FracInput th={th} label="Panel height (cut)" whole={tHW} frac={tHF} onWhole={setTHW} onFrac={setTHF} />
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

// ── Obfuscated email footer ───────────────────────────────────────────────────
function ContactFooter() {
  const [shown, setShown] = useState(false);
  // assembled at runtime — never a plain string in source
  const parts = ["moonshot", ".", "bagcalc", "@", "gmail", ".", "com"];
  const email = parts.join("");
  return (
    <div style={{
      background:"#140d30", borderTop:"1px solid rgba(255,255,255,0.08)",
      padding:"24px 20px 32px", textAlign:"center",
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
const PAGES=[
  {id:"lid",    label:"Lid & Bottom", color:"#5a2da0"},
  {id:"gusset", label:"Gusset",       color:"#1a6e3a"},
  {id:"piping", label:"Piping",       color:"#8e1a9e"},
];

function IntroCard() {
  return (
    <div style={{
      margin:"0 16px 0", padding:"18px 20px",
      background:"linear-gradient(135deg, #2a1860 0%, #1a0e40 100%)",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#c8b8f0", marginBottom:6, fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em" }}>
        Hi, I'm Abby 👋
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.72)", lineHeight:1.6, fontFamily:"Nunito,sans-serif" }}>
        I'm a bag maker and designer obsessed with getting the math right. I built this calculator for myself and figured other makers could use it too. It's free, it's a work in progress, and I hope it saves you some seam-ripping.
      </div>
    </div>
  );
}

export default function MoonshotBagCalc() {
  const [page,setPage]=useState("lid");
  return (
    <div style={{ maxWidth:520, margin:"0 auto", fontFamily:"Nunito,sans-serif", background:"#1e1040", minHeight:"100vh" }}>

      {/* ── Sticky header ── */}
      <div style={{ background:"#1e1040", padding:"16px 20px 0", position:"sticky", top:0, zIndex:10,
        boxShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>
        {/* Moonshot wordmark */}
        <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:2 }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", fontFamily:"Nunito,sans-serif" }}>
            Moonshot
          </div>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#9880d8" }}>
            Bag Calculator
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.38)", marginBottom:12, fontFamily:"Nunito,sans-serif" }}>
          Panels · Gussets · Piping
        </div>
        {/* Tab bar */}
        <div style={{ display:"flex", gap:0 }}>
          {PAGES.map(p=>(
            <button key={p.id} onClick={()=>setPage(p.id)} style={{
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

      {/* ── Page content ── */}
      <div>
        {page==="lid"    && <LidPage />}
        {page==="gusset" && <GussetPage />}
        {page==="piping" && <PipingPage />}
      </div>

      {/* ── Footer ── */}
      <ContactFooter />
    </div>
  );
}
