/** Shared cold-to-hot palette. Temperatures outside [22,65] are clamped. */
export const THERMAL_STOPS = [
 [22,'#2455b4'], [26,'#178fc1'], [30,'#2aa78e'],
 [34,'#75b64c'], [38,'#e5c34a'], [42,'#ef9336'],
 [48,'#db4c32'], [55,'#aa2942'], [65,'#72214b']
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hexRgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function thermalColor(temp){
 const t=clamp(Number.isFinite(temp)?temp:22,22,65);
 let i=1;while(i<THERMAL_STOPS.length-1 && t>THERMAL_STOPS[i][0])i++;
 const [t0,c0]=THERMAL_STOPS[i-1],[t1,c1]=THERMAL_STOPS[i];
 const f=clamp((t-t0)/(t1-t0),0,1),a=hexRgb(c0),b=hexRgb(c1);
 return `rgb(${a.map((v,k)=>Math.round(v+(b[k]-v)*f)).join(',')})`;
}
