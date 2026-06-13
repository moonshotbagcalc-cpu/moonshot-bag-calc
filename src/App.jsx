import { useState, useRef, useEffect } from "react";
import {
  buildBoxedCornerModel,
  fmtIn as bcFmtIn, fmtDec as bcFmtDec, ptsToPath as bcPtsToPath,
} from "./boxed-corner-core.js";
import {
  setCurrentUnit, isMetric, fmtCm,
} from "./utils/formatting.js";
import { GA_MEASUREMENT_ID, DEFAULT_SA } from "./utils/constants.js";
import {
  CP_TILE_W, CP_TILE_H,
  cpTilePlan, cpTileLabel, cpRowLabel, cpTestSquareSVG, cpRegistrationMarks,
} from "./utils/print-utils.js";
import "./moonshot.css";
import ComingSoon from "./components/ComingSoon.jsx";
import PrintButton from "./components/PrintButton.jsx";
import TrustBadge from "./components/TrustBadge.jsx";
import FracInput from "./components/FracInput.jsx";
import { SecHeader } from "./components/SharedUI.jsx";
import GussetPage from "./tabs/Gusset.jsx";
import PipingPage from "./tabs/Piping.jsx";
import LidPage from "./tabs/LidBottom.jsx";
import AccordionPocketPage from "./tabs/AccordionPocket.jsx";
import CurvedPanelPage from "./tabs/CurvedPanel.jsx";

// ── Google Analytics (GA4) ──────────────────────────────────────────────────
// Basic anonymous page tracking only. Do not send user-entered calculator values.

if (typeof window !== "undefined" && typeof document !== "undefined" && GA_MEASUREMENT_ID) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: true,
      anonymize_ip: true,
    });
  }
}

// ── Browser chrome tint (Safari tab bar, Chrome/Edge Android toolbar) ────────
if (typeof document !== "undefined" && !document.querySelector('meta[name="theme-color"]')) {
  const tc = document.createElement("meta");
  tc.name = "theme-color";
  tc.content = "#1e1040";
  document.head.appendChild(tc);
}

