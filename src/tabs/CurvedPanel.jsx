import { useState, useRef, useEffect } from "react";
import {
  buildCurvedPanelModel,
  fmtIn as cpFmtIn, fmtDec as cpFmtDec, ptsToPath as cpPtsToPath,
  markDetails as cpMarkDetails,
} from "../curved-panel-core.js";
import { isMetric, fmtCm } from "../utils/formatting.js";
import { DEFAULT_SA } from "../utils/constants.js";
import { T } from "../utils/theme.js";
import {
  CP_TILE_W, CP_TILE_H,
  cpTilePlan, cpTileLabel, cpRowLabel, cpTestSquareSVG, cpRegistrationMarks,
} from "../utils/print-utils.js";
import { SecHeader } from "../components/SharedUI.jsx";
import TrustBadge from "../components/TrustBadge.jsx";
import PrintButton from "../components/PrintButton.jsx";
import FracInput from "../components/FracInput.jsx";

// ══════════════════════════════════════════════════════════════════════════════
// ── CURVED PANEL — fair-curve calculator (replaces the old Advanced tab) ──────
// Geometry core lives in ./curved-panel-core.js (pure JS, shared with the
// standalone curved-panel-prototype.html). This section is UI + print only.
// ══════════════════════════════════════════════════════════════════════════════

// ── Curved Panel theme tokens (Moonshot maroon palette) ───────────────────────
const CP = {
  maroon:"#8e1d3c", maroonDark:"#6f152e", rose:"#c2476b",
  pinkBg:"#fdf4f6", pinkSoft:"#f7e3e9", pinkLine:"#ecccd6", ink:"#4a2230",
  muted:"#9a6b7b", green:"#1d6b45",
  amberBg:"#fdf3e0", amberInk:"#8a5a10", amberLine:"#e8c98a",
};

// Unit-aware display formatting: cm in metric mode, fractional inches otherwise.
// (Pattern tiles are 1:1 physical drawings and unaffected; only labels change.)
function cpFmt(v){ return isMetric() ? fmtCm(v) : cpFmtIn(v); }
function cpFmtD(v){ return isMetric() ? fmtCm(v) : cpFmtDec(v); }

/* =====================================================================
   TILED PRINT ENGINE — 7" × 10" tiles, Letter and A4 safe at 100%.
   Kept as-is from the standalone prototype: pure DOM generation.
   ===================================================================== */
/* Print colors */
const C_CUT    = CP.maroon;
const C_SEW    = "#aaaaaa";
const C_BORDER = "#000000";
const C_CENTER = "#00bcd4";
const C_PIECE_CENTER = "#b59ca5";
const C_MARK   = CP.maroon;
const C_NOTCH  = "#1565c0";

