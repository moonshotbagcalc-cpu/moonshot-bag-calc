import { useState, useRef, useEffect } from "react";
import { PI, DEFAULT_SA } from "../utils/constants.js";
import { roundRectPerim } from "../utils/geometry.js";
import { isMetric, inToMm, smartRound, fmtInch, roundTo8th, mmToIn } from "../utils/formatting.js";
import { T } from "../utils/theme.js";
import { SecHeader, Card, CardTitle, InfoBox, NoteBox, SubTabs, Nudge, Divider, SABar } from "../components/SharedUI.jsx";
import FracInput from "../components/FracInput.jsx";

// ── Math helpers ──────────────────────────────────────────────────────────────
// Side panel split for rounded lid/bottom corners.
// Each side panel seam lands at the midpoint of the neighboring corner arcs,
// so each side receives two quarter-arc halves: πR/4 + πR/4 = πR/2.
function arcMidSplit(Ls, Ws, Rs) {
  const straightA = Math.max(0, Ls - 2*Rs);
  const straightB = Math.max(0, Ws - 2*Rs);
  const cornerShare = Rs > 0 ? (PI * Rs) / 2 : 0;
  return {
    sideA_fin: straightA + cornerShare,
    sideB_fin: straightB + cornerShare,
  };
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
  if (!v || v <= 0) return isMetric() ? '0 mm' : '0"';
  if (isMetric()) return `${Math.round(inToMm(v))} mm`;
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
  const numberStyle = { fontVariantNumeric:"tabular-nums", fontFeatureSettings:'"frac" 0, "numr" 0, "dnom" 0' };
  return (
    <tr style={{ borderBottom:`1px solid ${th.border}` }}>
      <td style={{ padding:"9px 6px", fontSize:16, fontWeight:700,
        color:th.label, fontFamily:"Nunito,sans-serif" }}>{label}</td>
      <td style={{ padding:"9px 6px", fontSize:18, fontWeight:500,
        color:th.accent, fontFamily:"DM Mono,monospace", textAlign:"right", whiteSpace:"nowrap", ...numberStyle }}>{cut}</td>
      <td style={{ padding:"9px 6px", fontSize:16, fontWeight:400,
        color:th.sub, fontFamily:"DM Mono,monospace", textAlign:"right",
        fontStyle:"italic", whiteSpace:"nowrap", ...numberStyle }}>{sew ? `Sewline: ${sew}` : ""}</td>
    </tr>
  );
}

