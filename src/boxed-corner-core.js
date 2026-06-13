/* =====================================================================
   BOXED CORNER GEOMETRY CORE
   Pure JavaScript. All units are inches. SVG-style coordinates (y down).

   Geometry is built from the requested FINISHED front-face trapezoid.
   The half-depth is offset outward from each finished face edge to locate
   the effective side seam and bottom seam/fold. Seam allowance is then
   applied only to edges that are actually sewn.

   For each boxed corner:
     • one cut leg leaves the bottom edge/fold at 90°
     • one cut leg leaves the tapered side edge at 90°
     • the two legs meet at the finished face corner

   This makes the finished depth independent of the trapezoid angle.
   ===================================================================== */

const EPS = 1e-8;
const FR8 = ["", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"];

function add(a,b){ return {x:a.x+b.x,y:a.y+b.y}; }
function sub(a,b){ return {x:a.x-b.x,y:a.y-b.y}; }
function mul(a,s){ return {x:a.x*s,y:a.y*s}; }
function dot(a,b){ return a.x*b.x+a.y*b.y; }
function cross(a,b){ return a.x*b.y-a.y*b.x; }
function dist(a,b){ return Math.hypot(b.x-a.x,b.y-a.y); }
function unit(v){ const l=Math.hypot(v.x,v.y)||EPS; return {x:v.x/l,y:v.y/l}; }
function midpoint(a,b){ return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}; }
function reflectY(p,y){ return {...p,y:2*y-p.y}; }
function nearly(a,b,tol=1e-7){ return Math.abs(a-b)<=tol; }

function signedArea(pts){
  let a=0;
  for(let i=0;i<pts.length;i++){
    const j=(i+1)%pts.length;
    a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;
  }
  return a/2;
}

function orientation(a,b,c){ return cross(sub(b,a),sub(c,a)); }
function onSegment(a,b,p,eps=1e-8){
  return Math.abs(orientation(a,b,p))<=eps &&
    p.x>=Math.min(a.x,b.x)-eps&&p.x<=Math.max(a.x,b.x)+eps&&
    p.y>=Math.min(a.y,b.y)-eps&&p.y<=Math.max(a.y,b.y)+eps;
}
function segmentsIntersect(a,b,c,d,includeTouch=true){
  const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);
  if(((o1>EPS&&o2<-EPS)||(o1<-EPS&&o2>EPS))&&((o3>EPS&&o4<-EPS)||(o3<-EPS&&o4>EPS))) return true;
  if(!includeTouch) return false;
  return (Math.abs(o1)<=EPS&&onSegment(a,b,c))||(Math.abs(o2)<=EPS&&onSegment(a,b,d))||
    (Math.abs(o3)<=EPS&&onSegment(c,d,a))||(Math.abs(o4)<=EPS&&onSegment(c,d,b));
}
function selfIntersections(pts){
  const out=[],n=pts.length;
  for(let i=0;i<n;i++){
    const i2=(i+1)%n;
    for(let j=i+1;j<n;j++){
      const j2=(j+1)%n;
      if(i===j||i2===j||j2===i) continue;
      if(i===0&&j2===0) continue;
      if(segmentsIntersect(pts[i],pts[i2],pts[j],pts[j2],true)) out.push([i,j]);
    }
  }
  return out;
}

function lineIntersect(p,d,q,e){
  const den=cross(d,e);
  if(Math.abs(den)<EPS) return null;
  const t=cross(sub(q,p),e)/den;
  return add(p,mul(d,t));
}
function projectPointToLine(p,a,b){
  const d=sub(b,a),dd=dot(d,d)||EPS;
  const t=dot(sub(p,a),d)/dd;
  return add(a,mul(d,t));
}
function lineAtY(a,b,y){
  const d=sub(b,a);
  if(Math.abs(d.y)<EPS) return null;
  return {x:a.x+(y-a.y)*d.x/d.y,y};
}
function offsetSegment(a,b,n,d){ return [add(a,mul(n,d)),add(b,mul(n,d))]; }