function cpPrintDoc(title, geom, spanW, spanH, detailRows, legendLine, allowRotate=true){
  const plan=cpTilePlan(spanW,spanH,allowRotate);
  let draw=geom;
  if(plan.rotated)draw=`<g transform="translate(${spanH.toFixed(4)} 0) rotate(90)">${geom}</g>`;
  let tiles="";
  for(let r=0;r<plan.rows;r++){
    for(let c=0;c<plan.cols;c++){
      const vx=c*CP_TILE_W,vy=r*CP_TILE_H;
      const label=cpRowLabel(r)+(c+1);
      const isLast=r===plan.rows-1&&c===plan.cols-1;
      let inner=draw;
      inner+=`<rect x="${vx}" y="${vy}" width="${CP_TILE_W}" height="${CP_TILE_H}" fill="none" stroke="${C_BORDER}" stroke-width="0.025"/>`;
      inner+=cpRegistrationMarks(vx,vy,CP_TILE_W,CP_TILE_H);
      const nbLeft=c>0?cpRowLabel(r)+c:null;
      const nbRight=c<plan.cols-1?cpRowLabel(r)+(c+2):null;
      const nbUp=r>0?cpRowLabel(r-1)+(c+1):null;
      const nbDown=r<plan.rows-1?cpRowLabel(r+1)+(c+1):null;
      if(nbLeft)inner+=`<text x="${(vx+0.08).toFixed(3)}" y="${(vy+CP_TILE_H/2).toFixed(3)}" font-size="0.12" font-weight="700" font-family="Nunito,sans-serif" fill="#777">\u2190 ${nbLeft}</text>`;
      if(nbRight)inner+=`<text x="${(vx+CP_TILE_W-0.08).toFixed(3)}" y="${(vy+CP_TILE_H/2).toFixed(3)}" font-size="0.12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="end">${nbRight} \u2192</text>`;
      if(nbUp)inner+=`<text x="${(vx+CP_TILE_W/2).toFixed(3)}" y="${(vy+0.15).toFixed(3)}" font-size="0.12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="middle">\u2191 ${nbUp}</text>`;
      if(nbDown)inner+=`<text x="${(vx+CP_TILE_W/2).toFixed(3)}" y="${(vy+CP_TILE_H-0.08).toFixed(3)}" font-size="0.12" font-weight="700" font-family="Nunito,sans-serif" fill="#777" text-anchor="middle">\u2193 ${nbDown}</text>`;
      tiles+=`<div class="${isLast?"tile last":"tile"}"><div class="tlabel">${title} &mdash; ${label}</div>`+
        `<svg width="${CP_TILE_W}in" height="${CP_TILE_H}in" viewBox="${vx} ${vy} ${CP_TILE_W} ${CP_TILE_H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg></div>`;
    }
  }
  const details=detailRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("");
  const w=window.open("","_blank");
  if(!w){window.alert("The print window was blocked. Allow pop-ups for this site, then try again.");return false;}
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    @page{margin:0.5in}
    body{font-family:Nunito,system-ui,sans-serif;margin:0;color:#222}
    .page{page-break-after:always}.tile{page-break-after:always;text-align:center}.tile.last{page-break-after:auto}
    .tlabel{margin:0;padding:3pt 0 0;font-size:7pt;font-weight:700;text-align:center;line-height:1.2}.tile svg{display:block;margin:0 auto}
    h1{font-size:15pt;margin:0 0 3pt;color:${CP.maroon}}h2{font-size:10pt;margin:0 0 8pt;color:#555}
    table{border-collapse:collapse;width:100%;font-size:10pt}td{border:1px solid #ddd;padding:4pt 7pt}td:first-child{font-weight:700;width:38%}
    .note{font-size:11pt;font-weight:800;color:#000;margin-top:9pt;line-height:1.5}.legend{font-size:7.5pt;color:#444;margin-top:5pt}
  </style></head><body>
    <div class="page"><h1>${title}</h1>
      <h2>MoonShot Bag Calculator \u00B7 ${plan.pages} pattern page${plan.pages===1?"":"s"} \u00B7 ${plan.rows} row(s) \u00D7 ${plan.cols} column(s) \u00B7 7\u2033 \u00D7 9.68\u2033 printable tiles${plan.rotated?" \u00B7 auto-rotated to use fewer pages":""}</h2>
      <p style="font-size:9pt;font-weight:700;color:#555;margin:0 0 2pt">Verify both test squares before cutting fabric:</p>
      ${cpTestSquareSVG()}<table>${details}</table>
      ${legendLine?`<p class="legend">${legendLine}</p>`:""}
      <p class="note">Print at 100% or Actual Size. Turn off Fit to Page, scaling, and browser headers/footers. Verify both test squares. Assemble matching tile edges using the page labels and registration crosses.</p>
    </div>${tiles}
  </body></html>`);
  w.document.close();
  const fire=()=>{const ready=w.document.fonts&&w.document.fonts.ready?w.document.fonts.ready:Promise.resolve();ready.then(()=>setTimeout(()=>w.print(),80));};
  if(w.document.readyState==="complete")fire();else w.addEventListener("load",fire,{once:true});
  return true;
}

/* symbol helpers */
function cpSquareMark(x, y){ const s = 0.055; return `<rect x="${(x-s).toFixed(4)}" y="${(y-s).toFixed(4)}" width="${(2*s).toFixed(4)}" height="${(2*s).toFixed(4)}" fill="none" stroke="${C_BORDER}" stroke-width="0.018" rx="0.01"/>`; }
function cpDiamondMark(x, y){ const d = 0.07; return `<polygon points="${x},${y-d} ${x+d},${y} ${x},${y+d} ${x-d},${y}" fill="none" stroke="${C_SEW}" stroke-width="0.018"/>`; }

/* Inward-pointing skinny triangle at point (px,py) on the cut line. */
function cpTriangleMark(px, py, nx, ny, tang_x, tang_y, scale = 1){
  const base = 0.16 * scale, height = 0.26 * scale;  // 2× — center fold/match marks; arc-blend marks at 50%
  const b1x = px - tang_x * base/2, b1y = py - tang_y * base/2;
  const b2x = px + tang_x * base/2, b2y = py + tang_y * base/2;
  const apx = px + nx * height,     apy = py + ny * height;
  return `<polygon points="${b1x.toFixed(4)},${b1y.toFixed(4)} ${b2x.toFixed(4)},${b2y.toFixed(4)} ${apx.toFixed(4)},${apy.toFixed(4)}" fill="${C_MARK}" stroke="none"/>`;
}

/* Perpendicular tick at point (px,py), direction inward (nx,ny). */
function cpPerpTick(px, py, nx, ny){
  const len = 0.14;
  return `<line x1="${px.toFixed(4)}" y1="${py.toFixed(4)}" x2="${(px + nx*len).toFixed(4)}" y2="${(py + ny*len).toFixed(4)}" stroke="${C_MARK}" stroke-width="0.025"/>`;
}

/* Inward-pointing triangle on a HORIZONTAL strip edge. */
function cpTriangleH(px, py, inward){
  const base = 0.16, ht = 0.22;
  const bL = px - base/2, bR = px + base/2;
  const apex = py + inward * ht;
  return `<polygon points="${bL.toFixed(4)},${py.toFixed(4)} ${bR.toFixed(4)},${py.toFixed(4)} ${px.toFixed(4)},${apex.toFixed(4)}" fill="${C_MARK}" stroke="none"/>`;
}
function cpTriangleV(px, py, inward){
  const base = 0.16, ht = 0.22;
  const bT = py - base/2, bB = py + base/2;
  const apex = px + inward * ht;
  return `<polygon points="${px.toFixed(4)},${bT.toFixed(4)} ${px.toFixed(4)},${bB.toFixed(4)} ${apex.toFixed(4)},${py.toFixed(4)}" fill="${C_MARK}" stroke="none"/>`;
}

/* Z-order in cpDrawStrip: notches → center line → sewline → landmarks → center triangles → cut rect */
function cpDrawStrip(pc){
  const { x0, y0, cutL, w, sa } = pc;
  const runLen = pc.runLen !== undefined ? pc.runLen : (cutL - (pc.flushStart ? sa : 2*sa));
  const sewStart = pc.flushStart ? x0 : x0 + sa;
  const sx = pc.flushStart ? x0 : x0 + sa;
  const ex = pc.flushEnd ? x0 + cutL : x0 + cutL - sa;
  const midX = x0 + cutL/2;
  const midY = y0 + w/2;
  let g = "";

  g += `<rect x="${x0}" y="${y0}" width="${cutL.toFixed(4)}" height="${w.toFixed(4)}" fill="#fbecef" fill-opacity="0.55" stroke="none"/>`;

  if (pc.plan){
    for (const mk of pc.plan.marks){
      const tx = sewStart + mk.s;
      const len = mk.kind === "clip" ? sa * 0.75 : sa * 0.55;
      const wgt = mk.kind === "clip" ? 0.022 : 0.016;
      g += `<line x1="${tx.toFixed(4)}" y1="${y0}" x2="${tx.toFixed(4)}" y2="${(y0+len).toFixed(4)}" stroke="${C_NOTCH}" stroke-width="${wgt}"/>`;
      g += `<line x1="${tx.toFixed(4)}" y1="${(y0+w).toFixed(4)}" x2="${tx.toFixed(4)}" y2="${(y0+w-len).toFixed(4)}" stroke="${C_NOTCH}" stroke-width="${wgt}"/>`;
    }
  }

  g += `<line x1="${midX.toFixed(4)}" y1="${y0}" x2="${midX.toFixed(4)}" y2="${(y0+w).toFixed(4)}" stroke="${C_PIECE_CENTER}" stroke-width="0.016" stroke-dasharray="0.18 0.12"/>`;
  g += `<line x1="${x0}" y1="${midY.toFixed(4)}" x2="${(x0+cutL).toFixed(4)}" y2="${midY.toFixed(4)}" stroke="${C_PIECE_CENTER}" stroke-width="0.016" stroke-dasharray="0.18 0.12"/>`;

  let d = `M ${sx.toFixed(4)} ${(y0+sa).toFixed(4)} H ${ex.toFixed(4)} M ${sx.toFixed(4)} ${(y0+w-sa).toFixed(4)} H ${ex.toFixed(4)}`;
  if (!pc.flushStart) d += ` M ${sx.toFixed(4)} ${(y0+sa).toFixed(4)} V ${(y0+w-sa).toFixed(4)}`;
  if (!pc.flushEnd) d += ` M ${ex.toFixed(4)} ${(y0+sa).toFixed(4)} V ${(y0+w-sa).toFixed(4)}`;
  g += `<path d="${d}" fill="none" stroke="${C_SEW}" stroke-width="0.02" stroke-dasharray="0.15 0.1"/>`;

  if (pc.landmarks){
    for (const L of pc.landmarks){
      const tx = sewStart + L.s;
      if (L.kind === "junction"){ g += cpSquareMark(tx, y0 + sa); g += cpSquareMark(tx, y0 + w - sa); }
      else { g += cpDiamondMark(tx, y0 + sa); g += cpDiamondMark(tx, y0 + w - sa); }
    }
  }

  g += cpTriangleH(midX, y0, +1);
  g += cpTriangleH(midX, y0+w, -1);
  g += cpTriangleV(x0, midY, +1);
  g += cpTriangleV(x0+cutL, midY, -1);

  g += `<rect x="${x0}" y="${y0}" width="${cutL.toFixed(4)}" height="${w.toFixed(4)}" fill="none" stroke="${C_CUT}" stroke-width="0.035"/>`;
  if (pc.flushStart) g += `<text x="${(x0+0.08).toFixed(4)}" y="${(y0+w-0.08).toFixed(4)}" font-size="0.12" font-weight="800" font-family="Nunito,sans-serif" fill="${C_CUT}">RAW TOP</text>`;
  if (pc.flushEnd) g += `<text x="${(x0+cutL-0.08).toFixed(4)}" y="${(y0+w-0.08).toFixed(4)}" font-size="0.12" font-weight="800" font-family="Nunito,sans-serif" fill="${C_CUT}" text-anchor="end">RAW TOP</text>`;
  g += `<text x="${(x0 + 0.12).toFixed(4)}" y="${(y0 + w/2 + 0.07).toFixed(4)}" font-size="0.18" font-family="Nunito, sans-serif" fill="#333">${pc.label}</text>`;
  return g;
}

/* ---- PRINT: MAIN PANEL ---- */
function cpPrintPanel(m,p){
  if(!m.valid)return;
  const PADIN=0.4;
  const originX=m.cutBB.minX-PADIN,originY=m.cutBB.minY-PADIN;
  const spanW=m.cutBB.w+PADIN*2,spanH=m.cutBB.h+PADIN*2;
  const shift=pts=>pts.map(q=>({x:q.x-originX,y:q.y-originY,side:q.side}));
  const active=m.activeSew;
  let geom="";
  geom+=`<path d="${cpPtsToPath(shift(active.pts),active.closed)}" fill="none" stroke="${C_SEW}" stroke-width="0.022" stroke-dasharray="0.15 0.1"/>`;
  const midX=(m.frame[0].x+m.frame[1].x)/2-originX;
  geom+=`<line x1="${midX.toFixed(4)}" y1="${(m.cutBB.minY-originY-0.05).toFixed(4)}" x2="${midX.toFixed(4)}" y2="${(m.cutBB.maxY-originY+0.05).toFixed(4)}" stroke="${C_CENTER}" stroke-width="0.018" stroke-dasharray="0.25 0.15"/>`;
  geom+=`<path d="${cpPtsToPath(shift(m.cutPts),true)}" fill="none" stroke="${C_CUT}" stroke-width="0.04"/>`;
  shift(active.junctions||[]).forEach(j=>geom+=cpSquareMark(j.x,j.y));
  shift(active.midpoints||[]).forEach(mp=>geom+=cpDiamondMark(mp.x,mp.y));
  const mds=cpMarkDetails(m.cutPts,m.marks,originX,originY);
  mds.forEach((md,mi)=>{
    const mark=m.marks[mi],isEdge=!mark||mark.kind!=="blend";
    geom+=cpTriangleMark(md.x,md.y,md.nx,md.ny,md.tx,md.ty,isEdge?1:.5);
    if(isEdge)geom+=cpPerpTick(md.x,md.y,md.nx,md.ny);
  });
  const open=p.topMode==="3side";
  const r=active.runs;
  const detailRows=[
    ["Cut size",cpFmt(m.cutBB.w)+" W \u00D7 "+cpFmt(m.cutBB.h)+" H"],
    [open?"Open sewline size":"Sewline size",cpFmt(active.bb.w)+" W \u00D7 "+cpFmt(active.bb.h)+" H"],
    ["Cut perimeter",cpFmt(m.cutPerim)+"  ("+cpFmtD(m.cutPerim)+")"],
    [open?"Three-sided sewline length":"Sewline perimeter",cpFmt(active.total)+"  ("+cpFmtD(active.total)+")"],
    ["Seam allowance",cpFmt(p.sa)],
    ["Fullness / crown","Left "+cpFmt(m.crowns.hL)+" \u00B7 Right "+cpFmt(m.crowns.hR)+" \u00B7 Top "+cpFmt(m.crowns.hTop)+" \u00B7 Bottom "+cpFmt(m.crowns.hBot)+" \u00B7 feel: "+p.feel],
    ["Corner softness","top "+cpFmt(m.softness.ts)+" \u00B7 bottom "+cpFmt(m.softness.bs)+" (0 = crisp)"],
    ["Construction",open?"3-sided open top":"4-sided enclosed"],
    ["Sewline side runs",open
      ?("Right "+cpFmt(r.right)+" \u00B7 Bottom "+cpFmt(r.bottom)+" \u00B7 Left "+cpFmt(r.left)+" \u00B7 Top open")
      :("Top "+cpFmt(r.top)+" \u00B7 Right "+cpFmt(r.right)+" \u00B7 Bottom "+cpFmt(r.bottom)+" \u00B7 Left "+cpFmt(r.left))]
  ];
  cpPrintDoc("Curved Panel \u2014 Main Panel",geom,spanW,spanH,detailRows,
    "Maroon = cut line \u00B7 grey dashed = sewline \u00B7 cyan dashed = center fold line. \u25B2 = center/fold mark \u00B7 \u25A1 = side junction \u00B7 \u25C7 = side midpoint.");
}

/* ---- PRINT: SIDE PANELS ---- */
function cpPrintSides(m,p){
  if(!m.valid||!m.displaySidePieces?.length)return;
  const PADIN=.4,GAP=.55;
  const pieces=m.displaySidePieces,w=p.sideDepth+2*p.sa;
  let geom="",y=PADIN,maxL=0;
  const detailRows=[["Strip width (all)",cpFmt(w)+" cut \u00B7 "+cpFmt(p.sideDepth)+" finished"],["Seam allowance",cpFmt(p.sa)]];
  for(const pc of pieces){
    geom+=cpDrawStrip({x0:PADIN,y0:y,cutL:pc.cutLength,w,sa:p.sa,flushStart:pc.flushStart,flushEnd:pc.flushEnd,
      runLen:pc.runLength,plan:pc.plan,landmarks:pc.landmarks,label:pc.label});
    detailRows.push([pc.label,"cut "+cpFmt(pc.cutLength)+" \u00D7 "+cpFmt(w)+" \u00B7 sewline run "+cpFmt(pc.runLength)]);
    maxL=Math.max(maxL,pc.cutLength);y+=w+GAP;
  }
  cpPrintDoc("Curved Panel \u2014 Side Panels",geom,maxL+PADIN*2,y-GAP+PADIN,detailRows,
    "Maroon = cut \u00B7 grey dashed = sewline \u00B7 cyan = piece midpoint. Blue marks are suggested clipping/notching positions; stop before the sewline. Open-top left/right pieces have one raw-top end with no lengthwise seam allowance.");
}

/* ---- PRINT: GUSSET ---- */
function cpPrintGusset(m,p){
  const pc=m.gussetPiece;
  if(!m.valid||!pc)return;
  const sa=p.sa,w=pc.cutWidth,cutL=pc.cutLength,run=pc.runLength,PADIN=.4;
  const sy=PADIN+pc.startAllowance,ey=sy+run;
  const midY=PADIN+cutL/2,midX=PADIN+w/2;
  let geom=`<rect x="${PADIN}" y="${PADIN}" width="${w.toFixed(4)}" height="${cutL.toFixed(4)}" fill="#fbecef" fill-opacity="0.55" stroke="none"/>`;
  for(const mk of pc.plan.marks){
    const ty=sy+mk.s,len=mk.kind==="clip"?sa*.75:sa*.55,wgt=mk.kind==="clip"?.022:.016;
    geom+=`<line x1="${PADIN}" y1="${ty.toFixed(4)}" x2="${(PADIN+len).toFixed(4)}" y2="${ty.toFixed(4)}" stroke="${C_NOTCH}" stroke-width="${wgt}"/>`;
    geom+=`<line x1="${(PADIN+w).toFixed(4)}" y1="${ty.toFixed(4)}" x2="${(PADIN+w-len).toFixed(4)}" y2="${ty.toFixed(4)}" stroke="${C_NOTCH}" stroke-width="${wgt}"/>`;
  }
  geom+=`<line x1="${midX.toFixed(4)}" y1="${PADIN}" x2="${midX.toFixed(4)}" y2="${(PADIN+cutL).toFixed(4)}" stroke="${C_PIECE_CENTER}" stroke-width="0.018" stroke-dasharray="0.22 0.14"/>`;
  geom+=`<line x1="${PADIN}" y1="${midY.toFixed(4)}" x2="${(PADIN+w).toFixed(4)}" y2="${midY.toFixed(4)}" stroke="${C_PIECE_CENTER}" stroke-width="0.018" stroke-dasharray="0.22 0.14"/>`;
  let d=`M ${(PADIN+sa).toFixed(4)} ${sy.toFixed(4)} V ${ey.toFixed(4)} M ${(PADIN+w-sa).toFixed(4)} ${sy.toFixed(4)} V ${ey.toFixed(4)}`;
  d+=` M ${(PADIN+sa).toFixed(4)} ${sy.toFixed(4)} H ${(PADIN+w-sa).toFixed(4)} M ${(PADIN+sa).toFixed(4)} ${ey.toFixed(4)} H ${(PADIN+w-sa).toFixed(4)}`;
  geom+=`<path d="${d}" fill="none" stroke="${C_SEW}" stroke-width="0.022" stroke-dasharray="0.15 0.1"/>`;
  for(const L of pc.landmarks){
    const ty=sy+L.s;
    if(L.kind==="junction"){geom+=cpSquareMark(PADIN+sa,ty)+cpSquareMark(PADIN+w-sa,ty);}
    else{geom+=cpDiamondMark(PADIN+sa,ty)+cpDiamondMark(PADIN+w-sa,ty);}
  }
  let acc=0;
  for(const z of pc.zones.slice(0,-1)){
    acc+=z.length;
    const ty=sy+acc;
    geom+=`<line x1="${PADIN}" y1="${ty.toFixed(4)}" x2="${(PADIN+w).toFixed(4)}" y2="${ty.toFixed(4)}" stroke="${C_PIECE_CENTER}" stroke-width="0.012" stroke-dasharray="0.08 0.08" opacity=".75"/>`;
  }
  geom+=cpTriangleH(midX,PADIN,+1)+cpTriangleH(midX,PADIN+cutL,-1);
  geom+=cpTriangleV(PADIN,midY,+1)+cpTriangleV(PADIN+w,midY,-1);
  geom+=`<rect x="${PADIN}" y="${PADIN}" width="${w.toFixed(4)}" height="${cutL.toFixed(4)}" fill="none" stroke="${C_CUT}" stroke-width="0.04"/>`;
  const detailRows=[
    ["Gusset strip","cut "+cpFmt(cutL)+" × "+cpFmt(w)+" · finished width "+cpFmt(pc.finishedWidth)],
    ["Sewline run",cpFmt(run)],
    ["Seam allowance",cpFmt(p.sa)],
    ["Construction",pc.open?"3-sided open top":"4-sided enclosed"]
  ];
  cpPrintDoc("Curved Panel — Gusset",geom,w+PADIN*2,cutL+PADIN*2,detailRows,
    "Maroon = cut · grey dashed = sewline/end allowance guides · pale dashed = horizontal and vertical centerlines. Triangles mark the midpoint of all four cut edges. Blue marks are suggested clipping/notching positions; stop before the sewline.");
}

/* =====================================================================
   ON-SCREEN DIAGRAM + PIECE RENDERERS (ported from prototype render())
   ===================================================================== */

/* Main panel diagram — returns inner SVG markup for a 760×520 viewBox. */
function cpPanelDiagramSVG(model,params){
  const VW=760,VH=490,PAD=28,bb=model.cutBB;
  const scale=Math.min((VW-PAD*2)/bb.w,(VH-PAD*2)/bb.h);
  const ox=(VW-bb.w*scale)/2-bb.minX*scale,oy=(VH-bb.h*scale)/2-bb.minY*scale;
  const X=v=>v*scale+ox,Y=v=>v*scale+oy,map=pts=>pts.map(p=>({x:X(p.x),y:Y(p.y)}));
  const active=model.activeSew;
  let svg="";
  const fr=model.frame,midX=(fr[0].x+fr[1].x)/2;
  svg+=`<line x1="${X(midX).toFixed(1)}" y1="${Y(bb.minY).toFixed(1)}" x2="${X(midX).toFixed(1)}" y2="${Y(bb.maxY).toFixed(1)}" stroke="#00bcd4" stroke-width="1.2" stroke-dasharray="4 6" opacity="0.6"/>`;
  svg+=`<path d="${cpPtsToPath(map(active.pts),active.closed)}" fill="none" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="9 7"/>`;
  const MIN=14;
  function dedup(pts){const kept=[];for(const p of pts){const sx=X(p.x),sy=Y(p.y);if(kept.every(k=>Math.hypot(k.sx-sx,k.sy-sy)>=MIN))kept.push({p,sx,sy});}return kept.map(k=>k.p);}
  const junctions=dedup(active.junctions||[]),midpoints=dedup(active.midpoints||[]);
  for(const j of junctions){const cx=X(j.x),cy=Y(j.y),q=3.8;svg+=`<rect x="${(cx-q).toFixed(1)}" y="${(cy-q).toFixed(1)}" width="${(2*q).toFixed(1)}" height="${(2*q).toFixed(1)}" fill="#fff" stroke="${CP.maroon}" stroke-width="1.8" rx="1"/>`;}
  for(const m of midpoints){const cx=X(m.x),cy=Y(m.y),d=5;svg+=`<polygon points="${cx.toFixed(1)},${(cy-d).toFixed(1)} ${(cx+d).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy+d).toFixed(1)} ${(cx-d).toFixed(1)},${cy.toFixed(1)}" fill="#fff" stroke="#8a8a8a" stroke-width="1.8"/>`;}
  const mds=cpMarkDetails(model.cutPts,model.marks,0,0);
  mds.forEach((md,mi)=>{
    const isEdge=!model.marks[mi]||model.marks[mi].kind!=="blend",px=X(md.x),py=Y(md.y),base=isEdge?7:3.8,ht=isEdge?11:6;
    const b1x=px-md.tx*base/2,b1y=py-md.ty*base/2,b2x=px+md.tx*base/2,b2y=py+md.ty*base/2,ax=px+md.nx*ht,ay=py+md.ny*ht;
    svg+=`<polygon points="${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)} ${ax.toFixed(1)},${ay.toFixed(1)}" fill="${CP.maroon}"/>`;
    if(isEdge)svg+=`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px+md.nx*11).toFixed(1)}" y2="${(py+md.ny*11).toFixed(1)}" stroke="${CP.maroon}" stroke-width="2"/>`;
  });
  svg+=`<path d="${cpPtsToPath(map(model.cutPts),true)}" fill="#fbecef" stroke="${CP.maroon}" stroke-width="3.5" stroke-linejoin="round" fill-opacity="0.5"/>`;
  return svg;
}