function MeasSection({ title, rows, th }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:15, fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase",
        color:th.hdr, background:th.sec, padding:"7px 12px", borderRadius:7,
        marginBottom:10, display:"inline-block", fontFamily:"Nunito,sans-serif" }}>
        {title}
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
        <colgroup>
          <col style={{width:"46%"}} />
          <col style={{width:"24%"}} />
          <col style={{width:"30%"}} />
        </colgroup>
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
          color:DT.warnTxt, fontSize:13, fontWeight:700,
          padding:"8px 16px", fontFamily:"Nunito,sans-serif" }}>
          {warns.join("  ·  ")}
        </div>
      )}
      {!hasHeight && hasDims && (
        <div style={{ background:th.info, borderBottom:`1px solid ${th.infoBdr}`,
          color:th.infoTxt, fontSize:13, fontWeight:600,
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
        <div style={{ fontSize:13, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase",
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
            <div style={{ fontSize:14, fontWeight:700, color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>Lid/Bottom sewline perimeter</div>
            <div style={{ fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500, color:deltaOk?th.okTxt:th.warnTxt }}>{diagFmt(perimToCheck)}</div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
            padding:"5px 0", borderBottom:`1px solid ${deltaOk?th.okBdr:th.warnBdr}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>Sides sewline perimeter</div>
            <div style={{ fontSize:17, fontFamily:"DM Mono,monospace", fontWeight:500, color:deltaOk?th.okTxt:th.warnTxt }}>{diagFmt(sidesP_check)}</div>
          </div>
          <div style={{ textAlign:"center", marginTop:8, fontSize:14, fontWeight:800,
            color:deltaOk?th.okTxt:th.warnTxt, fontFamily:"Nunito,sans-serif" }}>
            {deltaOk
              ? (isLidMode ? "✓ Perfect match" : "✓ Perimeters compatible")
              : `Delta ${delta_check>0?"+":"-"}${diagFmt(Math.abs(smartRound(delta_check)))} — ease across the 4 corner seams when sewing`}
          </div>
          {!isLidMode && (
            <div style={{ textAlign:"center", marginTop:6, fontSize:12, fontWeight:600,
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
export default function LidPage() {
  const th=T.purple;
  const [sa,setSa]=useState(DEFAULT_SA); const [cSa,setCsa]=useState("");
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
  const s2Af=Math.max(0,s2A-2*sa), s2Bf=Math.max(0,s2B-2*sa), s2Rs=Math.max(0,s2r-sa);

  // In Sides → Lid/Bottom mode, the entered side panel sewline widths already
  // include their half-corner arc shares. Remove that arc share to recover the
  // straight portions of the rounded rectangle, then add 2R back to get the
  // true finished lid dimensions. This keeps lid perimeter and side perimeter
  // aligned instead of double-counting the corner arcs.
  const sCornerShare = s2Rs > 0 ? (PI * s2Rs) / 2 : 0;
  const sStraightA = Math.max(0, s2Af - sCornerShare);
  const sStraightB = Math.max(0, s2Bf - sCornerShare);
  const sLid_Ls = sStraightA + 2*s2Rs;
  const sLid_Ws = sStraightB + 2*s2Rs;
  const sLid_Lc=sLid_Ls+2*sa, sLid_Wc=sLid_Ws+2*sa;
  const sLP=roundRectPerim(sLid_Ls,sLid_Ws,s2Rs);
  const pH=phW+phF;

  const nudgeAmount = isMetric() ? mmToIn(5) : 0.125;

  // Finished bag dimensions — based on lid sewline (the true footprint)
  const finL = mode==="lid" ? Ls : sLid_Ls;
  const finW = mode==="lid" ? Ws : sLid_Ws;
  const finH = Math.max(0, pH - 2*sa);
  const minPracticalSideCut = 2 * sa;
  const sidePanelTooNarrow = mode === "lid" && (
    (sAc > 0 && sAc <= minPracticalSideCut) ||
    (sBc > 0 && sBc <= minPracticalSideCut)
  );

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
          <div style={{ fontSize:14, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
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
              <div style={{ fontSize:13, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid & bottom)</div>
              {lidL > 0 && lidW > 0 && (
                <div style={{ fontSize:13, fontWeight:600, color:th.accent, fontFamily:"Nunito,sans-serif",
                  fontStyle:"italic", marginBottom:10 }}>
                  Max radius for these dimensions: {fmtInch(smartRound(Math.min(Ls, Ws) / 2))}
                </div>
              )}
              <FracInput th={th} label="Radius at cut edge" sub="— 0 for square corners" whole={rCW} frac={rCF} onWhole={setRCW} onFrac={setRCF} />
              <Divider th={th} />
              <CardTitle th={th}>Side Panels</CardTitle>
              <InfoBox th={th}>4 panels total: 2 pairs of matching rectangles (Sides A and Sides B). Seams default to the midpoint of the lid/bottom corners. Nudge either pair by {fmtInch(nudgeAmount)} — the other pair updates automatically to maintain the correct perimeter.</InfoBox>
              <div style={{marginTop:14}}>
                {[["Side A — Cut 2",sAc,sAf,1],["Side B — Cut 2",sBc,sBf,-1]].map(([lbl,cut,fin,dir])=>(
                  <div key={lbl} style={{marginBottom:14}}>
                    <div style={{ fontSize:14, fontWeight:800, color:th.label, marginBottom:6, fontFamily:"Nunito,sans-serif" }}>{lbl}</div>
                    <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
                      <div style={{ flex:4, background:th.resBg, border:`2px solid ${th.border}`, borderRadius:8, padding:"10px 14px", textAlign:"center" }}>
                        <div style={{ fontSize:12, fontWeight:900, color:th.label, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2, fontFamily:"Nunito,sans-serif" }}>Cut</div>
                        <div style={{ fontSize:28, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>{fmtInch(cut)}</div>
                        <div style={{ fontSize:13, color:th.sub, marginTop:2, fontFamily:"Nunito,sans-serif" }}>finished {fmtInch(fin)}</div>
                      </div>
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        <Nudge th={th} label={`+${fmtInch(nudgeAmount)}`} onClick={()=>setNudgeA(n=>roundTo8th(n+nudgeAmount*dir))} />
                        <Nudge th={th} label={`-${fmtInch(nudgeAmount)}`} onClick={()=>setNudgeA(n=>roundTo8th(n-nudgeAmount*dir))} />
                      </div>
                    </div>
                  </div>
                ))}
                {nudgeA!==0 && <button onClick={()=>setNudgeA(0)} style={{
                  fontSize:13, fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase",
                  background:th.btnOff, border:`1.5px solid ${th.border}`, borderRadius:6,
                  padding:"6px 14px", cursor:"pointer", color:th.btnOffTxt, marginBottom:12, fontFamily:"Nunito,sans-serif"
                }}>Reset to auto</button>}
                <InfoBox th={th}>
                  <strong>Nudge note:</strong> The default split places the side-panel seam at the midpoint of each rounded corner. Nudging shifts that seam location while keeping the total perimeter matched. Minimum practical cut width: keep each side panel greater than <strong>{fmtInch(minPracticalSideCut)}</strong> ({fmtInch(sa)} × 2 seam allowances).
                </InfoBox>
                {sidePanelTooNarrow && (
                  <NoteBox>
                    One side panel is at or below 2 × seam allowance. Increase that side or reset to auto so there is usable finished width after sewing.
                  </NoteBox>
                )}
                {sAc > 0 && sBc > 0 && Math.abs(sAc - sBc) < 0.01 && (
                  <div style={{background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:8,
                    padding:"10px 13px", marginTop:8, marginBottom:12, fontSize:14, fontWeight:600,
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
              <div style={{ fontSize:13, fontWeight:800, color:th.sub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6, fontFamily:"Nunito,sans-serif" }}>Corner Radius (lid & bottom)</div>
              {s2A > 0 && s2B > 0 && (
                <div style={{ fontSize:13, fontWeight:600, color:th.accent, fontFamily:"Nunito,sans-serif",
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
            <div style={{ fontSize:13, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
              color:th.sub, marginBottom:4, fontFamily:"Nunito,sans-serif" }}>
              Bag Height
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
              fontStyle:"italic", marginBottom:12 }}>
              Optional — add for diagram, perimeter totals, and finished size.
            </div>
            <FracInput th={th} label="Side panel height — cut" whole={phW} frac={phF} onWhole={setPhW} onFrac={setPhF} />
            {pH > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
                marginTop:4, padding:"6px 10px", background:th.resBg, borderRadius:6 }}>
                <div style={{ fontSize:14, fontWeight:700, color:th.label, fontFamily:"Nunito,sans-serif" }}>
                  Finished height
                </div>
                <div style={{ fontSize:16, fontFamily:"DM Mono,monospace", fontWeight:500, color:th.resAccent }}>
                  {fmtInch(finH)}
                  <span style={{ fontSize:12, fontWeight:600, color:th.sub, fontFamily:"Nunito,sans-serif",
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
            <div style={{ fontSize:13, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase",
              color:"#b8a8e8", marginBottom:10, fontFamily:"Nunito,sans-serif" }}>
              Finished Bag Size
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Length</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color: finL>0?"#e8e0ff":"rgba(255,255,255,0.25)" }}>
                {finL>0 ? fmtInch(finL) : "—"}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Width</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500, color: finW>0?"#e8e0ff":"rgba(255,255,255,0.25)" }}>
                {finW>0 ? fmtInch(finW) : "—"}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"6px 0" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#b8a8e8", fontFamily:"Nunito,sans-serif" }}>Height</div>
              <div style={{ fontSize:22, fontFamily:"DM Mono,monospace", fontWeight:500,
                color: pH>0 ? "#e8e0ff" : "rgba(255,255,255,0.25)" }}>
                {pH>0 ? fmtInch(finH) : "add height above"}
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.35)",
              fontFamily:"Nunito,sans-serif", fontStyle:"italic", marginTop:10, lineHeight:1.4 }}>
              Estimated. Assumes SA taken at top edge to finish the bag opening.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