// ── Google Fonts ──────────────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
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
      <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.35)", marginBottom:10, fontFamily:"Nunito,sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" }}>
        Questions or feedback?
      </div>
      {!shown ? (
        <button onClick={()=>setShown(true)} style={{
          fontSize:14, fontWeight:800, fontFamily:"Nunito,sans-serif",
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
      <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.45)", marginTop:18, fontFamily:"Nunito,sans-serif", lineHeight:1.55, maxWidth:560, marginLeft:"auto", marginRight:"auto" }}>
        This calculator is for drafting your own designs and tweaking your projects — it's a math tool, not a pattern.
        Pattern designers do far more than geometry: construction, fit, instructions, and style are the real craft.
        If you love a designer's work, buy their patterns. This exists to support that world, not shortcut it.
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", marginTop:16, fontFamily:"Nunito,sans-serif" }}>
        © Moonshot · made with love for the bag-making community
      </div>
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// ── BOXED CORNER — finished-size calculator ──────────────────────────────────
// Geometry core lives in ./boxed-corner-core.js. This section is UI + print.
// ══════════════════════════════════════════════════════════════════════════════

const BC = {
  pumpkin:"#a84f14", pumpkinDark:"#763407", amber:"#ca6b27",
  cream:"#fffaf6", soft:"#f6e3d4", line:"#e6b88f", ink:"#4d2a15",
  muted:"#9a6b4e", green:"#1d6b45", stabilizer:"#3f7d6d", center:"#6c4f8c",
  warnBg:"#fff4df", warnLine:"#e6bf73", warnInk:"#7b4d08",
};
const BC_THEME={
  sec:BC.soft,hdr:BC.pumpkin,hdrTxt:"#fff",card:BC.cream,border:BC.line,
  label:BC.pumpkinDark,sub:BC.muted,accent:BC.pumpkin,inputBg:"#fbf1e9",inputTxt:BC.ink,
  resBg:"#efcdb3",resAccent:BC.pumpkinDark,resTxt:BC.ink,btnOn:BC.pumpkin,btnOnTxt:"#fff",
  btnOff:"#efd5bf",btnOffTxt:BC.pumpkinDark,info:BC.soft,infoBdr:BC.line,infoTxt:BC.ink,
  ok:"#e0f5ea",okBdr:"#5aaa80",okTxt:"#1a5c38",warn:BC.warnBg,warnBdr:BC.warnLine,warnTxt:BC.warnInk,
  nudgeBg:"#efd5bf",nudgeTxt:BC.pumpkinDark,pageBg:"#faf0e8",
};
function bcFmt(v){ return isMetric()?fmtCm(v):bcFmtIn(v); }
function bcFmtD(v){ return isMetric()?fmtCm(v):bcFmtDec(v); }

function BcSeg({options,value,set}){return <div className="bc-seg">{options.map(o=><button key={o.id} className={value===o.id?"on":""} onClick={()=>set(o.id)}>{o.label}</button>)}</div>;}

function bcRightAngleSVG(marker,X,Y,scale){
  const q=7,at={x:X(marker.at.x),y:Y(marker.at.y)};
  const e={x:marker.edgeDir.x*q,y:marker.edgeDir.y*q},c={x:marker.cutDir.x*q,y:marker.cutDir.y*q};
  return `<path d="M ${(at.x+e.x).toFixed(1)} ${(at.y+e.y).toFixed(1)} L ${(at.x+e.x+c.x).toFixed(1)} ${(at.y+e.y+c.y).toFixed(1)} L ${(at.x+c.x).toFixed(1)} ${(at.y+c.y).toFixed(1)}" fill="none" stroke="${BC.amber}" stroke-width="1.4"/>`;
}
function bcPanelDiagramSVG(m){
  const VW=760,VH=520,PAD=38,bb=m.cutBB,sc=Math.min((VW-PAD*2)/Math.max(bb.w,.001),(VH-PAD*2)/Math.max(bb.h,.001));
  const ox=(VW-bb.w*sc)/2-bb.minX*sc,oy=(VH-bb.h*sc)/2-bb.minY*sc,X=v=>v*sc+ox,Y=v=>v*sc+oy,map=pts=>pts.map(p=>({x:X(p.x),y:Y(p.y)}));
  let s=`<path d="${bcPtsToPath(map(m.cutPts),true)}" fill="#f7dfcd" fill-opacity=".52" stroke="none"/>`;
  for(const rp of m.removedPolys||[]) s+=`<path d="${bcPtsToPath(map(rp.pts),true)}" fill="#f6e3d4" fill-opacity=".72" stroke="#d69a6b" stroke-width="1.3" stroke-dasharray="5 4"/>`;
  if(m.stabilizer?.enabled&&m.stabilizer.valid&&m.stabilizer.pts?.length)s+=`<path d="${bcPtsToPath(map(m.stabilizer.pts),true)}" fill="none" stroke="${BC.stabilizer}" stroke-width="2.2" stroke-dasharray="12 5 2 5"/>`;
  for(const line of m.stitchLines||[])s+=`<path d="${bcPtsToPath(map(line.pts),false)}" fill="none" stroke="#858585" stroke-width="2" stroke-dasharray="9 7" stroke-linecap="round"/>`;
  if(m.centerLine){
    s+=`<line x1="${X(m.centerLine.a.x)}" y1="${Y(m.centerLine.a.y)}" x2="${X(m.centerLine.b.x)}" y2="${Y(m.centerLine.b.y)}" stroke="${BC.center}" stroke-width="2" stroke-dasharray="15 6 3 6"/>`;
    const cy=(Y(m.centerLine.a.y)+Y(m.centerLine.b.y))/2;
    s+=`<text x="${X(0)+10}" y="${cy}" transform="rotate(-90 ${X(0)+10} ${cy})" text-anchor="middle" font-family="Nunito,sans-serif" font-size="12" font-weight="900" fill="${BC.center}">CENTER / PLACE ON FOLD</text>`;
  }
  if(m.foldLine){s+=`<line x1="${X(m.foldLine.a.x)}" y1="${Y(m.foldLine.y)}" x2="${X(m.foldLine.b.x)}" y2="${Y(m.foldLine.y)}" stroke="#00a9b8" stroke-width="2.3" stroke-dasharray="10 6"/>`;s+=`<text x="${X((m.foldLine.a.x+m.foldLine.b.x)/2)}" y="${Y(m.foldLine.y)-8}" text-anchor="middle" font-family="Nunito,sans-serif" font-size="13" font-weight="900" fill="#007783">BOTTOM FOLD</text>`;}
  s+=`<path d="${bcPtsToPath(map(m.cutPts),true)}" fill="none" stroke="${BC.pumpkin}" stroke-width="3.4" stroke-linejoin="round"/>`;
  for(const r of m.rightAngles||[])s+=bcRightAngleSVG(r,X,Y,sc);
  const c=m.construction.bottomCorner.left,mid1={x:(c.sideFoot.x+c.meet.x)/2,y:(c.sideFoot.y+c.meet.y)/2},mid2={x:(c.meet.x+c.edgeFoot.x)/2,y:(c.meet.y+c.edgeFoot.y)/2};
  s+=`<text x="${X(mid1.x)-8}" y="${Y(mid1.y)-7}" text-anchor="end" font-family="DM Mono,monospace" font-size="12" font-weight="500" fill="${BC.pumpkinDark}">${bcFmt(m.construction.bottomCorner.sideLegCut)}</text>`;
  s+=`<text x="${X(mid2.x)+9}" y="${Y(mid2.y)}" text-anchor="start" font-family="DM Mono,monospace" font-size="12" font-weight="500" fill="${BC.pumpkinDark}">${bcFmt(m.construction.bottomCorner.edgeLegCut)}</text>`;
  s+=`<text x="${VW/2}" y="${VH-8}" text-anchor="middle" font-family="Nunito,sans-serif" font-size="13" font-weight="800" fill="${BC.muted}">Cut envelope ${bcFmt(m.cutBB.w)} W × ${bcFmt(m.cutBB.h)} H · ${m.labels.layout}</text>`;
  return s;
}

function bcPrintDoc(title,geom,spanW,spanH,rows,legend){
  const plan=cpTilePlan(spanW,spanH,true);let draw=geom;if(plan.rotated)draw=`<g transform="translate(${spanH.toFixed(4)} 0) rotate(90)">${geom}</g>`;let tiles="";
  for(let r=0;r<plan.rows;r++)for(let c=0;c<plan.cols;c++){
    const vx=c*CP_TILE_W,vy=r*CP_TILE_H,label=cpRowLabel(r)+(c+1),last=r===plan.rows-1&&c===plan.cols-1;let inner=draw;
    inner+=`<rect x="${vx}" y="${vy}" width="${CP_TILE_W}" height="${CP_TILE_H}" fill="none" stroke="#000" stroke-width="0.025"/>`+cpRegistrationMarks(vx,vy,CP_TILE_W,CP_TILE_H);
    const L=c>0?cpRowLabel(r)+c:null,R=c<plan.cols-1?cpRowLabel(r)+(c+2):null,U=r>0?cpRowLabel(r-1)+(c+1):null,D=r<plan.rows-1?cpRowLabel(r+1)+(c+1):null;
    if(L)inner+=`<text x="${vx+.08}" y="${vy+CP_TILE_H/2}" font-size=".12" font-weight="700" font-family="Nunito,sans-serif" fill="#777">← ${L}</text>`;if(R)inner+=`<text x="${vx+CP_TILE_W-.08}" y="${vy+CP_TILE_H/2}" font-size=".12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="end">${R} →</text>`;if(U)inner+=`<text x="${vx+CP_TILE_W/2}" y="${vy+.15}" font-size=".12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="middle">↑ ${U}</text>`;if(D)inner+=`<text x="${vx+CP_TILE_W/2}" y="${vy+CP_TILE_H-.08}" font-size=".12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="middle">↓ ${D}</text>`;
    tiles+=`<div class="tile${last?" last":""}"><div class="tlabel">${title} — ${label}</div><svg width="${CP_TILE_W}in" height="${CP_TILE_H}in" viewBox="${vx} ${vy} ${CP_TILE_W} ${CP_TILE_H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg></div>`;
  }
  const details=rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td></tr>`).join(""),w=window.open("","_blank");if(!w){window.alert("The print window was blocked. Allow pop-ups, then try again.");return;}
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:.5in}body{font-family:Nunito,system-ui,sans-serif;margin:0;color:#222}.page,.tile{page-break-after:always}.tile.last{page-break-after:auto}.tlabel{padding:3pt 0 0;font-size:7pt;font-weight:700;text-align:center}.tile svg{display:block;margin:0 auto}h1{font-size:15pt;margin:0 0 3pt;color:${BC.pumpkin}}h2{font-size:10pt;margin:0 0 8pt;color:#555}table{border-collapse:collapse;width:100%;font-size:10pt}td{border:1px solid #ddd;padding:4pt 7pt}td:first-child{font-weight:700;width:38%}.note{font-size:11pt;font-weight:800;margin-top:9pt;line-height:1.5}.legend{font-size:7.5pt;color:#444;margin-top:5pt}</style></head><body><div class="page"><h1>${title}</h1><h2>MoonShot Bag Calculator · ${plan.pages} pattern page${plan.pages===1?"":"s"} · ${plan.rows} × ${plan.cols} · 7″ × 9.68″ printable tiles${plan.rotated?" · auto-rotated":""}</h2><p style="font-size:9pt;font-weight:700;color:#555;margin:0 0 2pt">Verify both test squares before cutting fabric:</p>${cpTestSquareSVG()}<table>${details}</table><p class="legend">${legend}</p><p class="note">Print at 100% or Actual Size. Turn off Fit to Page, scaling, and browser headers/footers. Verify both test squares. Assemble matching tile edges using page labels and registration crosses.</p></div>${tiles}</body></html>`);w.document.close();const fire=()=>{const ready=w.document.fonts?.ready||Promise.resolve();ready.then(()=>setTimeout(()=>w.print(),80));};if(w.document.readyState==="complete")fire();else w.addEventListener("load",fire,{once:true});
}
function bcPrintPanel(m,includeStabilizer=false){
  if(!m.valid)return;const P=.4,ox=m.cutBB.minX-P,oy=m.cutBB.minY-P,shift=pts=>pts.map(q=>({x:q.x-ox,y:q.y-oy}));let g="";
  for(const line of m.stitchLines||[])g+=`<path d="${bcPtsToPath(shift(line.pts),false)}" fill="none" stroke="#888" stroke-width=".022" stroke-dasharray=".15 .10" stroke-linecap="round"/>`;
  if(includeStabilizer&&m.stabilizer?.valid)g+=`<path d="${bcPtsToPath(shift(m.stabilizer.pts),true)}" fill="none" stroke="${BC.stabilizer}" stroke-width=".028" stroke-dasharray=".22 .09 .04 .09"/>`;
  if(m.centerLine){const a={x:m.centerLine.a.x-ox,y:m.centerLine.a.y-oy},b={x:m.centerLine.b.x-ox,y:m.centerLine.b.y-oy},mx=(a.x+b.x)/2,my=(a.y+b.y)/2;g+=`<line x1="${a.x.toFixed(4)}" y1="${a.y.toFixed(4)}" x2="${b.x.toFixed(4)}" y2="${b.y.toFixed(4)}" stroke="${BC.center}" stroke-width=".024" stroke-dasharray=".28 .12 .05 .12"/>`;g+=`<text x="${(mx+.12).toFixed(4)}" y="${my.toFixed(4)}" transform="rotate(-90 ${(mx+.12).toFixed(4)} ${my.toFixed(4)})" font-size=".12" font-weight="800" font-family="Nunito,sans-serif" fill="${BC.center}" text-anchor="middle">CENTER / PLACE ON FOLD</text>`;}
  if(m.foldLine)g+=`<line x1="${(m.foldLine.a.x-ox).toFixed(4)}" y1="${(m.foldLine.y-oy).toFixed(4)}" x2="${(m.foldLine.b.x-ox).toFixed(4)}" y2="${(m.foldLine.y-oy).toFixed(4)}" stroke="#00a9b8" stroke-width=".024" stroke-dasharray=".2 .12"/>`;
  g+=`<path d="${bcPtsToPath(shift(m.cutPts),true)}" fill="none" stroke="${BC.pumpkin}" stroke-width=".04" stroke-linejoin="round"/>`;
  for(const r of m.rightAngles){const at={x:r.at.x-ox,y:r.at.y-oy},q=.10,e={x:r.edgeDir.x*q,y:r.edgeDir.y*q},c={x:r.cutDir.x*q,y:r.cutDir.y*q};g+=`<path d="M ${(at.x+e.x).toFixed(4)} ${(at.y+e.y).toFixed(4)} L ${(at.x+e.x+c.x).toFixed(4)} ${(at.y+e.y+c.y).toFixed(4)} L ${(at.x+c.x).toFixed(4)} ${(at.y+c.y).toFixed(4)}" fill="none" stroke="${BC.pumpkin}" stroke-width=".016"/>`;}
  const c=m.construction.bottomCorner,rows=[["Finished size",`${bcFmt(m.checks.topW)} top · ${bcFmt(m.checks.botW)} bottom · ${bcFmt(m.checks.height)} H · ${bcFmt(m.checks.depth)} D`],["Panel cut envelope",`${bcFmt(m.cutBB.w)} W × ${bcFmt(m.cutBB.h)} H`],["Cut quantity",`${m.quantity} · ${m.labels.layout}`],["Bottom corner — from side",bcFmt(c.sideLegCut)],[m.params.layout==="fold"?"Bottom corner — from fold":"Bottom corner — from bottom edge",bcFmt(c.edgeLegCut)],["Usable matched legs after side/bottom seam",`${bcFmt(c.sideLegFinished)} + ${bcFmt(c.edgeLegFinished)}`],["Seam allowance",bcFmt(m.params.sa)],["Construction",`${m.labels.shape} · ${m.labels.topMode}`]];
  if(includeStabilizer&&m.stabilizer?.valid)rows.push(["Stabilizer overlay",`${bcFmt(m.stabilizer.offset)} inside fabric cut edge`]);
  const stabLegend=includeStabilizer&&m.stabilizer?.valid?` · green dash-dot = stabilizer cut line`:"";
  bcPrintDoc("Boxed Corner — Main Panel",g,m.cutBB.w+P*2,m.cutBB.h+P*2,rows,`Pumpkin solid = fabric cut · grey dashed = assembly stitch lines only · purple dash-dot = center / place on fold · cyan dashed = bottom fold${stabLegend}. Small corner symbols confirm that each box-cut leg leaves its source edge at 90°.`);
}
function bcPrintStabilizer(m){
  if(!m.valid||!m.stabilizer?.enabled||!m.stabilizer.valid)return;const P=.4,bb=m.stabilizer.bb,ox=bb.minX-P,oy=bb.minY-P,shift=pts=>pts.map(q=>({x:q.x-ox,y:q.y-oy}));let g="";
  if(m.stabilizer.centerLine){const a={x:m.stabilizer.centerLine.a.x-ox,y:m.stabilizer.centerLine.a.y-oy},b={x:m.stabilizer.centerLine.b.x-ox,y:m.stabilizer.centerLine.b.y-oy},mx=(a.x+b.x)/2,my=(a.y+b.y)/2;g+=`<line x1="${a.x.toFixed(4)}" y1="${a.y.toFixed(4)}" x2="${b.x.toFixed(4)}" y2="${b.y.toFixed(4)}" stroke="${BC.center}" stroke-width=".024" stroke-dasharray=".28 .12 .05 .12"/>`;g+=`<text x="${(mx+.12).toFixed(4)}" y="${my.toFixed(4)}" transform="rotate(-90 ${(mx+.12).toFixed(4)} ${my.toFixed(4)})" font-size=".12" font-weight="800" font-family="Nunito,sans-serif" fill="${BC.center}" text-anchor="middle">CENTER / PLACE ON FOLD</text>`;}
  if(m.stabilizer.foldLine)g+=`<line x1="${(m.stabilizer.foldLine.a.x-ox).toFixed(4)}" y1="${(m.stabilizer.foldLine.a.y-oy).toFixed(4)}" x2="${(m.stabilizer.foldLine.b.x-ox).toFixed(4)}" y2="${(m.stabilizer.foldLine.b.y-oy).toFixed(4)}" stroke="#00a9b8" stroke-width=".024" stroke-dasharray=".2 .12"/>`;
  g+=`<path d="${bcPtsToPath(shift(m.stabilizer.pts),true)}" fill="none" stroke="${BC.stabilizer}" stroke-width=".04" stroke-linejoin="round"/>`;
  const rows=[["Stabilizer cut envelope",`${bcFmt(bb.w)} W × ${bcFmt(bb.h)} H`],["Offset from fabric cut edge",bcFmt(m.stabilizer.offset)],["Cut quantity",`${m.quantity} · ${m.labels.layout}`],["Fabric finished size",`${bcFmt(m.checks.topW)} top · ${bcFmt(m.checks.botW)} bottom · ${bcFmt(m.checks.height)} H · ${bcFmt(m.checks.depth)} D`],["Construction",`${m.labels.shape} · ${m.labels.topMode}`]];
  bcPrintDoc("Boxed Corner — Stabilizer",g,bb.w+P*2,bb.h+P*2,rows,"Green solid = stabilizer cut line · purple dash-dot = center / place on fold · cyan dashed = bottom fold.");
}

function BcResultBand({m}){const c=m.construction.bottomCorner;return <><div className="bc-resultBand"><div className="bc-resultLine"><div className="bc-resultCell"><div className="rk">Panel Cut Envelope</div><div className="rv">{bcFmt(m.cutBB.w)} W × {bcFmt(m.cutBB.h)} H</div></div><div className="bc-resultCell"><div className="rk">Cut Quantity</div><div className="rv">{m.quantity} · {m.labels.layout}</div></div></div><div className="bc-resultLine"><div className="bc-resultCell"><div className="rk">Corner From Side Edge</div><div className="rv">{bcFmt(c.sideLegCut)}</div></div><div className="bc-resultCell"><div className="rk">Corner From {m.params.layout==="fold"?"Fold":"Bottom Edge"}</div><div className="rv">{bcFmt(c.edgeLegCut)}</div></div></div><div className="bc-resultLine"><div className="bc-resultCell"><div className="rk">Matched After Sewing</div><div className="rv small">{bcFmt(c.sideLegFinished)} side · {bcFmt(c.edgeLegFinished)} bottom/fold</div></div><div className="bc-resultCell"><div className="rk">Construction</div><div className="rv small">{m.labels.shape} · {m.labels.topMode}</div></div></div>{m.stabilizer?.enabled&&m.stabilizer.valid&&<div className="bc-resultLine"><div className="bc-resultCell"><div className="rk">Stabilizer Cut Envelope</div><div className="rv">{bcFmt(m.stabilizer.bb.w)} W × {bcFmt(m.stabilizer.bb.h)} H</div></div><div className="bc-resultCell"><div className="rk">Stabilizer Offset</div><div className="rv">{bcFmt(m.stabilizer.offset)}</div></div></div>}</div><div className="bc-checkGrid">{[["Top",m.checks.topW],["Bottom",m.checks.botW],["Height",m.checks.height],["Depth",m.checks.depth]].map(x=><div className="bc-check" key={x[0]}><div className="k">Finished {x[0]}</div><div className="v">{bcFmt(x[1])} ✓</div></div>)}</div></>}


function BoxedCornerPage(){
  const th=BC_THEME;
  const [twW,setTwW]=useState(7),[twF,setTwF]=useState(0);const [bwW,setBwW]=useState(10),[bwF,setBwF]=useState(0);const [hW,setHW]=useState(8),[hF,setHF]=useState(0);const [dW,setDW]=useState(4),[dF,setDF]=useState(0);const [saW,setSaW]=useState(0),[saF,setSaF]=useState(DEFAULT_SA);
  const [layout,setLayout]=useState("two"),[shape,setShape]=useState("rect"),[topMode,setTopMode]=useState("open"),[decMode,setDecMode]=useState(false);
  const [stabEnabled,setStabEnabled]=useState(false),[stabW,setStabW]=useState(0),[stabF,setStabF]=useState(DEFAULT_SA),[stabPrintMode,setStabPrintMode]=useState("overlay");
  const floatRef=useRef(null),dragRef=useRef(null),resizeRef=useRef(null);const [dragging,setDragging]=useState(false),[resizing,setResizing]=useState(false),[floatOpen,setFloatOpen]=useState(true),[canFloat,setCanFloat]=useState(()=>typeof window!=="undefined"?window.innerWidth>=900:false),[dockSide,setDockSide]=useState("right"),[collapsed,setCollapsed]=useState(true);
  const [floatPos,setFloatPos]=useState(()=>({x:typeof window!=="undefined"?Math.max(18,window.innerWidth-358):18,y:86}));const [floatSize,setFloatSize]=useState({w:340,h:355});
  const sa=saW+saF,stabilizerOffset=stabW+stabF;
  const setStabilizerValue=v=>{const n=Math.max(0,+v||0),w=Math.floor(n);setStabW(w);setStabF(n-w);};
  const params={topW:shape==="rect"?bwW+bwF:twW+twF,botW:bwW+bwF,height:hW+hF,depth:dW+dF,sa,layout,shape,topMode,stabilizerEnabled:stabEnabled,stabilizerOffset};
  const m=buildBoxedCornerModel(params),plan=cpTilePlan(m.cutBB.w+.8,m.cutBB.h+.8),stabPlan=m.stabilizer?.valid&&m.stabilizer.bb?cpTilePlan(m.stabilizer.bb.w+.8,m.stabilizer.bb.h+.8):null;
  const overlayRequested=stabEnabled&&stabPrintMode==="overlay",overlayStabilizer=overlayRequested&&m.stabilizer.valid;
  const clampSize=z=>typeof window==="undefined"?z:{w:Math.max(280,Math.min(z.w,Math.min(620,window.innerWidth-20))),h:Math.max(250,Math.min(z.h,Math.min(720,window.innerHeight-20)))};const clampPos=(z,size=floatSize)=>{if(typeof window==="undefined")return z;const q=clampSize(size),p=10;return{x:Math.max(p,Math.min(z.x,window.innerWidth-q.w-p)),y:Math.max(p,Math.min(z.y,window.innerHeight-q.h-p))}};
  const dock=x=>{setDockSide(x);setCollapsed(true);setFloatOpen(true)};const undock=()=>{if(typeof window==="undefined")return;const r=floatRef.current?.getBoundingClientRect(),sz=clampSize({w:r?.width||floatSize.w,h:r?.height||floatSize.h});setFloatSize(sz);setDockSide(null);setCollapsed(false);setFloatPos(clampPos({x:Math.max(12,(window.innerWidth-sz.w)/2),y:Math.max(74,r?.top||86)},sz));};
  const reset=()=>{if(typeof window==="undefined")return;const sz=clampSize({w:340,h:355});setFloatSize(sz);setDockSide(null);setCollapsed(false);setFloatOpen(true);setFloatPos(clampPos({x:window.innerWidth-sz.w-18,y:86},sz));};
  const startDrag=e=>{if((e.button!==undefined&&e.button!==0)||e.target.closest("button")||dockSide)return;const r=floatRef.current?.getBoundingClientRect();if(!r)return;dragRef.current={dx:e.clientX-r.left,dy:e.clientY-r.top,lastX:e.clientX};setDragging(true);e.preventDefault();};const startResize=e=>{const r=floatRef.current?.getBoundingClientRect();if(!r)return;resizeRef.current={x:e.clientX,y:e.clientY,w:r.width,h:r.height,side:dockSide};setResizing(true);e.preventDefault();e.stopPropagation();};
  useEffect(()=>{const f=()=>{setCanFloat(window.innerWidth>=900);setFloatSize(x=>clampSize(x));if(!dockSide)setFloatPos(x=>clampPos(x));};f();window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f)},[dockSide]);
  useEffect(()=>{if(!dragging)return;const move=e=>{const d=dragRef.current;if(!d)return;d.lastX=e.clientX;setFloatPos(clampPos({x:e.clientX-d.dx,y:e.clientY-d.dy}))};const stop=()=>{const d=dragRef.current;if(d?.lastX<=34)dock("left");else if(d?.lastX>=window.innerWidth-34)dock("right");dragRef.current=null;setDragging(false)};window.addEventListener("pointermove",move);window.addEventListener("pointerup",stop,{once:true});return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop)}},[dragging,floatSize]);
  useEffect(()=>{if(!resizing)return;const move=e=>{const r=resizeRef.current;if(!r)return;const dx=r.side==="right"?r.x-e.clientX:e.clientX-r.x,next=clampSize({w:r.w+dx,h:r.h+e.clientY-r.y});setFloatSize(next);if(!r.side)setFloatPos(x=>clampPos(x,next))};const stop=()=>{resizeRef.current=null;setResizing(false)};window.addEventListener("pointermove",move);window.addEventListener("pointerup",stop,{once:true});return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop)}},[resizing,dockSide]);
  return <div className="bc-wrap" style={{minHeight:"100vh",padding:"16px 16px 48px"}}><div style={{background:th.sec,borderRadius:14,boxShadow:"0 4px 18px rgba(118,52,7,.11)"}}><SecHeader th={th} title="Boxed Corner" sub="Work backward from finished width, height, and depth. Rectangle and tapered panels use the same trusted corner model; folded pieces are mirrored exactly across the bottom fold."/><div style={{padding:"12px 12px 18px"}}><div className="bc-topbar"><div className="bc-hint" style={{margin:0}}>The diagram, dimension checks, and full-size print pattern all use the same geometry model.</div>{!isMetric()&&<label className="bc-decToggle"><input type="checkbox" checked={decMode} onChange={e=>setDecMode(e.target.checked)}/>Decimal input</label>}</div>
    <div className="bc-card"><div className="bc-controlSection"><h2>Finished Dimensions</h2><div className="bc-row"><FracInput variant="bc" label="Top width" ghost={shape==="rect"} decMode={decMode} whole={shape==="rect"?bwW:twW} frac={shape==="rect"?bwF:twF} onWhole={setTwW} onFrac={setTwF}/><FracInput variant="bc" label="Bottom width" decMode={decMode} whole={bwW} frac={bwF} onWhole={setBwW} onFrac={setBwF}/><FracInput variant="bc" label="Height" decMode={decMode} whole={hW} frac={hF} onWhole={setHW} onFrac={setHF}/><FracInput variant="bc" label="Depth" decMode={decMode} whole={dW} frac={dF} onWhole={setDW} onFrac={setDF}/><FracInput variant="bc" label="Seam allowance" decMode={decMode} whole={saW} frac={saF} onWhole={setSaW} onFrac={setSaF}/></div><p className="bc-hint">For a rectangle, top width follows bottom width. A trapezoid may use different top and bottom widths.</p></div><div className="bc-lowerControls"><div className="bc-controlSection"><h2>Panel Layout</h2><BcSeg value={layout} set={setLayout} options={[{id:"two",label:"2 Separate Panels"},{id:"fold",label:"1 Mirrored Fold"}]}/><p className="bc-hint">The folded piece has no bottom seam allowance. Its side-edge corner leg still includes seam allowance so both boxed edges match after the side seam is sewn.</p></div><div className="bc-controlSection"><h2>Shape & Top</h2><BcSeg value={shape} set={setShape} options={[{id:"rect",label:"Rectangle"},{id:"trap",label:"Trapezoid"}]}/><div style={{height:6}}/><BcSeg value={topMode} set={setTopMode} options={[{id:"open",label:"Open Top"},{id:"enclosed",label:"Top Boxed"}]}/><p className="bc-hint">Every trapezoid box-cut leg leaves its own source edge at 90°; the two legs meet at the finished face corner.</p></div></div></div>
    <div className="bc-card"><div className="bc-controlSection"><h2>Stabilizer</h2><BcSeg value={stabEnabled?"add":"none"} set={v=>setStabEnabled(v==="add")} options={[{id:"none",label:"No Stabilizer"},{id:"add",label:"Add Stabilizer"}]}/>{stabEnabled&&<><div className="bc-stabGrid"><FracInput variant="bc" label="Offset from fabric cut edge" decMode={decMode} whole={stabW} frac={stabF} onWhole={setStabW} onFrac={setStabF}/><button className="bc-matchSa" onClick={()=>setStabilizerValue(sa)}>Match Seam Allowance</button><div className="bc-stabPrint"><label>Print stabilizer</label><BcSeg value={stabPrintMode} set={setStabPrintMode} options={[{id:"overlay",label:"On Main Pattern"},{id:"separate",label:"Separately"}]}/></div></div><p className="bc-hint">The stabilizer is one continuous inset of the fabric outline. Matching the seam allowance keeps it out of the stitched seams; on sewn edges, the green stabilizer line will intentionally coincide with the grey stitch line. Choose a larger offset when you want more clearance.</p></>}</div></div>
    {m.notes.length>0&&<div className="bc-warn">Geometry note:<ul>{m.notes.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
    <TrustBadge tone="bc" valid={m.valid}
      okMessage="✓ Finished dimensions verified: top, bottom, height, and depth reconstruct exactly from the cut geometry."
      lockLabel="Pattern output locked" errors={m.errors}/>
    {stabEnabled&&<TrustBadge tone="bc" valid={m.stabilizer.valid}
      okMessage={`✓ Stabilizer outline verified ${bcFmt(m.stabilizer.offset)} inside every fabric cut edge.`}
      lockLabel="Stabilizer output locked" errors={m.stabilizer.errors}/>}
    <div className="bc-card bc-diagramCard"><svg viewBox="0 0 760 520" style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label="Live boxed corner panel diagram" dangerouslySetInnerHTML={{__html:bcPanelDiagramSVG(m)}}/><p className="bc-diagramLegend">Solid pumpkin = fabric cut &nbsp; Grey dashed = assembly stitch lines &nbsp; Purple dash-dot = center / place on fold &nbsp; Cyan dashed = bottom fold {stabEnabled&&m.stabilizer.valid&&<>&nbsp; Green dash-dot = stabilizer cut</>}</p></div>{m.valid&&<BcResultBand m={m}/>} 
    {canFloat&&floatOpen&&dockSide&&collapsed&&<button className={"bc-dockTab "+dockSide} style={{top:Math.max(86,Math.min(floatPos.y,typeof window!=="undefined"?window.innerHeight-210:120))}} onClick={undock}><span className="bc-liveDot" style={{background:m.valid?"#2f9a62":"#c23b47"}}/>Live Pattern Feed</button>}
    {canFloat&&floatOpen&&!(dockSide&&collapsed)&&<div ref={floatRef} className={"bc-floatDock"+(dragging?" dragging":"")+(resizing?" resizing":"")+(dockSide?" docked-"+dockSide:"")} style={dockSide?{[dockSide]:0,top:Math.max(72,Math.min(floatPos.y,typeof window!=="undefined"?window.innerHeight-Math.min(floatSize.h,window.innerHeight-82)-10:86)),width:floatSize.w,height:typeof window!=="undefined"?Math.min(floatSize.h,window.innerHeight-82):floatSize.h}:{left:floatPos.x,top:floatPos.y,width:floatSize.w,height:floatSize.h}}><div className="bc-floatHead" onPointerDown={startDrag}><div className="bc-missionBrand"><span className="bc-liveDot" style={{background:m.valid?"#2f9a62":"#c23b47"}}/><div><div className="bc-missionTitle">MoonShot Mission Control</div><div className="bc-missionFeed">Live Boxed-Corner Feed</div></div></div><button className="bc-floatClose" onPointerDown={e=>e.stopPropagation()} onClick={()=>{setDockSide(dockSide||"right");setCollapsed(true)}}>×</button></div><div className="bc-floatNav"><button onClick={()=>dock("left")}>← Dock Left</button><button onClick={reset}>ReCenter</button><button onClick={()=>dock("right")}>Dock Right →</button></div><div className="bc-floatBody"><svg viewBox="0 0 760 520" style={{width:"100%",height:"auto",display:"block"}} dangerouslySetInnerHTML={{__html:bcPanelDiagramSVG(m)}}/><div className="bc-floatMeta">{bcFmt(m.cutBB.w)} W × {bcFmt(m.cutBB.h)} H cut · {bcFmt(params.depth)} finished depth · {m.labels.layout}</div></div><div className={"bc-resizeHandle "+(dockSide==="right"?"left":"right")} onPointerDown={startResize}/></div>}
    <div className="bc-card" style={{marginTop:8}}><h2>Print Pattern</h2><div className="bc-printGrid"><div className="bc-printCard"><div className="pt">Main Panel</div><div className="pm">Actual-size fabric cut outline, assembly stitch lines only, center place-on-fold line, bottom fold where used, perpendicular-corner marks, registration crosses, and test squares.{overlayStabilizer?" The stabilizer cut line is overlaid in green.":""}</div><PrintButton tone="bc" label="Print Main Panel" meta={cpTileLabel(plan)} disabled={!m.valid||(overlayRequested&&!m.stabilizer.valid)} onClick={()=>bcPrintPanel(m,overlayStabilizer)}/></div>{stabEnabled&&stabPrintMode==="separate"&&<div className="bc-printCard"><div className="pt">Stabilizer</div><div className="pm">A separate actual-size pattern inset {bcFmt(stabilizerOffset)} from the fabric cut edge, with its own center place-on-fold line and bottom fold when applicable.</div><PrintButton tone="bc" label="Print Stabilizer" meta={stabPlan?cpTileLabel(stabPlan):"Adjust stabilizer offset"} disabled={!m.valid||!m.stabilizer.valid||!stabPlan} onClick={()=>bcPrintStabilizer(m)}/></div>}</div></div>
  </div></div></div>;
}



// ══════════════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  {
    id:"basic", label:"Basic", color:"#7658b3",
    pages:[
      {id:"lid", label:"Lid & Bottom", color:"#5a2da0"},
      {id:"gusset", label:"Gusset", color:"#1a6e3a"},
      {id:"piping", label:"Piping", color:"#8e1a9e"},
    ],
  },
  {
    id:"advanced", label:"Advanced", color:"#9a3e52",
    pages:[
      {id:"advanced", label:"Curved Panel", color:"#7a1a2e"},
      {id:"boxed", label:"Boxed Corner", color:"#a84f14"},
      {id:"foldtuck", label:"Fold & Tuck", color:"#9a4968", coming:true},
    ],
  },
  {
    id:"pockets", label:"Pockets", color:"#356b9b",
    pages:[
      {id:"bottle", label:"Accordion", color:"#1a4a7a"},
      {id:"zippered", label:"Zippered", color:"#176b78", coming:true},
      {id:"welt", label:"Welt", color:"#3a5c99", coming:true},
    ],
  },
  {
    id:"trims", label:"Trims & Straps", color:"#167a73",
    pages:[
      {id:"trims", label:"Trims & Straps", color:"#167a73", coming:true},
    ],
  },
];

