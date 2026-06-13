// ── BottlePocketPage.jsx ──────────────────────────────────────────────────────
// Drop-in page for Moonshot Bag Calculator
// 1. Add to T:      blue: { ... } (theme defined below — copy into T object)
// 2. Add to PAGES:  { id:"bottle", label:"Bottle Pocket", color:"#1a4a7a" }
// 3. Add to switch: {page==="bottle" && <BottlePocketPage />}
// ─────────────────────────────────────────────────────────────────────────────

// ── Blue theme — paste into T object in main file ────────────────────────────
// blue: {
//   sec:"#e0eaf7", hdr:"#1a4a7a", hdrTxt:"#fff",
//   card:"#f4f8ff", border:"#7aaad8",
//   label:"#0e3060", sub:"#3a70a8", accent:"#1a4a7a",
//   inputBg:"#eaf2fc", inputTxt:"#0a1e40",
//   resBg:"#ccdff5", resAccent:"#0e3060", resTxt:"#0a1e40",
//   btnOn:"#1a4a7a", btnOnTxt:"#fff", btnOff:"#ccdff5", btnOffTxt:"#0e3060",
//   info:"#e0eaf7", infoBdr:"#5a90c8", infoTxt:"#0a1e40",
//   ok:"#e0f5ea", okBdr:"#5aaa80", okTxt:"#1a5c38",
//   warn:"#fdf4e0", warnBdr:"#d4a820", warnTxt:"#6b4400",
//   nudgeBg:"#ccdff5", nudgeTxt:"#0e3060", pageBg:"#eaf2fc",
// },
// ─────────────────────────────────────────────────────────────────────────────

const TH_BLUE = {
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
};

// ── Local helpers (use shared ones from main file in production) ──────────────
const PI = Math.PI;
function r8(v) { return Math.round(v * 8) / 8; }
function fmtIn(v) {
  if (v == null || isNaN(v) || v < 0) return "—";
  const rnd = r8(v);
  const w = Math.floor(rnd);
  const fr = r8(rnd - w);
  const FM = {0:"",0.125:"1/8",0.25:"1/4",0.375:"3/8",0.5:"1/2",
               0.625:"5/8",0.75:"3/4",0.875:"7/8"};
  const carry = fr >= 1;
  const whole = carry ? w+1 : w;
  const fs = FM[carry ? 0 : fr] ?? "";
  if (whole===0 && fs) return `${fs}"`;
  if (!fs) return `${whole}"`;
  return `${whole} ${fs}"`;
}