/* Mini strip diagram (on-screen). Returns an HTML string. */
function cpMiniStrip(cutL, cutW, label, dims, opts){
  const o=opts||{};
  const VBW=760,PADX=28,PADY=18,MAX_DRAW_H=190;
  const scale=o.fitScale||Math.min((VBW-2*PADX)/Math.max(cutL,1e-9),MAX_DRAW_H/Math.max(cutW,1e-9));
  const displayL=cutL*scale,displayW=cutW*scale;
  const x0=(VBW-displayL)/2,y0=PADY,svgH=displayW+PADY*2;
  const saPx=(o.sa||0)*scale,sx=o.flushStart?x0:x0+saPx,ex=o.flushEnd?x0+displayL:x0+displayL-saPx;
  const midX=x0+displayL/2,midY=y0+displayW/2,STROKE=CP.maroon;
  let s=`<svg viewBox="0 0 ${VBW} ${svgH.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;
  if(o.ghost){const go=7;s+=`<rect x="${(x0+go).toFixed(1)}" y="${(y0-go).toFixed(1)}" width="${displayL.toFixed(1)}" height="${displayW.toFixed(1)}" fill="#fdf0f2" stroke="${CP.pinkLine}" stroke-width="1.5"/>`;}
  s+=`<rect x="${x0.toFixed(1)}" y="${y0}" width="${displayL.toFixed(1)}" height="${displayW.toFixed(1)}" fill="#fbecef" fill-opacity=".72" stroke="none"/>`;
  if(o.plan&&o.plan.marks.length){for(const mk of o.plan.marks){const tx=x0+(o.flushStart?0:saPx)+mk.s*scale,tl=mk.kind==="clip"?saPx*.8:saPx*.6,wg=mk.kind==="clip"?1.3:.9;s+=`<line x1="${tx.toFixed(1)}" y1="${y0}" x2="${tx.toFixed(1)}" y2="${(y0+tl).toFixed(1)}" stroke="#1565c0" stroke-width="${wg}" opacity=".7"/>`;s+=`<line x1="${tx.toFixed(1)}" y1="${(y0+displayW).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(y0+displayW-tl).toFixed(1)}" stroke="#1565c0" stroke-width="${wg}" opacity=".7"/>`;}}
  s+=`<line x1="${midX.toFixed(1)}" y1="${y0}" x2="${midX.toFixed(1)}" y2="${(y0+displayW).toFixed(1)}" stroke="${C_PIECE_CENTER}" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  s+=`<line x1="${x0.toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(x0+displayL).toFixed(1)}" y2="${midY.toFixed(1)}" stroke="${C_PIECE_CENTER}" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  if(saPx>0&&displayW>2*saPx){let d=`M ${sx.toFixed(1)} ${(y0+saPx).toFixed(1)} H ${ex.toFixed(1)} M ${sx.toFixed(1)} ${(y0+displayW-saPx).toFixed(1)} H ${ex.toFixed(1)}`;if(!o.flushStart)d+=` M ${sx.toFixed(1)} ${(y0+saPx).toFixed(1)} V ${(y0+displayW-saPx).toFixed(1)}`;if(!o.flushEnd)d+=` M ${ex.toFixed(1)} ${(y0+saPx).toFixed(1)} V ${(y0+displayW-saPx).toFixed(1)}`;s+=`<path d="${d}" fill="none" stroke="#8f8f8f" stroke-width="1.4" stroke-dasharray="7 5"/>`;}
  const tb=8,th=11;
  s+=`<polygon points="${(midX-tb/2).toFixed(1)},${y0} ${(midX+tb/2).toFixed(1)},${y0} ${midX.toFixed(1)},${(y0+th).toFixed(1)}" fill="${STROKE}"/>`;
  s+=`<polygon points="${(midX-tb/2).toFixed(1)},${(y0+displayW).toFixed(1)} ${(midX+tb/2).toFixed(1)},${(y0+displayW).toFixed(1)} ${midX.toFixed(1)},${(y0+displayW-th).toFixed(1)}" fill="${STROKE}"/>`;
  s+=`<polygon points="${x0.toFixed(1)},${(midY-tb/2).toFixed(1)} ${x0.toFixed(1)},${(midY+tb/2).toFixed(1)} ${(x0+th).toFixed(1)},${midY.toFixed(1)}" fill="${STROKE}"/>`;
  s+=`<polygon points="${(x0+displayL).toFixed(1)},${(midY-tb/2).toFixed(1)} ${(x0+displayL).toFixed(1)},${(midY+tb/2).toFixed(1)} ${(x0+displayL-th).toFixed(1)},${midY.toFixed(1)}" fill="${STROKE}"/>`;
  s+=`<rect x="${x0.toFixed(1)}" y="${y0}" width="${displayL.toFixed(1)}" height="${displayW.toFixed(1)}" fill="none" stroke="${STROKE}" stroke-width="2.2"/>`;
  if(o.topLabel){const tx=o.flushStart?x0+13:x0+displayL-13;s+=`<text x="${tx.toFixed(1)}" y="${midY.toFixed(1)}" font-size="12" font-weight="800" font-family="Nunito,sans-serif" fill="${STROKE}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,${tx.toFixed(1)},${midY.toFixed(1)})">TOP</text>`;}
  s+=`</svg>`;
  return `<div class="cp-mini">${s}<div class="mlabel">${label}</div><div class="mdims">${dims}</div></div>`;
}

/* Piece-table builders */
function cpProw(label, cutVal, sewVal){
  return `<div class="cp-prow"><div class="pl">${label}</div><div class="pc">${cutVal}</div><div class="ps">Sewline: ${sewVal}</div></div>`;
}
function cpPieceBlock(pill, rows, note){
  return `<span class="cp-pill">${pill}</span>` + rows.join("") + (note ? `<p class="cp-pnote">${note}</p>` : "");
}
function cpStripRows(cutL, sewL, cutW, sewW){
  return [
    cpProw("Length — cut", cpFmt(cutL), cpFmt(sewL)),
    cpProw("Width — cut", cpFmt(cutW), cpFmt(sewW)),
    cpProw("Cut perimeter", cpFmt(2*(cutL+cutW)), cpFmt(2*(sewL+sewW)))
  ];
}

/* Sides minis + tables */
function cpSidesHTML(m,p){
  const pieces=m.displaySidePieces||[];
  if(!pieces.length)return {minis:"",tables:""};
  const maxL=Math.max(...pieces.map(x=>x.cutLength)),maxW=Math.max(...pieces.map(x=>x.cutWidth));
  const fitScale=Math.min((760-56)/Math.max(maxL,1e-9),190/Math.max(maxW,1e-9));
  let minis="",tables="";
  for(const pc of pieces){
    minis+=cpMiniStrip(pc.cutLength,pc.cutWidth,pc.label,cpFmt(pc.cutLength)+" L × "+cpFmt(pc.cutWidth)+" D",{ghost:pc.quantity===2,sa:p.sa,plan:pc.plan,flushStart:pc.flushStart,flushEnd:pc.flushEnd,runLen:pc.runLength,topLabel:pc.flushStart||pc.flushEnd,fitScale});
    const note=pc.flushStart||pc.flushEnd?"Raw-top end is flush; the opposite end includes the joining seam allowance.":(pc.quantity===2?"Verified mirrored pair; one template can be used for both sides.":"");
    tables+=cpPieceBlock(pc.label,[cpProw("Length — cut",cpFmt(pc.cutLength),cpFmt(pc.runLength)),cpProw("Width — cut",cpFmt(pc.cutWidth),cpFmt(pc.finishedWidth))],note);
  }
  return {minis:`<div class="cp-miniWrap">${minis}</div>`,tables};
}

function cpGussetMapHTML(pc){
  if(!pc)return "";
  const VW=760,PADX=28,PADY=34,MAX_DRAW_H=210;
  const scale=Math.min((VW-2*PADX)/Math.max(pc.cutLength,1e-9),MAX_DRAW_H/Math.max(pc.cutWidth,1e-9));
  const drawL=pc.cutLength*scale,drawW=pc.cutWidth*scale,x0=(VW-drawL)/2,y0=PADY,H=drawW+PADY+56;
  const saPx=(pc.cutWidth-pc.finishedWidth)/2*scale,sewStart=x0+pc.startAllowance*scale,sewEnd=sewStart+pc.runLength*scale,midX=x0+drawL/2,midY=y0+drawW/2;
  let s=`<svg class="cp-zoneMap" viewBox="0 0 ${VW} ${H.toFixed(1)}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<rect x="${x0.toFixed(1)}" y="${y0}" width="${drawL.toFixed(1)}" height="${drawW.toFixed(1)}" rx="4" fill="#fbecef" fill-opacity=".75" stroke="none"/>`;
  s+=`<line x1="${midX.toFixed(1)}" y1="${y0}" x2="${midX.toFixed(1)}" y2="${(y0+drawW).toFixed(1)}" stroke="${C_PIECE_CENTER}" stroke-width="1.2" stroke-dasharray="5 5"/><line x1="${x0.toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(x0+drawL).toFixed(1)}" y2="${midY.toFixed(1)}" stroke="${C_PIECE_CENTER}" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  if(saPx>0&&drawW>2*saPx){const yTop=y0+saPx,yBot=y0+drawW-saPx,d=`M ${sewStart.toFixed(1)} ${yTop.toFixed(1)} H ${sewEnd.toFixed(1)} M ${sewStart.toFixed(1)} ${yBot.toFixed(1)} H ${sewEnd.toFixed(1)} M ${sewStart.toFixed(1)} ${yTop.toFixed(1)} V ${yBot.toFixed(1)} M ${sewEnd.toFixed(1)} ${yTop.toFixed(1)} V ${yBot.toFixed(1)}`;s+=`<path d="${d}" fill="none" stroke="#8f8f8f" stroke-width="1.5" stroke-dasharray="7 5"/>`;}
  let acc=0;for(let i=0;i<pc.zones.length;i++){const z=pc.zones[i],x1=sewStart+acc*scale,x2=x1+z.length*scale;if(i>0)s+=`<line x1="${x1.toFixed(1)}" y1="${y0}" x2="${x1.toFixed(1)}" y2="${(y0+drawW).toFixed(1)}" stroke="${CP.maroon}" stroke-width="1.4" opacity=".65"/>`;if(x2-x1>54)s+=`<text x="${((x1+x2)/2).toFixed(1)}" y="${(midY+5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" font-family="Nunito,sans-serif" fill="${CP.maroon}">${z.side.toUpperCase()}</text>`;acc+=z.length;}
  const tb=8,th=11;
  s+=`<polygon points="${(midX-tb/2).toFixed(1)},${y0} ${(midX+tb/2).toFixed(1)},${y0} ${midX.toFixed(1)},${(y0+th).toFixed(1)}" fill="${CP.maroon}"/><polygon points="${(midX-tb/2).toFixed(1)},${(y0+drawW).toFixed(1)} ${(midX+tb/2).toFixed(1)},${(y0+drawW).toFixed(1)} ${midX.toFixed(1)},${(y0+drawW-th).toFixed(1)}" fill="${CP.maroon}"/><polygon points="${x0.toFixed(1)},${(midY-tb/2).toFixed(1)} ${x0.toFixed(1)},${(midY+tb/2).toFixed(1)} ${(x0+th).toFixed(1)},${midY.toFixed(1)}" fill="${CP.maroon}"/><polygon points="${(x0+drawL).toFixed(1)},${(midY-tb/2).toFixed(1)} ${(x0+drawL).toFixed(1)},${(midY+tb/2).toFixed(1)} ${(x0+drawL-th).toFixed(1)},${midY.toFixed(1)}" fill="${CP.maroon}"/>`;
  s+=`<rect x="${x0.toFixed(1)}" y="${y0}" width="${drawL.toFixed(1)}" height="${drawW.toFixed(1)}" rx="4" fill="none" stroke="${CP.maroon}" stroke-width="2.2"/>`;
  s+=`<text x="${x0.toFixed(1)}" y="${(y0-10).toFixed(1)}" font-size="12.5" font-weight="800" font-family="Nunito,sans-serif" fill="${CP.muted}">END SA ${cpFmt(pc.startAllowance)}</text><text x="${(x0+drawL).toFixed(1)}" y="${(y0-10).toFixed(1)}" text-anchor="end" font-size="12.5" font-weight="800" font-family="Nunito,sans-serif" fill="${CP.muted}">END SA ${cpFmt(pc.endAllowance)}</text></svg>`;
  return s;
}

/* Gusset mini + table */
function cpGussetHTML(m,p){
  const pc=m.gussetPiece;
  if(!pc)return {minis:"",tables:""};
  const minis=`<div class="cp-miniWrap">${cpGussetMapHTML(pc)}<div class="cp-mini"><div class="mlabel">${pc.label}</div><div class="mdims">${cpFmt(pc.cutLength)} L \u00D7 ${cpFmt(pc.cutWidth)} W</div></div></div>`;
  let rows=[
    cpProw("Length — cut",cpFmt(pc.cutLength),cpFmt(pc.runLength)),
    cpProw("Width — cut",cpFmt(pc.cutWidth),cpFmt(pc.finishedWidth))
  ];
  const tables=cpPieceBlock(pc.label,rows,"");
  return {minis,tables};
}

/* Stat card HTML */
function cpStat(k, v, d){
  return `<div class="cp-stat"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
}

