import { isMetric, mmToIn } from "../utils/formatting.js";

export function SecHeader({ title, sub, th }) {
  return (
    <div style={{ background:th.hdr, borderRadius:"14px 14px 0 0", padding:"18px 22px 14px" }}>
      <div style={{ fontSize:24, fontWeight:900, color:th.hdrTxt, fontFamily:"Nunito,sans-serif", letterSpacing:"-0.01em" }}>{title}</div>
      {sub && <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.85)", marginTop:5, fontFamily:"Nunito,sans-serif", lineHeight:1.45 }}>{sub}</div>}
    </div>
  );
}
export function Card({ children, th, style:st }) {
  return (
    <div style={{ background:th.card, border:`1.5px solid ${th.border}`, borderRadius:10,
      padding:"16px 18px", marginBottom:12, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", ...st }}>
      {children}
    </div>
  );
}
export function CardTitle({ children, th }) {
  return (
    <div style={{ fontSize:13, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
      color:th.label, marginBottom:12, fontFamily:"Nunito,sans-serif",
      borderBottom:`2px solid ${th.border}`, paddingBottom:8 }}>
      {children}
    </div>
  );
}
export function RRow({ label, value, accent, big, th }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
      padding:"7px 0", borderBottom:`1px solid ${th.border}` }}>
      <div style={{ fontSize:15, fontWeight:700, color:th.label, fontFamily:"Nunito,sans-serif" }}>{label}</div>
      <div style={{ fontSize:big?24:19, fontFamily:"DM Mono,monospace", fontWeight:500,
        color:accent?th.resAccent:th.resTxt }}>{value}</div>
    </div>
  );
}
export function InfoBox({ children, th }) {
  return (
    <div style={{ background:th.info, border:`1.5px solid ${th.infoBdr}`, borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:15, fontWeight:600, color:th.infoTxt,
      fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}
export function NoteBox({ children }) {
  return (
    <div style={{ background:"#fdf4e0", border:"1.5px solid #d4a820", borderRadius:8,
      padding:"11px 14px", marginTop:10, fontSize:15, fontWeight:600, color:"#6b4400",
      fontFamily:"Nunito,sans-serif", lineHeight:1.5 }}>
      {children}
    </div>
  );
}
export function SubTabs({ tabs, active, set, th }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {tabs.map(tab=>(
        <button key={tab.id} onClick={()=>set(tab.id)} style={{
          flex:1, minWidth:80, padding:"10px 6px", fontSize:13, fontWeight:800,
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
export function Nudge({ label, onClick, th }) {
  return (
    <button onClick={onClick} style={{ width:"100%", flex:1, fontSize:13, fontWeight:800,
      fontFamily:"DM Mono,monospace", background:th.nudgeBg, color:th.nudgeTxt,
      border:`1.5px solid ${th.border}`, borderRadius:6, cursor:"pointer",
      padding:"4px 2px", lineHeight:1.3 }}>
      {label}
    </button>
  );
}
export function Divider({ th }) {
  return <div style={{ borderTop:`2px dashed ${th.border}`, margin:"14px 0", opacity:0.5 }} />;
}
export function SABar({ sa, setSa, cSa, setCsa, th }) {
  const imperialPresets=[{l:'1/4"',v:0.25},{l:'3/8"',v:0.375},{l:'1/2"',v:0.5}];
  const metricPresets=[{l:'0.5 cm',v:mmToIn(5)},{l:'1 cm',v:mmToIn(10)},{l:'1.5 cm',v:mmToIn(15)},{l:'2 cm',v:mmToIn(20)}];
  const presets=isMetric()?metricPresets:imperialPresets;
  const isCustom=!presets.some(p=>Math.abs(p.v-sa)<0.0005);
  return (
    <div style={{ background:th.card, border:`1.5px solid ${th.border}`, borderRadius:10,
      padding:"14px 16px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:13, fontWeight:900, letterSpacing:"0.09em", textTransform:"uppercase",
        color:th.label, marginBottom:10, fontFamily:"Nunito,sans-serif",
        borderBottom:`2px solid ${th.border}`, paddingBottom:8 }}>
        Seam Allowance
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {presets.map(p=>(
          <button key={p.l} onClick={()=>{setSa(p.v);setCsa("");}} style={{
            padding:"10px 14px", fontSize:16, fontFamily:"DM Mono,monospace", fontWeight:500,
            borderRadius:8, cursor:"pointer",
            background:Math.abs(sa-p.v)<0.0005?th.btnOn:th.btnOff,
            color:Math.abs(sa-p.v)<0.0005?"#fff":th.btnOffTxt,
            border:`2px solid ${Math.abs(sa-p.v)<0.0005?th.btnOn:th.border}`,
            transition:"all 0.15s"
          }}>{p.l}</button>
        ))}
        <input type="number" min={isMetric()?"0.1":"0.0625"} max={isMetric()?"10":"1"} step={isMetric()?"0.1":"0.0625"} placeholder={isMetric()?"custom cm":"custom"}
          value={cSa}
          onChange={e=>{setCsa(e.target.value);const v=parseFloat(e.target.value);if(!isNaN(v)&&v>0)setSa(isMetric()?mmToIn(v*10):v);}}
          style={{ width:isMetric()?110:88, padding:"10px 8px", fontSize:14, fontFamily:"DM Mono,monospace",
            fontWeight:500, borderRadius:8, textAlign:"center",
            background:isCustom?"#fef3c7":th.inputBg,
            border:`2px solid ${isCustom?"#c08800":th.border}`,
            color:th.inputTxt, outline:"none" }}
        />
      </div>
    </div>
  );
}
