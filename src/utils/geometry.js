import { PI } from "./constants.js";

export function roundRectPerim(L, W, R) {
  const r = Math.max(0, R);
  return 2*(L+W) + r*(2*PI - 8);
}
export function ellipsePerim(W, H) {
  if (!W || !H || W <= 0 || H <= 0) return 0;
  const a = W / 2;
  const b = H / 2;
  const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
  return PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}