/* ── Small React helpers for this page ──────────────────────────────── */
function CpSeg({ options, value, set }){
  return (
    <div className="cp-seg">
      {options.map(o => (
        <button key={o.id} className={value===o.id ? "on" : ""} onClick={()=>set(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function cpSidePrintSpan(m,p){
  const pcs=m.displaySidePieces||[];
  if(!pcs.length)return null;
  const gap=.55,pad=.4;
  return {w:Math.max(...pcs.map(x=>x.cutLength))+pad*2,h:pcs.reduce((a,x)=>a+x.cutWidth,0)+gap*(pcs.length-1)+pad*2};
}
function cpGussetPrintSpan(m){
  const pc=m.gussetPiece;
  return pc?{w:pc.cutWidth+.8,h:pc.cutLength+.8}:null;
}
function CpResultBand({model,params}){
  const active=model.activeSew,open=params.topMode==="3side";
  const cutRunText=`Top ${cpFmt(model.cutRuns.top)} · Right ${cpFmt(model.cutRuns.right)} · Bottom ${cpFmt(model.cutRuns.bottom)} · Left ${cpFmt(model.cutRuns.left)}`;
  const sewnRunText=open?`Right ${cpFmt(active.runs.right)} · Bottom ${cpFmt(active.runs.bottom)} · Left ${cpFmt(active.runs.left)} · Top raw/open`:`Top ${cpFmt(active.runs.top)} · Right ${cpFmt(active.runs.right)} · Bottom ${cpFmt(active.runs.bottom)} · Left ${cpFmt(active.runs.left)}`;
  return <div className="cp-resultBand">
    <div className="cp-resultLine"><div className="cp-resultCell"><div className="rk">Panel Size</div><div className="rv">{cpFmt(model.cutBB.w)} W × {cpFmt(model.cutBB.h)} H</div></div><div className="cp-resultCell right"><div className="rk">Sewline</div><div className="rv">{cpFmt(active.bb.w)} W × {cpFmt(active.bb.h)} H</div></div></div>
    <div className="cp-resultLine"><div className="cp-resultCell"><div className="rk">Cut Perimeter</div><div className="rv">{cpFmt(model.cutPerim)}</div></div><div className="cp-resultCell right"><div className="rk">{open?"Sewline Length":"Sewline Perimeter"}</div><div className="rv">{cpFmt(active.total)}</div></div></div>
    <div className="cp-resultLine"><div className="cp-resultCell"><div className="rk">Side Lengths</div><div className="rv runs">{cutRunText}</div></div><div className="cp-resultCell right"><div className="rk">Sewn Side Lengths</div><div className="rv runs">{sewnRunText}</div></div></div>
  </div>;
}

// ── CURVED PANEL PAGE — validated geometry + compact diagram-led layout ──────
export default function CurvedPanelPage() {
  const th=T.advanced;
  const [tWW,setTWW]=useState(0),[tWF,setTWF]=useState(0);
  const [bWW,setBWW]=useState(0),[bWF,setBWF]=useState(0);
  const [hWW,setHWW]=useState(0),[hWF,setHWF]=useState(0);
  const [saW,setSaW]=useState(0),[saF,setSaF]=useState(DEFAULT_SA);
  const [lfW,setLfW]=useState(0),[lfF,setLfF]=useState(0);
  const [rfW,setRfW]=useState(0),[rfF,setRfF]=useState(0);
  const [tcW,setTcW]=useState(0),[tcF,setTcF]=useState(0);
  const [bcW,setBcW]=useState(0),[bcF,setBcF]=useState(0);
  const [matchingSides,setMatchingSides]=useState(true);
  const [feel,setFeel]=useState("gentle");
  const [tsW,setTsW]=useState(0),[tsF,setTsF]=useState(0);
  const [bsW,setBsW]=useState(0),[bsF,setBsF]=useState(0);
  const [sgView,setSgView]=useState("sides");
  const [topMode,setTopMode]=useState("4side");
  const [sdW,setSdW]=useState(0),[sdF,setSdF]=useState(0);
  const [gwW,setGwW]=useState(0),[gwF,setGwF]=useState(0);
  const [decMode,setDecMode]=useState(false);
  const diagramRef=useRef(null);
  const floatDockRef=useRef(null);
  const dragRef=useRef(null);
  const resizeRef=useRef(null);
  const [draggingFloat,setDraggingFloat]=useState(false);
  const [resizingFloat,setResizingFloat]=useState(false);
  const [floatDiagOpen,setFloatDiagOpen]=useState(true);
  const [floatPos,setFloatPos]=useState(()=>{
    if (typeof window === "undefined") return {x:18,y:86};
    try {
      const saved=JSON.parse(window.sessionStorage.getItem("cpFloatDiagramPosition")||"null");
      if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)) return saved;
    } catch {}
    return {x:Math.max(18,window.innerWidth-358),y:86};
  });
  const [floatSize,setFloatSize]=useState(()=>{
    if (typeof window === "undefined") return {w:340,h:355};
    try {
      const saved=JSON.parse(window.sessionStorage.getItem("cpFloatDiagramSize")||"null");
      if(saved&&Number.isFinite(saved.w)&&Number.isFinite(saved.h)) return saved;
    } catch {}
    return {w:340,h:355};
  });
  const [dockSide,setDockSide]=useState(()=>{
    if (typeof window === "undefined") return "right";
    try { const v=window.sessionStorage.getItem("cpFloatDiagramDock"); return v==="left"||v==="right"?v:"right"; } catch { return "right"; }
  });
  const [dockCollapsed,setDockCollapsed]=useState(true);
  const [canFloatDiag,setCanFloatDiag]=useState(()=>typeof window !== "undefined" ? window.innerWidth >= 900 : false);

  const lf=Math.max(0,lfW+lfF),rf=matchingSides?lf:Math.max(0,rfW+rfF);
  const params={
    topW:Math.max(1,tWW+tWF),botW:Math.max(1,bWW+bWF),height:Math.max(1,hWW+hWF),
    sa:Math.max(0,saW+saF),topCrown:Math.max(0,tcW+tcF),botCrown:Math.max(0,bcW+bcF),
    leftFull:lf,rightFull:rf,matchingSides,feel,topMode,
    topSoft:Math.max(0,tsW+tsF),botSoft:Math.max(0,bsW+bsF),
    sideDepth:Math.max(0,sdW+sdF),gussetW:Math.max(0,gwW+gwF)
  };
  const ready=(tWW+tWF)>0&&(bWW+bWF)>0&&(hWW+hWF)>0;
  const model=buildCurvedPanelModel(params);
  const sides=cpSidesHTML(model,params),gusset=cpGussetHTML(model,params);
  const hasDepth=params.sideDepth>0,hasGusset=params.gussetW>0;
  const panelPlan=cpTilePlan(model.cutBB.w+.8,model.cutBB.h+.8);
  const sideSpan=cpSidePrintSpan(model,params),sidePlan=sideSpan?cpTilePlan(sideSpan.w,sideSpan.h):null;
  const gusSpan=cpGussetPrintSpan(model),gusPlan=gusSpan?cpTilePlan(gusSpan.w,gusSpan.h):null;

  function clampFloatSize(size){
    if (typeof window === "undefined") return size;
    return {
      w:Math.max(280,Math.min(size.w,Math.min(620,window.innerWidth-20))),
      h:Math.max(250,Math.min(size.h,Math.min(720,window.innerHeight-20)))
    };
  }

  function clampFloatPosition(pos,size=floatSize){
    if (typeof window === "undefined") return pos;
    const safe=clampFloatSize(size),pad=10;
    return {
      x:Math.max(pad,Math.min(pos.x,window.innerWidth-safe.w-pad)),
      y:Math.max(pad,Math.min(pos.y,window.innerHeight-safe.h-pad))
    };
  }

  function resetFloatPosition(){
    if (typeof window === "undefined") return;
    const size=clampFloatSize({w:340,h:355});
    setFloatSize(size);
    setDockSide(null);
    setDockCollapsed(false);
    setFloatDiagOpen(true);
    setFloatPos(clampFloatPosition({x:window.innerWidth-size.w-18,y:86},size));
  }

  function closeFloatFeed(){
    const side=dockSide||"right";
    setDockSide(side);
    setDockCollapsed(true);
    setFloatDiagOpen(true);
  }

  function dockFloat(side){
    setDockSide(side);
    setDockCollapsed(true);
    setFloatDiagOpen(true);
  }

  function undockFloat(){
    if (typeof window === "undefined") return;
    setFloatDiagOpen(true);
    const rect=floatDockRef.current?.getBoundingClientRect();
    const size=clampFloatSize({w:rect?.width||floatSize.w,h:rect?.height||floatSize.h});
    setFloatSize(size);
    setDockSide(null);
    setDockCollapsed(false);
    setFloatPos(clampFloatPosition({x:Math.max(12,(window.innerWidth-size.w)/2),y:Math.max(74,rect?.top||86)},size));
  }


  function startFloatDrag(e){
    if(e.button!==undefined&&e.button!==0)return;
    if(e.target.closest("button"))return;
    if(dockSide)return;
    const rect=floatDockRef.current?.getBoundingClientRect();
    if(!rect)return;
    dragRef.current={dx:e.clientX-rect.left,dy:e.clientY-rect.top,lastX:e.clientX,lastY:e.clientY};
    setDraggingFloat(true);
    e.preventDefault();
  }

  function startFloatResize(e){
    if(e.button!==undefined&&e.button!==0)return;
    const rect=floatDockRef.current?.getBoundingClientRect();
    if(!rect)return;
    resizeRef.current={startX:e.clientX,startY:e.clientY,w:rect.width,h:rect.height,side:dockSide};
    setResizingFloat(true);
    e.preventDefault();
    e.stopPropagation();
  }


  useEffect(()=>{
    const onResize=()=>{
      setCanFloatDiag(window.innerWidth >= 900);
      setFloatSize(size=>clampFloatSize(size));
      if(!dockSide)setFloatPos(pos=>clampFloatPosition(pos));
    };
    onResize();
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[dockSide]);

  useEffect(()=>{ try { window.sessionStorage.setItem("cpFloatDiagramOpen", floatDiagOpen ? "1" : "0"); } catch {} },[floatDiagOpen]);
  useEffect(()=>{ try { window.sessionStorage.setItem("cpFloatDiagramPosition",JSON.stringify(floatPos)); } catch {} },[floatPos]);
  useEffect(()=>{ try { window.sessionStorage.setItem("cpFloatDiagramSize",JSON.stringify(floatSize)); } catch {} },[floatSize]);
  useEffect(()=>{ try { if(dockSide)window.sessionStorage.setItem("cpFloatDiagramDock",dockSide); else window.sessionStorage.removeItem("cpFloatDiagramDock"); } catch {} },[dockSide]);
  useEffect(()=>{ try { window.sessionStorage.setItem("cpFloatDiagramCollapsed",dockCollapsed ? "1" : "0"); } catch {} },[dockCollapsed]);

  useEffect(()=>{
    if(!draggingFloat)return;
    const move=e=>{
      const d=dragRef.current;
      if(!d)return;
      d.lastX=e.clientX; d.lastY=e.clientY;
      setFloatPos(clampFloatPosition({x:e.clientX-d.dx,y:e.clientY-d.dy}));
    };
    const stop=()=>{
      const d=dragRef.current;
      if(d&&d.lastX<=34)dockFloat("left");
      else if(d&&d.lastX>=window.innerWidth-34)dockFloat("right");
      dragRef.current=null;setDraggingFloat(false);
    };
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",stop,{once:true});
    window.addEventListener("pointercancel",stop,{once:true});
    return ()=>{
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",stop);
      window.removeEventListener("pointercancel",stop);
    };
  },[draggingFloat,floatSize]);

  useEffect(()=>{
    if(!resizingFloat)return;
    const move=e=>{
      const r=resizeRef.current;
      if(!r)return;
      const dx=r.side==="right"?r.startX-e.clientX:e.clientX-r.startX;
      const next=clampFloatSize({w:r.w+dx,h:r.h+(e.clientY-r.startY)});
      setFloatSize(next);
      if(!r.side)setFloatPos(pos=>clampFloatPosition(pos,next));
    };
    const stop=()=>{resizeRef.current=null;setResizingFloat(false);};
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",stop,{once:true});
    window.addEventListener("pointercancel",stop,{once:true});
    return ()=>{
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",stop);
      window.removeEventListener("pointercancel",stop);
    };
  },[resizingFloat,dockSide]);

  return (
    <div className="cp-wrap" style={{minHeight:"100vh",padding:"16px 16px 48px"}}>
      <div style={{background:th.sec,borderRadius:14,boxShadow:"0 4px 18px rgba(122,26,46,0.10)"}}>
        <SecHeader th={th} title="Curved Panel"
          sub="Build a free-form bag panel with sharp or rounded corners and sides that can be straight or gently curved. Create matching rectangular side panels for an open-top or fully enclosed bag, or generate one continuous gusset for either construction style. When your design is complete, print the full-size pattern."/>
        <div style={{padding:"12px 12px 18px"}}>
          <div className="cp-topbar">
            <div className="cp-hint" style={{margin:0}}>The live diagram and matching pattern pieces update as you shape the panel.</div>
            {!isMetric()&&<label className="cp-decToggle"><input type="checkbox" checked={decMode} onChange={e=>setDecMode(e.target.checked)}/>Decimal input</label>}
          </div>

          <div className="cp-controlGrid">
            <div className="cp-card cp-frameCard">
              <div className="cp-controlSection">
                <h2>Starting Frame</h2>
                <div className="cp-row">
                  <FracInput variant="cp" label="Top width" decMode={decMode} whole={tWW} frac={tWF} onWhole={setTWW} onFrac={setTWF}/>
                  <FracInput variant="cp" label="Bottom width" decMode={decMode} whole={bWW} frac={bWF} onWhole={setBWW} onFrac={setBWF}/>
                  <FracInput variant="cp" label="Panel height" decMode={decMode} whole={hWW} frac={hWF} onWhole={setHWW} onFrac={setHWF}/>
                  <FracInput variant="cp" label="Seam allowance" decMode={decMode} whole={saW} frac={saF} onWhole={setSaW} onFrac={setSaF}/>
                </div>
                <p className="cp-hint">These are design-intent dimensions. Actual cut and sewline sizes appear below the diagram.</p>
              </div>

              <div className="cp-controlSection">
                <h2>Edge Shape</h2>
                <div className="cp-edgeFields">
                  <FracInput variant="cp" label={matchingSides?"Left & right fullness":"Left fullness"} decMode={decMode} whole={lfW} frac={lfF} onWhole={setLfW} onFrac={setLfF}/>
                  <FracInput variant="cp" label="Right fullness" decMode={decMode} ghost={matchingSides} whole={rfW} frac={rfF} onWhole={setRfW} onFrac={setRfF}/>
                  <FracInput variant="cp" label="Top crown" decMode={decMode} whole={tcW} frac={tcF} onWhole={setTcW} onFrac={setTcF}/>
                  <FracInput variant="cp" label="Bottom crown" decMode={decMode} whole={bcW} frac={bcF} onWhole={setBcW} onFrac={setBcF}/>
                </div>
                <label className="cp-check"><input type="checkbox" checked={matchingSides} onChange={e=>setMatchingSides(e.target.checked)}/>Matching Sides</label>
                <div style={{fontSize:12.5,fontWeight:800,margin:"5px 0 3px"}}>Curve feel</div>
                <CpSeg value={feel} set={setFeel} options={[{id:"gentle",label:"Gentle"},{id:"balanced",label:"Balanced"},{id:"defined",label:"Defined"}]}/>
                <p className="cp-hint">Fullness and crown set midpoint depth. Curve feel changes only how broadly each edge eases.</p>
              </div>

              <div className="cp-lowerControls">
                <div className="cp-controlSection">
                  <h2>Corners</h2>
                  <div className="cp-row">
                    <FracInput variant="cp" label="Top softness" decMode={decMode} whole={tsW} frac={tsF} onWhole={setTsW} onFrac={setTsF}/>
                    <FracInput variant="cp" label="Bottom softness" decMode={decMode} whole={bsW} frac={bsF} onWhole={setBsW} onFrac={setBsF}/>
                  </div>
                  <p className="cp-hint">0 keeps the join crisp. Higher values soften only the corner transition.</p>
                </div>

                <div className="cp-controlSection">
                  <h2>Construction</h2>
                  <CpSeg value={topMode} set={setTopMode} options={[{id:"4side",label:"4-Sided Enclosed"},{id:"3side",label:"3-Sided Open Top"}]}/>
                  <p className="cp-hint">Open top follows Right → Bottom → Left and carries each side seam to the raw top edge.</p>
                </div>
              </div>
            </div>
          </div>

          {!ready&&<div className="cp-card" style={{textAlign:"center",padding:"28px 16px"}}>
            <div style={{fontSize:15,fontWeight:800,color:CP.rose}}>Enter top width, bottom width, and panel height to begin.</div>
          </div>}

          {ready&&<>
            {model.notes.length>0&&<div className="cp-warn">Automatic geometry adjustments:<ul>{model.notes.map((n,i)=><li key={i}>{n}</li>)}</ul></div>}
            <TrustBadge tone="cp" valid={model.valid}
              okMessage="✓ Geometry verified: cut path and active sewline are non-crossing, correctly oriented, and contained."
              lockLabel="Pattern output locked" errors={model.errors}/>

            <div className="cp-card cp-diagramCard" ref={diagramRef}>
              <svg viewBox="0 0 760 490" style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label="Live curved panel diagram"
                dangerouslySetInnerHTML={{__html:cpPanelDiagramSVG(model,params)}}/>
              <p className="cp-diagLegend">▲ Center marks &nbsp; □ Side junctions &nbsp; ◇ Side midpoints &nbsp; Solid = cut &nbsp; Dashed = sewline</p>
              <p className={"cp-symline "+(model.symmetry?"yes":"no")}>Fold-friendly symmetry: {model.symmetry?"yes":"no"}</p>
            </div>

            <CpResultBand model={model} params={params}/>

            {canFloatDiag && floatDiagOpen && dockSide && dockCollapsed && <button
              className={"cp-dockTab "+dockSide}
              style={{top:Math.max(86,Math.min(floatPos.y,typeof window!=="undefined"?window.innerHeight-210:120))}}
              onClick={undockFloat} aria-label="Undock and open MoonShot Mission Control">
              <span className="cp-liveDot" style={{background:!model.valid?"#c23b47":model.notes.length?"#d89b24":"#2f9a62"}}/>
              Live Pattern Feed
            </button>}

            {canFloatDiag && floatDiagOpen && !(dockSide&&dockCollapsed) && <div
              ref={floatDockRef}
              className={"cp-floatDock"+(draggingFloat?" dragging":"")+(resizingFloat?" resizing":"")+(dockSide?" docked-"+dockSide:"")}
              style={dockSide?{
                [dockSide]:0,
                top:Math.max(72,Math.min(floatPos.y,typeof window!=="undefined"?window.innerHeight-Math.min(floatSize.h,window.innerHeight-82)-10:86)),
                width:floatSize.w,height:typeof window!=="undefined"?Math.min(floatSize.h,window.innerHeight-82):floatSize.h
              }:{left:floatPos.x,top:floatPos.y,width:floatSize.w,height:floatSize.h}}>
              <div className="cp-floatHead" onPointerDown={startFloatDrag}>
                <div className="cp-missionBrand">
                  <span className="cp-liveDot" style={{background:!model.valid?"#c23b47":model.notes.length?"#d89b24":"#2f9a62"}}/>
                  <div className="cp-missionText">
                    <div className="cp-missionTitle">MoonShot Mission Control</div>
                    <div className="cp-missionFeed">Live Pattern Feed</div>
                  </div>
                </div>
                <button className="cp-floatClose" onPointerDown={e=>e.stopPropagation()} onClick={closeFloatFeed} aria-label="Close live pattern feed" title="Close">×</button>
              </div>
              <div className="cp-floatNav">
                <button onClick={()=>dockFloat("left")} aria-label="Dock and collapse live pattern feed left">← Dock Left</button>
                <button onClick={resetFloatPosition} aria-label="Recenter live pattern feed">ReCenter</button>
                <button onClick={()=>dockFloat("right")} aria-label="Dock and collapse live pattern feed right">Dock Right →</button>
              </div>
              <div className="cp-floatBody">
                <svg viewBox="0 0 760 490" style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label="MoonShot Mission Control live pattern feed"
                  dangerouslySetInnerHTML={{__html:cpPanelDiagramSVG(model,params)}}/>
                <div className="cp-floatMeta">{cpFmt(model.cutBB.w)} W × {cpFmt(model.cutBB.h)} H cut · {cpFmt(params.sa)} seam allowance · {params.topMode==="3side"?"3-sided open top":"4-sided enclosed"}</div>
              </div>
              <div className={"cp-resizeHandle "+(dockSide==="right"?"left":"right")} onPointerDown={startFloatResize} aria-hidden="true"/>
            </div>}

            <div className="cp-card" style={{marginTop:8}}>
              <h2>Matching Pieces</h2>
              <div style={{marginBottom:7}}><CpSeg value={sgView} set={setSgView} options={[{id:"sides",label:"Side Panels"},{id:"gusset",label:"Gusset"}]}/></div>
              {sgView==="sides"?<>
                <div className="cp-row"><FracInput variant="cp" label="Finished side depth" decMode={decMode} whole={sdW} frac={sdF} onWhole={setSdW} onFrac={setSdF}/></div>
                <p className="cp-hint">Assumes a constant finished depth and two matching main panels.</p>
                {hasDepth&&model.valid?<>
                  <div dangerouslySetInnerHTML={{__html:sides.minis}}/><div dangerouslySetInnerHTML={{__html:sides.tables}}/>
                </>:<p className="cp-hint">{model.valid?"Enter a finished side depth to generate the pieces.":"Correct the geometry above before side pieces are generated."}</p>}
              </>:<>
                <div className="cp-row"><FracInput variant="cp" label="Finished gusset width" decMode={decMode} whole={gwW} frac={gwF} onWhole={setGwW} onFrac={setGwF}/></div>
                {hasGusset&&model.valid?<>
                  <div dangerouslySetInnerHTML={{__html:gusset.minis}}/><div dangerouslySetInnerHTML={{__html:gusset.tables}}/>
                </>:<p className="cp-hint">{model.valid?"Enter a finished gusset width to generate the strip.":"Correct the geometry above before the gusset is generated."}</p>}
              </>}
            </div>

            <div className="cp-card">
              <h2>Print Patterns</h2>
              <div className="cp-printGrid">
                <div className="cp-printCard">
                  <div className="pt">Main Panel</div><div className="pm">Actual cut path, active sewline, match marks, dimensions, and test squares.</div>
                  <PrintButton tone="cp" small label="Print Main Panel" meta={cpTileLabel(panelPlan)} disabled={!model.valid} onClick={()=>cpPrintPanel(model,params)}/>
                </div>
                <div className="cp-printCard">
                  <div className="pt">Side Panels</div><div className="pm">Exact matching strips with raw-top orientation and suggested clip/notch marks.</div>
                  <PrintButton tone="cp" small label="Print Side Panels" meta={sidePlan?cpTileLabel(sidePlan):"Add finished side depth"} disabled={!model.valid||!hasDepth||!sidePlan} onClick={()=>cpPrintSides(model,params)}/>
                </div>
                <div className="cp-printCard">
                  <div className="pt">Gusset</div><div className="pm">One continuous strip with side zones, end allowances, match marks, and tiling.</div>
                  <PrintButton tone="cp" small label="Print Gusset" meta={gusPlan?cpTileLabel(gusPlan):"Add finished gusset width"} disabled={!model.valid||!hasGusset||!gusPlan} onClick={()=>cpPrintGusset(model,params)}/>
                </div>
              </div>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}