function navGroupForPage(pageId) {
  return NAV_GROUPS.find(group => group.pages.some(item => item.id === pageId)) || NAV_GROUPS[0];
}

function NavRocketIcon() {
  return (
    <svg className="nav-rocket" viewBox="0 0 18 24" fill="none" aria-hidden="true">
      <path className="trail" d="M7.2 16.2 C5.8 18.7 6.8 22.1 9 23.6 C11.2 22.1 12.2 18.7 10.8 16.2Z"
        fill="rgba(255,193,72,.72)"/>
      <path d="M9 1.7 C9 1.7 3.8 7.2 4 13.3 L9 16.9 L14 13.3 C14.2 7.2 9 1.7 9 1.7Z"
        fill="rgba(83,224,211,.17)" stroke="rgba(100,235,222,.92)" strokeWidth="1.1"/>
      <circle cx="9" cy="9.2" r="2" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.8)" strokeWidth=".9"/>
      <path d="M4.5 13.2 L2.8 17.1 L7 15.5 M13.5 13.2 L15.2 17.1 L11 15.5"
        stroke="rgba(255,193,72,.68)" strokeWidth=".9" strokeLinecap="round"/>
      <circle className="spark" cx="2.1" cy="8" r=".8" fill="rgba(255,255,255,.9)" style={{animationDelay:"-.7s"}}/>
      <circle className="spark" cx="15.9" cy="5.5" r=".6" fill="rgba(255,221,143,.95)" style={{animationDelay:"-1.5s"}}/>
    </svg>
  );
}

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
      <div style={{ fontSize:14, fontWeight:800, color:"#c8b8f0", marginBottom:6, fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em" }}>
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
  const [unitMode, setUnitMode] = useState("imperial");
  setCurrentUnit(unitMode);
  const scrollPositions = useRef({});
  const visitedTabs     = useRef(new Set(["lid"]));
  const lastPageByGroup = useRef({ basic:"lid", advanced:"advanced", pockets:"bottle", trims:"trims" });
  const [isPhoneNav,setIsPhoneNav]=useState(()=>typeof window!=="undefined" ? window.matchMedia("(max-width: 600px)").matches : false);
  const [mobileNavCollapsed,setMobileNavCollapsed]=useState(false);
  const mobileLastScroll=useRef(0);

  // ── Page-reactive background patterns ──────────────────────────────────────
  const PAGE_PATTERNS = {
    lid: {
      color: "#f0ecfc",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cline x1='0' y1='44' x2='44' y2='0' stroke='%235a2da0' stroke-width='0.7' opacity='0.09'/%3E%3C/svg%3E")`,
    },
    gusset: {
      color: "#ecf8f0",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Cpath d='M30 0 L0 0 0 30' fill='none' stroke='%231a6e3a' stroke-width='0.6' opacity='0.22'/%3E%3C/svg%3E")`,
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
    boxed: {
      color: "#faf0e8",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Cpath d='M0 15 H30 M15 0 V30' stroke='%23a84f14' stroke-width='0.55' opacity='0.08'/%3E%3C/svg%3E")`,
    },
    foldtuck: {
      color: "#f7edf1",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M0 24 L8 16 L16 24 L24 16 L32 24' fill='none' stroke='%239a4968' stroke-width='0.65' opacity='0.09'/%3E%3C/svg%3E")`,
    },
    zippered: {
      color: "#eaf6f7",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cline x1='12' y1='0' x2='12' y2='24' stroke='%23176b78' stroke-width='0.55' opacity='0.09'/%3E%3C/svg%3E")`,
    },
    welt: {
      color: "#eef1f8",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='18'%3E%3Cline x1='0' y1='9' x2='36' y2='9' stroke='%233a5c99' stroke-width='0.65' opacity='0.09'/%3E%3C/svg%3E")`,
    },
    trims: {
      color: "#eaf7f5",
      img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26'%3E%3Ccircle cx='13' cy='13' r='1.4' fill='%23167a73' opacity='0.1'/%3E%3C/svg%3E")`,
    },
  };

  useEffect(()=>{
    const mq=window.matchMedia("(max-width: 600px)");
    const update=()=>{setIsPhoneNav(mq.matches);if(!mq.matches)setMobileNavCollapsed(false);};
    update();
    if(mq.addEventListener)mq.addEventListener("change",update);else mq.addListener(update);
    return ()=>{if(mq.removeEventListener)mq.removeEventListener("change",update);else mq.removeListener(update);};
  },[]);

  useEffect(()=>{
    if(!isPhoneNav)return;
    mobileLastScroll.current=window.scrollY;
    let ticking=false;
    const onScroll=()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{
        const y=Math.max(0,window.scrollY);
        const delta=y-mobileLastScroll.current;
        if(y<48)setMobileNavCollapsed(false);
        else if(delta>7)setMobileNavCollapsed(true);
        else if(delta<-7)setMobileNavCollapsed(false);
        mobileLastScroll.current=y;
        ticking=false;
      });
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[isPhoneNav]);

  useEffect(()=>{ if(isPhoneNav)setMobileNavCollapsed(false); },[page,isPhoneNav]);

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
    if (newPage === page) return;
    // Save current scroll position for the tab we're leaving
    scrollPositions.current[page] = window.scrollY;
    const destinationGroup = navGroupForPage(newPage);
    lastPageByGroup.current[destinationGroup.id] = newPage;
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

  function handleGroupClick(group) {
    const target = lastPageByGroup.current[group.id] || group.pages[0].id;
    handleTabClick(target);
  }

  const activeGroup = navGroupForPage(page);

  return (
    <div className="ms-app">

      {/* ── Header + sticky tab bar — one solid #1e1040 block, no gap ── */}
      <div className={`ms-site-header${isPhoneNav&&mobileNavCollapsed?" mobile-collapsed":""}`} style={{ background:"#1e1040", position:"sticky", top:0, zIndex:10,
        boxShadow:"0 2px 12px rgba(0,0,0,0.34)", borderRadius:"0 0 5px 5px" }}>
        {/* Moonshot wordmark */}
        <div className="ms-header-inner" style={{ padding:"16px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div className="ms-wordmark" style={{ fontSize:"clamp(28px, 8vw, 42px)", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", fontFamily:"Nunito,sans-serif", lineHeight:1.05 }}>
              Moonshot
              <span style={{ color:"#9880d8" }}> Bag Calculator</span>
            </div>
            {/* Units toggle — metric coming soon */}
            <div className="ms-header-tools" style={{ flexShrink:0, marginLeft:10, marginTop:4, textAlign:"right", display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              <div style={{ display:"flex", border:"1.5px solid rgba(152,128,216,0.5)", borderRadius:20, overflow:"hidden", background:"rgba(255,255,255,0.06)" }}>
                {["imperial","metric"].map(u => (
                  <button key={u} onClick={()=>setUnitMode(u)} style={{
                    fontSize:12, fontWeight:900, color:unitMode===u?"#1e1040":"rgba(255,255,255,0.68)",
                    fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
                    background:unitMode===u?"#c8b8f0":"transparent", border:"none",
                    padding:"5px 10px", whiteSpace:"nowrap", cursor:"pointer", textTransform:"capitalize"
                  }}>
                    {u === "imperial" ? "Imperial" : "Metric"}
                  </button>
                ))}
              </div>
              <button onClick={()=>{
                window.open('https://moonshotbagcalc-cpu.github.io/moonshot-bag-calc/thread-needle.html', 'moonshot-thread-guide');
              }} style={{
                fontSize:12, fontWeight:800, color:"#3a1060",
                fontFamily:"Nunito,sans-serif", letterSpacing:"0.04em",
                background:"#ccc8d8", border:"1.5px solid #b8b0cc",
                borderRadius:20, padding:"4px 10px", whiteSpace:"nowrap",
                cursor:"pointer"
              }}>
                Thread &amp; Needle Guide
              </button>
            </div>
          </div>
          <div className="ms-header-tagline" style={{ fontSize:"clamp(14px, 3.5vw, 18px)", fontWeight:700, color:"rgba(255,255,255,0.5)",
            fontFamily:"Nunito,sans-serif", marginTop:4, marginBottom:7,
            letterSpacing:"0.01em", fontStyle:"italic" }}>
            Houston, we have the math.
          </div>
        </div>
        {/* Compact two-level navigation */}
        <div className="ms-nav-wrap" style={{ padding:"0 14px 4px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:4 }}>
            {NAV_GROUPS.map(group => {
              const active = activeGroup.id === group.id;
              return (
                <button key={group.id} onClick={()=>handleGroupClick(group)} aria-pressed={active} style={{
                  minWidth:0, padding:"5px 4px 4px", border:"none", cursor:"pointer",
                  borderRadius:7, background:active?"rgba(255,255,255,0.12)":"transparent",
                  color:active?"#fff":"rgba(255,255,255,0.48)",
                  borderBottom:active?`2px solid ${group.color}`:"2px solid transparent",
                  fontFamily:"Nunito,sans-serif", fontWeight:900,
                  fontSize:"clamp(9px,1.7vw,11px)", letterSpacing:"0.055em",
                  textTransform:"uppercase", lineHeight:1.05,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  transition:"background .15s,color .15s,border-color .15s"
                }}>{group.label}</button>
              );
            })}
          </div>
          <div style={{
            display:"flex", justifyContent:activeGroup.pages.length===1?"center":"stretch",
            gap:4, paddingTop:4, borderTop:"1px solid rgba(255,255,255,0.07)"
          }}>
            {activeGroup.pages.map(item => {
              const active = page === item.id;
              return (
                <button key={item.id} onClick={()=>handleTabClick(item.id)} aria-current={active?"page":undefined} style={{
                  flex:activeGroup.pages.length===1?"0 1 180px":"1 1 0", minWidth:0,
                  padding:"6px 5px", border:"none", cursor:"pointer",
                  borderRadius:"7px 7px 3px 3px",
                  background:active?item.color:"rgba(255,255,255,0.065)",
                  color:active?"#fff":"rgba(255,255,255,0.62)",
                  boxShadow:active?`inset 0 -2px 0 rgba(255,255,255,.18)`:"none",
                  fontFamily:"Nunito,sans-serif", fontWeight:800,
                  fontSize:"clamp(10px,1.95vw,12px)", letterSpacing:"0.015em",
                  lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  transition:"background .15s,color .15s"
                }}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,minWidth:0}}>
                  {item.coming&&<NavRocketIcon/>}<span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>
                </span></button>
              );
            })}
          </div>
        </div>
        <div className="ms-mobile-peek" role="button" tabIndex={0}
          aria-label={mobileNavCollapsed?"Show MoonShot navigation":"Hide MoonShot navigation"}
          onClick={()=>setMobileNavCollapsed(v=>!v)}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setMobileNavCollapsed(v=>!v);}}}>
          <strong>MoonShot</strong>
          <span>{activeGroup.label} · {activeGroup.pages.find(item=>item.id===page)?.label||"Bag Calculator"}</span>
          <b>{mobileNavCollapsed?"⌄":"⌃"}</b>
        </div>
      </div>

      {/* ── Intro (shows only on first tab) ── */}
      {page==="lid" && <IntroCard />}

      {/* ── Page content — always mounted, shown/hidden to preserve state ── */}
      <div style={{display:page==="lid"      ?"block":"none"}}><LidPage /></div>
      <div style={{display:page==="gusset"   ?"block":"none"}}><GussetPage /></div>
      <div style={{display:page==="piping"   ?"block":"none"}}><PipingPage /></div>
      <div style={{display:page==="bottle"   ?"block":"none"}}><AccordionPocketPage /></div>
      <div style={{display:page==="advanced" ?"block":"none"}}><CurvedPanelPage /></div>
      <div style={{display:page==="boxed"     ?"block":"none"}}><BoxedCornerPage /></div>
      <div style={{display:page==="foldtuck"  ?"block":"none"}}><ComingSoon label="Fold & Tuck" /></div>
      <div style={{display:page==="zippered"  ?"block":"none"}}><ComingSoon label="Zippered Pocket" /></div>
      <div style={{display:page==="welt"      ?"block":"none"}}><ComingSoon label="Welt Pocket" /></div>
      <div style={{display:page==="trims"     ?"block":"none"}}><ComingSoon label="Trims & Straps" /></div>

      {/* ── Footer ── */}
      <ContactFooter />
    </div>
  );
}