// ── SVG Accordion Diagram ─────────────────────────────────────────────────────
function AccordionSVG({ segs, cutWidth, isDouble }) {
  const W=580, H=200;
  const mL=14, mR=14, mT=48, mB=22;
  const drawW = W - mL - mR;
  const px = drawW / cutWidth;
  const pH = H - mT - mB;
  const frontTop=mT, frontBot=mT+pH;
  const lift = pH*0.28;
  const backTop=frontTop-lift, backBot=frontBot-lift;

  const fillC = {
    outer:"#7a5010", flap:"#2a5c1a", pf:"#1a5080", gap:"#6a1010"
  };
  const strokeC = {
    outer:"#c8900a", flap:"#60b830", pf:"#40b0e0", gap:"#d04040"
  };

  let xs=[mL];
  segs.forEach(s=>xs.push(xs[xs.length-1]+s.w*px));

  function planeFor(i){
    const l=i>0?segs[i-1].t:null;
    const r=i<segs.length?segs[i].t:null;
    return (l==="pf"||r==="pf")?"front":"back";
  }
  function tY(p){return p==="front"?frontTop:backTop;}
  function bY(p){return p==="front"?frontBot:backBot;}

  const polys=segs.map((seg,i)=>{
    const x1=xs[i],x2=xs[i+1];
    const pL=planeFor(i),pR=planeFor(i+1);
    return { x1,x2,tL:tY(pL),bL:bY(pL),tR:tY(pR),bR:bY(pR),
             fill:fillC[seg.t],stroke:strokeC[seg.t],
             label:seg.label,t:seg.t,w:x2-x1,lx:(x1+x2)/2 };
  });

  const order=["outer","gap","flap","pf"];
  const sorted=[...polys].sort((a,b)=>order.indexOf(a.t)-order.indexOf(b.t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="bpArrR" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <polyline points="0,0.5 5,3.5 0,6.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/>
        </marker>
        <marker id="bpArrL" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polyline points="7,0.5 2,3.5 7,6.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/>
        </marker>
        <filter id="bpSh" x="-4%" y="-4%" width="112%" height="112%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1.8" floodColor="rgba(0,0,0,0.55)"/>
        </filter>
      </defs>

      {sorted.map((p,i)=>(
        <g key={i}>
          <polygon
            points={`${p.x1},${p.tL} ${p.x2},${p.tR} ${p.x2},${p.bR} ${p.x1},${p.bL}`}
            fill={p.fill} stroke={p.stroke} strokeWidth="1.3"
            filter="url(#bpSh)"
          />
          {p.t==="gap" && <>
            <line x1={p.lx} y1={p.tL+6} x2={p.lx} y2={p.bL-6}
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="4,3"/>
            <text x={p.lx} y={backTop-8} textAnchor="middle"
              fontFamily="Nunito,sans-serif" fontSize="9" fill="rgba(255,190,100,0.9)">
              sew / rivet
            </text>
          </>}
        </g>
      ))}

      {polys.map((p,i)=>(
        p.w>12 && <text key={i} x={p.lx} y={(p.tL+p.bL)/2}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="DM Mono,monospace"
          fontSize={p.w>50?12:p.w>28?10:8}
          fontWeight="600" fill="rgba(255,255,255,0.93)">
          {p.label}
        </text>
      ))}

      <line x1={mL} y1={frontBot} x2={W-mR} y2={frontBot}
        stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="5,4"/>
      <text x={W/2} y={frontBot+14} textAnchor="middle"
        fontFamily="Nunito,sans-serif" fontSize="9"
        fill="rgba(255,255,255,0.28)" letterSpacing="0.1em">
        OPEN BOTTOM
      </text>

      <line x1={mL+3} y1={backTop-12} x2={W-mR-3} y2={backTop-12}
        stroke="rgba(255,255,255,0.25)" strokeWidth="1"
        markerStart="url(#bpArrL)" markerEnd="url(#bpArrR)"/>
      <text x={W/2} y={backTop-18} textAnchor="middle"
        fontFamily="DM Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.4)">
        cut width: {fmtIn(cutWidth)}
      </text>
    </svg>
  );
}

// ── Notice box (ok / warn / info) ─────────────────────────────────────────────
function Notice({ type, children, th }) {
  const styles = {
    ok:   { bg:th.ok,   bdr:th.okBdr,   txt:th.okTxt  },
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function BottlePocketPage() {
  const th = TH_BLUE;

  // Mode: "single" | "double" | "freeform"
  const [mode, setMode] = useState("single");
  const [freeDouble, setFreeDouble] = useState(false);

  // SA
  const [sa, setSa]   = useState(0.375);
  const [cSa, setCsa] = useState("");

  // Core inputs
  const [bagW, setBagW] = useState(0); const [bagF, setBagF] = useState(0);
  const [diaW, setDiaW] = useState(0); const [diaF, setDiaF] = useState(0);
  const [htW,  setHtW]  = useState(0); const [htF,  setHtF]  = useState(0);
  const [bufW, setBufW] = useState(0); const [bufF, setBufF] = useState(0);

  // Overridable auto fields
  const [flapW, setFlapW] = useState(0); const [flapF, setFlapF] = useState(0);
  const [pfW,   setPfW]   = useState(0); const [pfF,   setPfF]   = useState(0);
  const [flapAuto, setFlapAuto] = useState(true);
  const [pfAuto,   setPfAuto]   = useState(true);

  const isDouble = mode==="double" || (mode==="freeform" && freeDouble);
  const isFreeform = mode==="freeform";

  const bagWidth   = bagW + bagF;
  const bottleDiam = diaW + diaF;
  const pocketHt   = htW  + htF;
  const buffer     = bufW + bufF;

  // ── Derived calculations ───────────────────────────────────────────
  const neededCirc = isFreeform ? 0 : Math.ceil(bottleDiam * PI * 8) / 8;

  // Resolve flap
  let flap = flapAuto
    ? (isFreeform ? 1.5 : r8(bottleDiam/2))
    : r8(flapW + flapF);
  if (isNaN(flap)||flap<=0) flap = isFreeform ? 1.5 : r8(bottleDiam/2);

  // Resolve PF
  const minPF = r8(flap*2 + 0.25);
  let pf = pfAuto
    ? r8(Math.max(isDouble ? (bagWidth-flap*6)/2 : bagWidth-flap*4, minPF))
    : r8(pfW + pfF);
  if (isNaN(pf)||pf<=0) pf = minPF;

  // Circumference
  const stitchLoss = isDouble ? 0.625 : 0.5;
  const actualCirc = r8(pf*2 + flap*4 - stitchLoss);
  const circumDiff = r8(actualCirc - neededCirc);

  // Outer edge
  const outerEach = r8(flap + sa + buffer);

  // Cut dimensions
  const stitchComp = isDouble ? 1.0 : 0.5;
  const cutWidth = isDouble
    ? r8(outerEach*2 + flap*6 + pf*2 + stitchComp)
    : r8(outerEach*2 + flap*2 + pf  + stitchComp);
  const cutHeight  = r8(pocketHt + 0.5);
  const stabWidth  = r8(cutWidth - sa*2 - 1.0);
  const stabHeight = r8(pocketHt - 0.25);
  const finFaceW   = isDouble ? r8(pf*2) : pf;

  // Ready to show results?
  const ready = bagWidth>0 && pocketHt>0 && (isFreeform || bottleDiam>0);

  // ── Fit notice ─────────────────────────────────────────────────────
  let fitType="info", fitMsg="";
  if (!isFreeform && ready) {
    if (circumDiff < 0)
      { fitType="warn"; fitMsg=`Too tight — won't fit. Increase flap or pocket front.`; }
    else if (circumDiff < 0.125)
      { fitType="warn"; fitMsg=`Very snug — no ease. Consider adding ⅛″–¼″.`; }
    else if (circumDiff < 0.5)
      { fitType="ok";   fitMsg=`Snug fit — good for bottles. Pocket will hold securely.`; }
    else if (circumDiff < neededCirc * 0.20)
      { fitType="ok";   fitMsg=`Comfortable fit — bottle sits well with a little room.`; }
    else
      { fitType="info"; fitMsg=`Roomy fit — may not hold securely when bag moves.`; }
  }

  // ── Bag width validation ────────────────────────────────────────────
  let bagType="ok", bagMsg="";
  if (ready) {
    if (finFaceW > bagWidth)
      { bagType="warn"; bagMsg=`Pocket face (${fmtIn(finFaceW)}) exceeds bag opening (${fmtIn(bagWidth)}). Reduce pocket front.`; }
    else if (bagWidth - finFaceW < 0.25)
      { bagType="info"; bagMsg=`Pocket face (${fmtIn(finFaceW)}) fits with very little clearance.`; }
    else
      { bagType="ok";   bagMsg=`Pocket face (${fmtIn(finFaceW)}) fits within bag opening (${fmtIn(bagWidth)}).`; }
  }

  // ── SVG segments ───────────────────────────────────────────────────
  const segs = isDouble ? [
    {t:"outer",w:outerEach,label:"Outer"},
    {t:"flap", w:flap,     label:"F"},
    {t:"pf",   w:pf,       label:"PF 1"},
    {t:"flap", w:flap,     label:"F"},
    {t:"gap",  w:flap*2,   label:"Gap"},
    {t:"flap", w:flap,     label:"F"},
    {t:"pf",   w:pf,       label:"PF 2"},
    {t:"flap", w:flap,     label:"F"},
    {t:"outer",w:outerEach,label:"Outer"},
  ] : [
    {t:"outer",w:outerEach,label:"Outer"},
    {t:"flap", w:flap,     label:"F"},
    {t:"pf",   w:pf,       label:"PF"},
    {t:"flap", w:flap,     label:"F"},
    {t:"outer",w:outerEach,label:"Outer"},
  ];

  // Cumulative marking guide
  let cum=0;
  const cumItems = segs.map((s,i)=>{
    cum = r8(cum + s.w);
    const names = {outer:"Outer edge (F+SA+buffer)",flap:"Flap",pf:"Pocket Front",gap:"Center Gap"};
    return { cum, name:names[s.t]||s.label, w:s.w, last:i===segs.length-1 };
  });

  // ── Helpers for auto-field write-back ──────────────────────────────
  function handleFlapWhole(v){ setFlapAuto(false); setFlapW(v); }
  function handleFlapFrac(v) { setFlapAuto(false); setFlapF(v); }
  function handlePfWhole(v)  { setPfAuto(false);   setPfW(v);  }
  function handlePfFrac(v)   { setPfAuto(false);   setPfF(v);  }

  // When core inputs change, reset auto fields
  function resetAutos(){ setFlapAuto(true); setPfAuto(true); }

  const pageBg = th.pageBg;

  // ── Mode tabs ──────────────────────────────────────────────────────
  const modeTabs = [
    {id:"single",   label:"Single · Bottle"},
    {id:"double",   label:"Double · Bottle"},
    {id:"freeform", label:"Freeform"},
  ];

  return (
    <div style={{background:pageBg, padding:"16px 14px 32px"}}>

      {/* Section header */}
      <div style={{background:th.hdr, borderRadius:"14px 14px 0 0",
        padding:"18px 22px 14px", marginBottom:0}}>
        <div style={{fontSize:24, fontWeight:900, color:th.hdrTxt,
          fontFamily:"Nunito,sans-serif", letterSpacing:"-0.01em"}}>
          Collapsible Pocket Calculator
        </div>
        <div style={{fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.8)",
          marginTop:5, fontFamily:"Nunito,sans-serif", lineHeight:1.45}}>
          Open-bottom accordion-fold interior pocket · Single, Double &amp; Freeform
        </div>
      </div>

      {/* Mode selector */}
      <div style={{background:th.card, border:`1.5px solid ${th.border}`,
        borderTop:"none", borderRadius:"0 0 10px 10px",
        padding:"14px 16px 16px", marginBottom:12,
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
          textTransform:"uppercase",color:th.label,marginBottom:10,
          fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
          Pocket Mode
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {modeTabs.map(t=>(
            <button key={t.id} onClick={()=>{setMode(t.id);resetAutos();}} style={{
              flex:1, minWidth:80, padding:"10px 6px", fontSize:12, fontWeight:800,
              fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
              textTransform:"uppercase", borderRadius:8, border:"none", cursor:"pointer",
              background:mode===t.id?th.btnOn:th.btnOff,
              color:mode===t.id?"#fff":th.btnOffTxt,
              transition:"all 0.15s"
            }}>{t.label}</button>
          ))}
        </div>
        {mode==="freeform" && (
          <div style={{display:"flex",alignItems:"center",gap:12,marginTop:12}}>
            <span style={{fontSize:14,fontWeight:700,color:th.label,
              fontFamily:"Nunito,sans-serif"}}>
              {freeDouble?"Double":"Single"} pocket
            </span>
            <button onClick={()=>setFreeDouble(d=>!d)} style={{
              padding:"6px 14px", fontSize:13, fontWeight:800,
              fontFamily:"Nunito,sans-serif", borderRadius:8, border:"none",
              cursor:"pointer", background:th.btnOn, color:"#fff"}}>
              Toggle
            </button>
          </div>
        )}
      </div>

      {/* SA */}
      <SABar sa={sa} setSa={setSa} cSa={cSa} setCsa={setCsa} th={th}/>

      {/* Inputs */}
      <div style={{background:th.card, border:`1.5px solid ${th.border}`,
        borderRadius:10, padding:"16px 18px", marginBottom:12,
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
          textTransform:"uppercase",color:th.label,marginBottom:12,
          fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
          Measurements
        </div>

        <FracInput th={th} label="Bag Panel Opening Width"
          sub="finished interior width"
          whole={bagW} frac={bagF}
          onWhole={v=>{setBagW(v);resetAutos();}} onFrac={v=>{setBagF(v);resetAutos();}}/>
        {ready && <Notice type={bagType} th={th}>{bagMsg}</Notice>}

        {!isFreeform && (
          <FracInput th={th} label="Bottle / Object Diameter"
            sub="add ¼″–½″ ease for comfort"
            whole={diaW} frac={diaF}
            onWhole={v=>{setDiaW(v);resetAutos();}} onFrac={v=>{setDiaF(v);resetAutos();}}/>
        )}

        <FracInput th={th} label="Finished Pocket Height"
          whole={htW} frac={htF} onWhole={setHtW} onFrac={setHtF}/>

        <FracInput th={th} label="Outer Buffer (each side)"
          sub="trimmed when attaching to bag"
          whole={bufW} frac={bufF} onWhole={setBufW} onFrac={setBufF}/>

        <div style={{borderTop:`2px dashed ${th.border}`,margin:"14px 0 14px",opacity:0.5}}/>

        {/* Flap — auto/custom */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{fontSize:14,fontWeight:800,color:th.label,
            fontFamily:"Nunito,sans-serif"}}>Flap Width (each)</div>
          <span style={{fontSize:11,fontWeight:700,
            background:flapAuto?th.resBg:"#fff3e0",
            color:flapAuto?th.resAccent:"#b25a00",
            padding:"2px 8px",borderRadius:10,fontFamily:"Nunito,sans-serif"}}>
            {flapAuto?"auto":"custom"}
          </span>
          {!flapAuto && (
            <button onClick={()=>{setFlapAuto(true);}} style={{
              fontSize:11,fontWeight:800,fontFamily:"Nunito,sans-serif",
              background:"transparent",border:`1px solid ${th.border}`,
              borderRadius:6,padding:"2px 8px",cursor:"pointer",color:th.sub}}>
              reset
            </button>
          )}
        </div>
        <FracInput th={th} label="" sub={isFreeform?"set desired flap width":"min = diameter÷2 · rec = diameter÷2 + ¼″"}
          whole={flapAuto ? Math.floor(flap) : flapW}
          frac={flapAuto ? r8(flap - Math.floor(flap)) : flapF}
          onWhole={handleFlapWhole} onFrac={handleFlapFrac}/>
        {!isFreeform && ready && fitMsg && (
          <Notice type={fitType} th={th}>
            Pocket circumference: {fmtIn(actualCirc)} · Needed for {fmtIn(bottleDiam)} bottle: {fmtIn(neededCirc)} · {fitMsg}
          </Notice>
        )}

        {/* Pocket front — auto/custom */}
        <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0 4px"}}>
          <div style={{fontSize:14,fontWeight:800,color:th.label,
            fontFamily:"Nunito,sans-serif"}}>Pocket Front Width</div>
          <span style={{fontSize:11,fontWeight:700,
            background:pfAuto?th.resBg:"#fff3e0",
            color:pfAuto?th.resAccent:"#b25a00",
            padding:"2px 8px",borderRadius:10,fontFamily:"Nunito,sans-serif"}}>
            {pfAuto?"auto":"custom"}
          </span>
          {!pfAuto && (
            <button onClick={()=>{setPfAuto(true);}} style={{
              fontSize:11,fontWeight:800,fontFamily:"Nunito,sans-serif",
              background:"transparent",border:`1px solid ${th.border}`,
              borderRadius:6,padding:"2px 8px",cursor:"pointer",color:th.sub}}>
              reset
            </button>
          )}
        </div>
        <FracInput th={th} label="" sub="must be ≥ flap×2 + ¼″ · clear to auto-calculate"
          whole={pfAuto ? Math.floor(pf) : pfW}
          frac={pfAuto ? r8(pf - Math.floor(pf)) : pfF}
          onWhole={handlePfWhole} onFrac={handlePfFrac}/>
        {ready && pf < minPF && (
          <Notice type="warn" th={th}>
            ⚠ Pocket front ({fmtIn(pf)}) must be at least {fmtIn(minPF)} (flap×2 + ¼″) for accordion construction.
          </Notice>
        )}
      </div>

      {/* Results */}
      {ready && (
        <>
          {/* Cut dimensions */}
          <div style={{background:th.resBg, border:`1.5px solid ${th.border}`,
            borderRadius:10, padding:"16px 18px", marginBottom:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
              textTransform:"uppercase",color:th.resAccent,marginBottom:12,
              fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
              Calculated Dimensions · {isDouble?"Double":"Single"}
            </div>

            {[
              ["Cut Fabric Width",   fmtIn(cutWidth),  true],
              ["Cut Fabric Height",  fmtIn(cutHeight), true],
              [isDouble?"Finished Pocket Faces Width":"Finished Pocket Face Width",
                                     fmtIn(finFaceW),  false],
              ["Finished Pocket Height", fmtIn(pocketHt), false],
              ["Flap Width (each)",  fmtIn(flap),      false],
              ["Outer Edge (each side)", fmtIn(outerEach), false],
              ...(isDouble?[["Center Gap (2 flaps)", fmtIn(flap*2), false]]:[]),
              ["Seam Allowance",     fmtIn(sa),        false],
              ["Outer Buffer",       fmtIn(buffer),    false],
            ].map(([lbl,val,big])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",
                alignItems:"baseline",padding:"7px 0",borderBottom:`1px solid ${th.border}`}}>
                <div style={{fontSize:14,fontWeight:700,color:th.label,
                  fontFamily:"Nunito,sans-serif"}}>{lbl}</div>
                <div style={{fontSize:big?24:19,fontFamily:"DM Mono,monospace",
                  fontWeight:500,color:big?th.resAccent:th.resTxt}}>{val}</div>
              </div>
            ))}

            <div style={{background:th.info,border:`1.5px solid ${th.infoBdr}`,
              borderRadius:8,padding:"10px 13px",marginTop:10,fontSize:13,
              fontWeight:600,color:th.infoTxt,fontFamily:"Nunito,sans-serif",lineHeight:1.5}}>
              ℹ The short outer edges ({fmtIn(outerEach)} each side) are <strong>unfinished raw edges</strong> — sewn into the bag interior seam when attaching. Trim buffer to your exact SA at that point.
            </div>
          </div>

          {/* Stabilizer */}
          <div style={{background:th.card, border:`1.5px solid ${th.border}`,
            borderRadius:10, padding:"16px 18px", marginBottom:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
              textTransform:"uppercase",color:th.label,marginBottom:12,
              fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
              ✦ Stabilizer — Decovil Light 525 or Thin Foam
            </div>
            {[
              ["Stabilizer Width",  fmtIn(stabWidth)],
              ["Stabilizer Height", fmtIn(stabHeight)],
            ].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",
                alignItems:"baseline",padding:"7px 0",borderBottom:`1px solid ${th.border}`}}>
                <div style={{fontSize:14,fontWeight:700,color:th.label,
                  fontFamily:"Nunito,sans-serif"}}>{lbl}</div>
                <div style={{fontSize:19,fontFamily:"DM Mono,monospace",
                  fontWeight:500,color:th.resTxt}}>{val}</div>
              </div>
            ))}
          </div>

          {/* SVG diagram */}
          <div style={{background:"#1a2a3a", borderRadius:10, padding:"14px 10px 10px",
            marginBottom:12, overflow:"hidden"}}>
            <AccordionSVG segs={segs} cutWidth={cutWidth} isDouble={isDouble}/>
          </div>

          {/* Fabric marking guide */}
          <div style={{background:th.card, border:`1.5px solid ${th.border}`,
            borderRadius:10, padding:"16px 18px", marginBottom:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
              textTransform:"uppercase",color:th.label,marginBottom:12,
              fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
              📏 Fabric Marking Guide — measure from one raw edge
            </div>
            {cumItems.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"baseline",gap:10,
                padding:"5px 0",borderBottom:`1px solid ${th.border}`}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:17,fontWeight:500,
                  color:th.resAccent,minWidth:64,textAlign:"right"}}>{fmtIn(c.cum)}</div>
                <div style={{fontSize:13,color:"rgba(0,0,0,0.4)",flexShrink:0}}>←</div>
                <div style={{fontSize:13,fontWeight:600,color:th.label,
                  fontFamily:"Nunito,sans-serif"}}>
                  {c.last?"end of fabric":`mark at ${fmtIn(c.cum)}`}
                  <span style={{fontWeight:400,color:th.sub}}> · {c.name} = {fmtIn(c.w)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{background:th.card, border:`1.5px solid ${th.border}`,
            borderRadius:10, padding:"16px 18px", marginBottom:12,
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
              textTransform:"uppercase",color:th.label,marginBottom:12,
              fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
              ✦ Important Notes
            </div>
            {[
              ["Pocket Placement", "Position pocket at least ½″ above the bag's bottom seam or any curved angles. Do not align with the bottom edge of the bag interior — keep clear of SA and curved seam areas."],
              ...(isDouble ? [["Double Pocket Attachment", "After attaching outer edges, mark a center line through the center gap. Sew along this line with a straight stitch, or secure with several rivets through the gap to the bag interior."]] : []),
              ["Outer Buffer", `The outer edges (${fmtIn(outerEach)} each side) include extra fabric. Trim to your exact SA when attaching to bag interior.`],
              ["Fold Direction", "All flaps fold away from the pocket front so the pocket collapses flat when empty."],
              ["Stress Points", "Backstitch several times at the top and bottom of each ⅛″ fold stitch — these take the most wear."],
            ].map(([title,body])=>(
              <div key={title} style={{padding:"6px 0",borderBottom:`1px solid ${th.border}`}}>
                <div style={{fontSize:14,fontWeight:800,color:th.label,
                  fontFamily:"Nunito,sans-serif"}}>{title}</div>
                <div style={{fontSize:13,fontWeight:600,color:th.sub,
                  fontFamily:"Nunito,sans-serif",lineHeight:1.5,marginTop:2}}>{body}</div>
              </div>
            ))}
          </div>

          {/* Construction steps */}
          <div style={{background:th.card, border:`1.5px solid ${th.border}`,
            borderRadius:10, padding:"16px 18px", marginBottom:4,
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.09em",
              textTransform:"uppercase",color:th.label,marginBottom:12,
              fontFamily:"Nunito,sans-serif",borderBottom:`2px solid ${th.border}`,paddingBottom:8}}>
              Construction Steps
            </div>
            {[
              `Cut 2 fabric pieces: ${fmtIn(cutWidth)} wide × ${fmtIn(cutHeight)} tall. Cut 1 stabilizer: ${fmtIn(stabWidth)} × ${fmtIn(stabHeight)}.`,
              "Center and fuse stabilizer to wrong side of one fabric piece, leaving even margins on all sides.",
              `Place pieces right sides together. Sew top and bottom edges at ${fmtIn(sa)} SA. Turn right side out and press flat. Add binding to top edge if desired.`,
              "Mark all fold lines on the finished panel using the guide above — measure from one raw edge using erasable or heat pen.",
              "Sew exactly on each marked line with matching thread. Remove marks with heat or brush.",
              "Fold accordion-style, all flaps folding away from the pocket front(s). At each fold, stitch ⅛″ from the folded edge, backstitching several times at top and bottom.",
              `Position pocket at least ½″ above bag bottom seam. Attach outer edges (${fmtIn(outerEach)} each side — trim buffer to exact SA) to bag interior at sides and top. Leave bottom open.${isDouble?" Secure center gap with a stitch line or rivets.":""}`,
            ].map((step,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"6px 0",
                borderBottom:`1px solid ${th.border}`}}>
                <div style={{fontSize:13,fontWeight:900,color:th.accent,
                  fontFamily:"DM Mono,monospace",minWidth:20,flexShrink:0}}>{i+1}.</div>
                <div style={{fontSize:13,fontWeight:600,color:th.label,
                  fontFamily:"Nunito,sans-serif",lineHeight:1.55}}>{step}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!ready && (
        <div style={{textAlign:"center",padding:"32px 20px",color:th.sub,
          fontFamily:"Nunito,sans-serif",fontSize:15,fontWeight:600}}>
          Enter bag width, pocket height{!isFreeform?" and bottle diameter":""} above to calculate.
        </div>
      )}
    </div>
  );
}
