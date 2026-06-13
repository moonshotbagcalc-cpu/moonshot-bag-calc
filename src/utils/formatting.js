// ── Unit state ──────────────────────────────────────────────────────────────
let CURRENT_UNIT = "imperial";
export const MM_PER_IN = 25.4;

export function setCurrentUnit(unit) { CURRENT_UNIT = unit; }
export function isMetric() { return CURRENT_UNIT === "metric"; }

// ── Unit conversion ─────────────────────────────────────────────────────────
export function inToMm(v) { return v * MM_PER_IN; }
export function mmToIn(v) { return v / MM_PER_IN; }
// Internal rounding: nearest 0.1 cm = nearest 1 mm — keeps geometry accurate
export function metricRoundIn(v) { return mmToIn(Math.round(inToMm(v))); }

// ── Rounding ────────────────────────────────────────────────────────────────
export function roundTo8th(v) { return isMetric() ? metricRoundIn(v) : Math.round(v * 8) / 8; }
export function roundTo4th(v) { return isMetric() ? metricRoundIn(v) : Math.round(v * 4) / 4; }
export function roundTo32nd(v) { return isMetric() ? metricRoundIn(v) : Math.round(v * 32) / 32; }
export function smartRound(v) {
  if (isMetric()) return metricRoundIn(v);
  const q = roundTo4th(v);
  return Math.abs(q - v) <= 1/16 ? q : roundTo8th(v);
}

// ── Fraction display — numeric, with carry ────────────────────────────────────
const FM = {0:"",0.125:"1/8",0.25:"1/4",0.375:"3/8",0.5:"1/2",0.625:"5/8",0.75:"3/4",0.875:"7/8"};
const FM32 = {
  0:"", 0.03125:"1/32", 0.0625:"1/16", 0.09375:"3/32",
  0.125:"1/8", 0.15625:"5/32", 0.1875:"3/16", 0.21875:"7/32",
  0.25:"1/4", 0.28125:"9/32", 0.3125:"5/16", 0.34375:"11/32",
  0.375:"3/8", 0.40625:"13/32", 0.4375:"7/16", 0.46875:"15/32",
  0.5:"1/2", 0.53125:"17/32", 0.5625:"9/16", 0.59375:"19/32",
  0.625:"5/8", 0.65625:"21/32", 0.6875:"11/16", 0.71875:"23/32",
  0.75:"3/4", 0.78125:"25/32", 0.8125:"13/16", 0.84375:"27/32",
  0.875:"7/8", 0.90625:"29/32", 0.9375:"15/16", 0.96875:"31/32",
};

export function fmtInch(v) {
  if (v == null || isNaN(v) || v < 0) return "—";
  if (isMetric()) return fmtCm(v);
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

export function fmtInch32(v) {
  if (v == null || isNaN(v) || v < 0) return "—";
  if (isMetric()) return fmtCm(v);
  const rounded = Math.round(v * 32) / 32;
  const w = Math.floor(rounded);
  const fr = Math.round((rounded - w) * 32) / 32;
  const whole = fr >= 1 ? w + 1 : w;
  const fracVal = fr >= 1 ? 0 : fr;
  const fs = FM32[Math.round(fracVal * 32) / 32] ?? "";
  if (whole === 0 && fs) return `${fs}"`;
  if (!fs) return `${whole}"`;
  return `${whole} ${fs}"`;
}

// Display: cm to 1 decimal, drop trailing .0
export function fmtCm(v) {
  if (v == null || isNaN(v) || v < 0) return "—";
  const cm = inToMm(v) / 10;
  const rounded = Math.round(cm * 10) / 10;
  return (rounded % 1 === 0) ? `${rounded} cm` : `${rounded.toFixed(1)} cm`;
}

export function setLengthViaUnit(value, onWhole, onFrac) {
  const val = Math.max(0, parseFloat(value) || 0);
  // Metric input is now in cm, not mm
  const inches = isMetric() ? mmToIn(val * 10) : val;
  const whole = Math.floor(inches);
  onWhole(whole);
  onFrac(Math.max(0, inches - whole));
}