function bbox(pts){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const p of pts){ minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y); }
  return {minX,minY,maxX,maxY,w:maxX-minX,h:maxY-minY};
}

function dedupe(pts){
  if(!pts.length) return [];
  const out=[pts[0]];
  for(let i=1;i<pts.length;i++) if(dist(out[out.length-1],pts[i])>1e-7) out.push(pts[i]);
  while(out.length>2&&dist(out[0],out[out.length-1])<1e-7) out.pop();
  return out;
}

/* Exact mitered inward offset for the simple straight-edged patterns used here. */
function offsetPolygonInward(pts,d){
  if(d<=EPS) return pts.map(p=>({...p}));
  const n=pts.length,clockwise=signedArea(pts)>0;
  const lines=[];
  for(let i=0;i<n;i++){
    const a=pts[i],b=pts[(i+1)%n],u=unit(sub(b,a));
    const inward=clockwise?{x:-u.y,y:u.x}:{x:u.y,y:-u.x};
    lines.push({p:add(a,mul(inward,d)),d:u});
  }
  const out=[];
  for(let i=0;i<n;i++){
    const prev=lines[(i-1+n)%n],cur=lines[i];
    let x=lineIntersect(prev.p,prev.d,cur.p,cur.d);
    if(!x){
      const a=add(prev.p,mul(prev.d,dot(sub(pts[i],prev.p),prev.d)));
      const b=add(cur.p,mul(cur.d,dot(sub(pts[i],cur.p),cur.d)));
      x=midpoint(a,b);
    }
    // Guard against pathological long miters from nearly parallel edges.
    if(dist(x,pts[i])>Math.max(12*d,1)){
      const u1=unit(sub(pts[i],pts[(i-1+n)%n]));
      const u2=unit(sub(pts[(i+1)%n],pts[i]));
      const n1=clockwise?{x:-u1.y,y:u1.x}:{x:u1.y,y:-u1.x};
      const n2=clockwise?{x:-u2.y,y:u2.x}:{x:u2.y,y:-u2.x};
      const m=unit(add(n1,n2));
      x=add(pts[i],mul(m,d));
    }
    out.push(x);
  }
  return out;
}

function pointLineDistance(p,a,b){
  const d=sub(b,a);
  return Math.abs(cross(d,sub(p,a)))/(Math.hypot(d.x,d.y)||EPS);
}

function horizontalSpanInPolygon(pts,y){
  const xs=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[i],b=pts[(i+1)%pts.length];
    if(Math.abs(a.y-y)<=EPS&&Math.abs(b.y-y)<=EPS){ xs.push(a.x,b.x); continue; }
    if(y<Math.min(a.y,b.y)-EPS||y>Math.max(a.y,b.y)+EPS||Math.abs(a.y-b.y)<=EPS) continue;
    const t=(y-a.y)/(b.y-a.y);
    if(t>=-EPS&&t<=1+EPS) xs.push(a.x+(b.x-a.x)*t);
  }
  xs.sort((a,b)=>a-b);
  const uniq=[];
  for(const x of xs) if(!uniq.length||Math.abs(x-uniq[uniq.length-1])>1e-7) uniq.push(x);
  return uniq.length>=2?{a:{x:uniq[0],y},b:{x:uniq[uniq.length-1],y}}:null;
}

function fmtIn(v){
  if(v==null||!Number.isFinite(v)) return "—";
  const neg=v<0?"-":""; v=Math.abs(v);
  let e=Math.round(v*8),whole=Math.floor(e/8),rem=e%8;
  if(!whole&&!rem) return "0″";
  if(!rem) return neg+whole+"″";
  if(!whole) return neg+FR8[rem]+"″";
  return neg+whole+" "+FR8[rem]+"″";
}
function fmtDec(v){ return Number.isFinite(v)?v.toFixed(3)+"″":"—"; }
function ptsToPath(pts,close=true){
  if(!pts?.length) return "";
  let d="M "+pts.map(p=>p.x.toFixed(4)+" "+p.y.toFixed(4)).join(" L ");
  if(close) d+=" Z";
  return d;
}

