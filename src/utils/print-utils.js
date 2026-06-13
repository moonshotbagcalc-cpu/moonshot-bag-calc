/* =====================================================================
   TILED PRINT ENGINE — 7" × 10" tiles, Letter and A4 safe at 100%.
   ===================================================================== */
export const CP_TILE_W = 7, CP_TILE_H = 9.68;  // safe printable area on Letter and A4 at 100%
export const CP_CM3 = 3 / 2.54; // 1.1811"

export function cpTilePlan(spanW, spanH, allowRotate=true){
  const normal={rotated:false,w:spanW,h:spanH,cols:Math.max(1,Math.ceil(spanW/CP_TILE_W)),rows:Math.max(1,Math.ceil(spanH/CP_TILE_H))};
  normal.pages=normal.cols*normal.rows;
  if(!allowRotate)return normal;
  const rotated={rotated:true,w:spanH,h:spanW,cols:Math.max(1,Math.ceil(spanH/CP_TILE_W)),rows:Math.max(1,Math.ceil(spanW/CP_TILE_H))};
  rotated.pages=rotated.cols*rotated.rows;
  if(rotated.pages<normal.pages)return rotated;
  if(rotated.pages===normal.pages&&rotated.rows<normal.rows)return rotated;
  return normal;
}
export function cpTileLabel(plan){return `${plan.pages} page${plan.pages===1?"":"s"} · ${plan.rows}×${plan.cols}${plan.rotated?" · rotated":""}`;}
export function cpRowLabel(index){
  let n=index+1,out="";
  while(n>0){n--;out=String.fromCharCode(65+(n%26))+out;n=Math.floor(n/26);}
  return out;
}

/* Test squares for the HTML summary page only — not on pattern tiles */
export function cpTestSquareSVG(){
  const szC = CP_CM3, pad = 0.1, gap = 0.5;
  const tw = 1 + gap + szC + 2*pad, th = 1 + 0.28 + 2*pad;
  return `<svg width="${tw}in" height="${th}in" viewBox="0 0 ${tw} ${th}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:6pt 0 4pt">` +
    `<rect x="${pad}" y="${pad}" width="1" height="1" fill="none" stroke="#000" stroke-width="0.02"/>` +
    `<text x="${pad}" y="${pad+1+0.2}" font-size="0.14" font-family="Nunito,sans-serif" fill="#000">1″</text>` +
    `<rect x="${pad+1+gap}" y="${pad}" width="${szC.toFixed(4)}" height="${szC.toFixed(4)}" fill="none" stroke="#000" stroke-width="0.02"/>` +
    `<text x="${pad+1+gap}" y="${pad+szC+0.2}" font-size="0.14" font-family="Nunito,sans-serif" fill="#000">3\u2009cm</text>` +
    `</svg>`;
}

export function cpRegistrationMarks(vx,vy,w,h){
  const m=0.12,l=0.09;
  const pts=[[vx+m,vy+m],[vx+w-m,vy+m],[vx+m,vy+h-m],[vx+w-m,vy+h-m]];
  return pts.map(([x,y])=>
    `<path d="M ${(x-l).toFixed(3)} ${y.toFixed(3)} H ${(x+l).toFixed(3)} M ${x.toFixed(3)} ${(y-l).toFixed(3)} V ${(y+l).toFixed(3)}" stroke="#777" stroke-width="0.012" fill="none"/>`
  ).join("");
}