function buildBoxedCornerModel(input={}){
  const p={
    topW:Math.max(0,+input.topW||0),
    botW:Math.max(0,+input.botW||0),
    height:Math.max(0,+input.height||0),
    depth:Math.max(0,+input.depth||0),
    sa:Math.max(0,+input.sa||0),
    layout:input.layout==="fold"?"fold":"two",
    shape:input.shape==="trap"?"trap":"rect",
    topMode:input.topMode==="enclosed"?"enclosed":"open",
    stabilizerEnabled:input.stabilizerEnabled===true,
    stabilizerOffset:Math.max(0,+input.stabilizerOffset||0),
  };
  if(p.shape==="rect") p.topW=p.botW;

  const errors=[],notes=[];
  if(p.botW<=EPS) errors.push("Enter a finished bottom width.");
  if(p.topW<=EPS) errors.push("Enter a finished top width.");
  if(p.height<=EPS) errors.push("Enter a finished height.");
  if(p.depth<=EPS) errors.push("Enter a finished depth.");
  if(p.sa<=EPS) errors.push("Enter a seam allowance.");

  const d=p.depth/2;
  const face={
    TL:{x:-p.topW/2,y:-p.height}, TR:{x:p.topW/2,y:-p.height},
    BL:{x:-p.botW/2,y:0}, BR:{x:p.botW/2,y:0},
  };

  // Clockwise face-side tangents and outward normals.
  const tR=unit(sub(face.BR,face.TR));
  const nR={x:tR.y,y:-tR.x};
  const tL=unit(sub(face.TL,face.BL));
  const nL={x:tL.y,y:-tL.x};

  const sideAngle=Math.atan2(Math.abs(face.BR.x-face.TR.x),p.height||EPS)*180/Math.PI;
  if(sideAngle>38) notes.push("This is a steep taper. Sew a test corner before cutting final fabric.");

  const leftRaw=offsetSegment(face.BL,face.TL,nL,d+p.sa);   // bottom → top
  const rightRaw=offsetSegment(face.TR,face.BR,nR,d+p.sa); // top → bottom
  const leftSew=offsetSegment(face.BL,face.TL,nL,d);
  const rightSew=offsetSegment(face.TR,face.BR,nR,d);

  const bottomLineY=d+(p.layout==="two"?p.sa:0);
  const foldY=d;
  const topEffectiveY=-p.height-(p.topMode==="enclosed"?d:0);
  const topRawY=topEffectiveY-p.sa;

  const rawTopL=lineAtY(leftRaw[0],leftRaw[1],topRawY);
  const rawTopR=lineAtY(rightRaw[0],rightRaw[1],topRawY);
  if(!rawTopL||!rawTopR) errors.push("The side taper cannot reach the requested top edge.");

  const sideBL=projectPointToLine(face.BL,leftRaw[0],leftRaw[1]);
  const sideBR=projectPointToLine(face.BR,rightRaw[0],rightRaw[1]);
  const bottomBL={x:face.BL.x,y:bottomLineY};
  const bottomBR={x:face.BR.x,y:bottomLineY};

  const leftRawBottomCorner=lineAtY(leftRaw[0],leftRaw[1],bottomLineY);
  const rightRawBottomCorner=lineAtY(rightRaw[0],rightRaw[1],bottomLineY);

  let topCut=null;
  if(p.topMode==="enclosed"){
    topCut={
      topL:{x:face.TL.x,y:topRawY}, topR:{x:face.TR.x,y:topRawY},
      sideL:projectPointToLine(face.TL,leftRaw[0],leftRaw[1]),
      sideR:projectPointToLine(face.TR,rightRaw[0],rightRaw[1]),
      ML:face.TL, MR:face.TR,
      outerL:lineAtY(leftRaw[0],leftRaw[1],topRawY),
      outerR:lineAtY(rightRaw[0],rightRaw[1],topRawY),
    };
  }

  let cutPts=[],removedPolys=[],foldLine=null;

  if(rawTopL&&rawTopR){
    if(p.layout==="two"){
      if(p.topMode==="open"){
        cutPts=[
          rawTopL,rawTopR,
          sideBR,face.BR,bottomBR,bottomBL,face.BL,sideBL,
        ];
      }else{
        cutPts=[
          topCut.topL,topCut.topR,topCut.MR,topCut.sideR,
          sideBR,face.BR,bottomBR,bottomBL,face.BL,sideBL,
          topCut.sideL,topCut.ML,
        ];
      }
      if(leftRawBottomCorner) removedPolys.push({kind:"bottom-left",pts:[leftRawBottomCorner,sideBL,face.BL,bottomBL]});
      if(rightRawBottomCorner) removedPolys.push({kind:"bottom-right",pts:[rightRawBottomCorner,bottomBR,face.BR,sideBR]});
      if(topCut?.outerL) removedPolys.push({kind:"top-left",pts:[topCut.outerL,topCut.topL,topCut.ML,topCut.sideL]});
      if(topCut?.outerR) removedPolys.push({kind:"top-right",pts:[topCut.outerR,topCut.sideR,topCut.MR,topCut.topR]});
    }else{
      const upperTopPath=p.topMode==="open"
        ? [rawTopL,rawTopR]
        : [topCut.sideL,topCut.ML,topCut.topL,topCut.topR,topCut.MR,topCut.sideR];
      const leftTopU=upperTopPath[0],rightTopU=upperTopPath[upperTopPath.length-1];
      const ALeft={x:face.BL.x,y:foldY},ARight={x:face.BR.x,y:foldY};
      const lowerTopPath=[...upperTopPath].reverse().map(q=>reflectY(q,foldY));
      const leftTopL=reflectY(leftTopU,foldY),rightTopL=reflectY(rightTopU,foldY);
      const faceBLL=reflectY(face.BL,foldY),faceBRL=reflectY(face.BR,foldY);
      const sideBLL=reflectY(sideBL,foldY),sideBRL=reflectY(sideBR,foldY);

      cutPts=[
        ...upperTopPath,
        sideBR,face.BR,ARight,
        faceBRL,sideBRL,rightTopL,
        ...lowerTopPath.slice(1),
        sideBLL,faceBLL,ALeft,
        face.BL,sideBL,
      ];
      foldLine={a:ALeft,b:ARight,y:foldY};

      const leftFoldOuter=lineAtY(leftRaw[0],leftRaw[1],foldY);
      const rightFoldOuter=lineAtY(rightRaw[0],rightRaw[1],foldY);
      if(leftFoldOuter){
        removedPolys.push({kind:"fold-left-upper",pts:[leftFoldOuter,sideBL,face.BL,ALeft]});
        removedPolys.push({kind:"fold-left-lower",pts:[leftFoldOuter,ALeft,faceBLL,sideBLL].map((q,i)=>i===0?reflectY(q,foldY):q)});
      }
      if(rightFoldOuter){
        removedPolys.push({kind:"fold-right-upper",pts:[rightFoldOuter,ARight,face.BR,sideBR]});
        removedPolys.push({kind:"fold-right-lower",pts:[reflectY(rightFoldOuter,foldY),sideBRL,faceBRL,ARight]});
      }
      if(topCut?.outerL){
        const up=[topCut.outerL,topCut.topL,topCut.ML,topCut.sideL];
        removedPolys.push({kind:"top-left-upper",pts:up});
        removedPolys.push({kind:"top-left-lower",pts:[...up].reverse().map(q=>reflectY(q,foldY))});
      }
      if(topCut?.outerR){
        const up=[topCut.outerR,topCut.sideR,topCut.MR,topCut.topR];
        removedPolys.push({kind:"top-right-upper",pts:up});
        removedPolys.push({kind:"top-right-lower",pts:[...up].reverse().map(q=>reflectY(q,foldY))});
      }
    }
  }

  cutPts=dedupe(cutPts);
  if(cutPts.length<6) errors.push("The panel outline could not be constructed.");
  if(cutPts.length&&signedArea(cutPts)<0) cutPts.reverse();
  if(cutPts.length&&selfIntersections(cutPts).length) errors.push("The calculated cut outline crosses itself. Reduce the taper, depth, or seam allowance.");
  if(cutPts.length&&Math.abs(signedArea(cutPts))<EPS) errors.push("The calculated panel has no usable area.");

  const cutBB=cutPts.length?bbox(cutPts):{minX:0,minY:0,maxX:0,maxY:0,w:0,h:0};

  // Only actual assembly seams are shown. Box-cut legs are cut edges, not
  // stitch lines. An open top has no top stitch line.
  const upperFace=[face.TL,face.TR,face.BR,face.BL];
  const lowerFace=p.layout==="fold"?upperFace.map(q=>reflectY(q,foldY)):[];
  const meetLines=(a,b,c,d2)=>lineIntersect(a,sub(b,a),c,sub(d2,c));
  const sideSewBottomL=meetLines(leftSew[0],leftSew[1],sideBL,face.BL);
  const sideSewBottomR=meetLines(rightSew[0],rightSew[1],sideBR,face.BR);
  const sideSewTopL=p.topMode==="open"
    ? lineAtY(leftSew[0],leftSew[1],topRawY)
    : meetLines(leftSew[0],leftSew[1],topCut.sideL,face.TL);
  const sideSewTopR=p.topMode==="open"
    ? lineAtY(rightSew[0],rightSew[1],topRawY)
    : meetLines(rightSew[0],rightSew[1],topCut.sideR,face.TR);

  const upperStitchLines=[];
  if(sideSewTopL&&sideSewBottomL) upperStitchLines.push({kind:"side-left",pts:[sideSewTopL,sideSewBottomL]});
  if(sideSewTopR&&sideSewBottomR) upperStitchLines.push({kind:"side-right",pts:[sideSewTopR,sideSewBottomR]});
  if(p.topMode==="enclosed") upperStitchLines.push({kind:"top",pts:[{x:face.TL.x,y:topEffectiveY},{x:face.TR.x,y:topEffectiveY}]});

  const stitchLines=[...upperStitchLines];
  if(p.layout==="two") stitchLines.push({kind:"bottom",pts:[{x:face.BL.x,y:d},{x:face.BR.x,y:d}]});
  else {
    for(const line of upperStitchLines){
      stitchLines.push({kind:line.kind+"-lower",pts:[...line.pts].reverse().map(q=>reflectY(q,foldY))});
    }
  }

  const centerLine=cutPts.length?{a:{x:0,y:cutBB.minY},b:{x:0,y:cutBB.maxY}}:null;

  // Stabilizer is a true inset of the complete fabric cut outline. With an
  // offset equal to SA it lands on the seam allowance boundary while staying
  // one continuous piece across a fold.
  const stabilizer={enabled:p.stabilizerEnabled,offset:p.stabilizerOffset,valid:true,errors:[],pts:[],bb:null};
  if(stabilizer.enabled){
    if(stabilizer.offset<=EPS) stabilizer.errors.push("Enter a stabilizer offset greater than zero.");
    else if(cutPts.length){
      stabilizer.pts=offsetPolygonInward(cutPts,stabilizer.offset);
      if(stabilizer.pts.length!==cutPts.length) stabilizer.errors.push("The stabilizer outline could not be completed.");
      if(stabilizer.pts.length&&selfIntersections(stabilizer.pts).length) stabilizer.errors.push("The stabilizer outline crosses itself. Reduce the stabilizer offset.");
      if(stabilizer.pts.length&&Math.abs(signedArea(stabilizer.pts))>=Math.abs(signedArea(cutPts))-EPS) stabilizer.errors.push("The stabilizer offset does not produce a smaller pattern.");
      if(stabilizer.pts.length===cutPts.length){
        let maxOffsetError=0;
        for(let i=0;i<cutPts.length;i++){
          const j=(i+1)%cutPts.length;
          const mid=midpoint(stabilizer.pts[i],stabilizer.pts[j]);
          maxOffsetError=Math.max(maxOffsetError,Math.abs(pointLineDistance(mid,cutPts[i],cutPts[j])-stabilizer.offset));
        }
        if(maxOffsetError>1e-6) stabilizer.errors.push("The stabilizer offset failed its distance check.");
      }
      if(stabilizer.pts.length){
        stabilizer.bb=bbox(stabilizer.pts);
        stabilizer.centerLine={a:{x:0,y:stabilizer.bb.minY},b:{x:0,y:stabilizer.bb.maxY}};
        stabilizer.foldLine=p.layout==="fold"?horizontalSpanInPolygon(stabilizer.pts,foldY):null;
      }
    }
    stabilizer.valid=stabilizer.errors.length===0;
  }

  // Reconstruct the finished face corners from raw lines and edge-specific offsets.
  const rawBottomA={x:-1000,y:bottomLineY},rawBottomB={x:1000,y:bottomLineY};
  const bottomInset=p.layout==="two"?d+p.sa:d;
  function reconstructBottom(sideRaw,isLeft){
    const u=unit(sub(sideRaw[1],sideRaw[0]));
    const inwardSide=isLeft?{x:-nL.x,y:-nL.y}:{x:-nR.x,y:-nR.y};
    const sideInner=[add(sideRaw[0],mul(inwardSide,d+p.sa)),add(sideRaw[1],mul(inwardSide,d+p.sa))];
    const bottomInner=[{x:-1000,y:bottomLineY-bottomInset},{x:1000,y:bottomLineY-bottomInset}];
    return lineIntersect(sideInner[0],sub(sideInner[1],sideInner[0]),bottomInner[0],sub(bottomInner[1],bottomInner[0]));
  }
  const recBL=reconstructBottom(leftRaw,true),recBR=reconstructBottom(rightRaw,false);

  function reconstructTop(sideRaw,isLeft){
    const inwardSide=isLeft?{x:-nL.x,y:-nL.y}:{x:-nR.x,y:-nR.y};
    const sideInner=[add(sideRaw[0],mul(inwardSide,d+p.sa)),add(sideRaw[1],mul(inwardSide,d+p.sa))];
    const topInset=p.topMode==="enclosed"?d+p.sa:p.sa;
    const y=topRawY+topInset;
    return lineAtY(sideInner[0],sideInner[1],y);
  }
  const recTL=reconstructTop(leftRaw,true),recTR=reconstructTop(rightRaw,false);

  const checks={
    topW:recTL&&recTR?dist(recTL,recTR):NaN,
    botW:recBL&&recBR?dist(recBL,recBR):NaN,
    height:recTL&&recBL?Math.abs(recBL.y-recTL.y):NaN,
    depth:2*d,
  };
  const tol=1e-6;
  if(Number.isFinite(checks.topW)&&Math.abs(checks.topW-p.topW)>tol) errors.push("Top-width reconstruction failed.");
  if(Number.isFinite(checks.botW)&&Math.abs(checks.botW-p.botW)>tol) errors.push("Bottom-width reconstruction failed.");
  if(Number.isFinite(checks.height)&&Math.abs(checks.height-p.height)>tol) errors.push("Height reconstruction failed.");
  if(Math.abs(checks.depth-p.depth)>tol) errors.push("Depth reconstruction failed.");

  const bottomCorner={
    sideLegCut:dist(sideBL,face.BL),
    edgeLegCut:dist(face.BL,bottomBL),
    sideLegFinished:Math.max(0,dist(sideBL,face.BL)-p.sa),
    edgeLegFinished:Math.max(0,dist(face.BL,bottomBL)-(p.layout==="two"?p.sa:0)),
    left:{sideFoot:sideBL,meet:face.BL,edgeFoot:bottomBL,outer:leftRawBottomCorner},
    right:{sideFoot:sideBR,meet:face.BR,edgeFoot:bottomBR,outer:rightRawBottomCorner},
  };
  if(!nearly(bottomCorner.sideLegFinished,d,1e-6)||!nearly(bottomCorner.edgeLegFinished,d,1e-6)) errors.push("The bottom corner legs do not reconstruct to half the requested depth.");

  const topCorner=p.topMode==="enclosed"?{
    sideLegCut:dist(topCut.sideL,face.TL),
    edgeLegCut:dist(face.TL,topCut.topL),
    sideLegFinished:Math.max(0,dist(topCut.sideL,face.TL)-p.sa),
    edgeLegFinished:Math.max(0,dist(face.TL,topCut.topL)-p.sa),
  }:null;

  const perpendicularChecks=[
    Math.abs(dot(unit(sub(face.BL,sideBL)),unit(sub(leftRaw[1],leftRaw[0])))),
    Math.abs(dot(unit(sub(bottomBL,face.BL)),{x:1,y:0})),
    Math.abs(dot(unit(sub(face.BR,sideBR)),unit(sub(rightRaw[1],rightRaw[0])))),
    Math.abs(dot(unit(sub(bottomBR,face.BR)),{x:1,y:0})),
  ];
  if(Math.max(...perpendicularChecks)>1e-7) errors.push("A corner cut is not perpendicular to its source edge.");

  // Right-angle markers: vertex is where a cut leg leaves its source edge.
  const rightAngles=[
    {at:sideBL,edgeDir:unit(sub(leftRaw[1],leftRaw[0])),cutDir:unit(sub(face.BL,sideBL))},
    {at:bottomBL,edgeDir:{x:1,y:0},cutDir:unit(sub(face.BL,bottomBL))},
    {at:sideBR,edgeDir:unit(sub(rightRaw[1],rightRaw[0])),cutDir:unit(sub(face.BR,sideBR))},
    {at:bottomBR,edgeDir:{x:-1,y:0},cutDir:unit(sub(face.BR,bottomBR))},
  ];
  if(p.layout==="fold"){
    const mirrored=rightAngles.map(r=>({at:reflectY(r.at,foldY),edgeDir:{x:r.edgeDir.x,y:-r.edgeDir.y},cutDir:{x:r.cutDir.x,y:-r.cutDir.y}}));
    rightAngles.push(...mirrored);
  }

  const valid=errors.length===0;
  return {
    params:p,valid,errors,notes,
    cutPts,sewPts:[],stitchLines,centerLine,stabilizer,cutBB,foldLine,removedPolys,rightAngles,
    face:{upper:upperFace,lower:lowerFace},
    construction:{
      d,face,leftRaw,rightRaw,leftSew,rightSew,
      topRawY,topEffectiveY,bottomLineY,foldY,
      sideSewTopL,sideSewTopR,sideSewBottomL,sideSewBottomR,
      bottomCorner,topCorner,
    },
    checks,
    symmetry:p.layout==="fold",
    quantity:p.layout==="two"?2:1,
    labels:{
      layout:p.layout==="fold"?"1 folded piece":"2 separate panels",
      shape:p.shape==="trap"?"trapezoid":"rectangle",
      topMode:p.topMode==="enclosed"?"enclosed / top boxed":"open top",
    },
  };
}

export {
  EPS,add,sub,mul,dot,cross,dist,unit,midpoint,reflectY,
  signedArea,selfIntersections,lineIntersect,projectPointToLine,bbox,
  offsetPolygonInward,pointLineDistance,horizontalSpanInPolygon,
  fmtIn,fmtDec,ptsToPath,buildBoxedCornerModel,
};
