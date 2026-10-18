import {updateCellTemperature,mapLightToSolarShock,evaluateNodeState,propagateFailure,evaluateTreePlacementROI,calculateTotalEconomicLoss,calculateElectricLoad,calculateResilienceScore,cascadeFailures} from './formulas.js';
/* UrbanPulse recovery simulator. Original js/main.js was absent from uploaded archive.
   This is an educational replacement, not the original physical model. */
const $ = id => document.getElementById(id);
const canvas=$('grid-canvas'),ctx=canvas.getContext('2d');
// Render at higher internal resolution while retaining the original 560x560 layout.
// This prevents the 8x8 map's labels and lines from looking soft on Retina screens.
const GRID_CSS_SIZE=560;
const PIXEL_RATIO=Math.min(3,Math.max(2,window.devicePixelRatio||1));
canvas.width=Math.round(GRID_CSS_SIZE*PIXEL_RATIO);
canvas.height=Math.round(GRID_CSS_SIZE*PIXEL_RATIO);
ctx.setTransform(PIXEL_RATIO,0,0,PIXEL_RATIO,0,0);

const N=8,S=70, types=['CONCRETE_SKYSCRAPER','ASPHALT_ROAD','UTILITY_HUB','TREE_CANOPY','POCKET_PARK','WATER_BODY'];
const icons={CONCRETE_SKYSCRAPER:'🏙️',ASPHALT_ROAD:'🛣️',UTILITY_HUB:'⚡',TREE_CANOPY:'🌳',POCKET_PARK:'🏞️',WATER_BODY:'💧'};
const effects={CONCRETE_SKYSCRAPER:5,ASPHALT_ROAD:7,UTILITY_HUB:6,TREE_CANOPY:-4,POCKET_PARK:-3,WATER_BODY:-5};
const nodeLabels={18:'SUB-A',20:'PUMP-N',27:'HOSP-1',37:'DATA-1',43:'PUMP-S',45:'SUB-B'};
const nodeLinks=[[18,20],[18,27],[20,27],[37,43],[37,45],[43,45]];
const thresholds={18:48.5,20:46,27:41.5,37:48.5,43:46,45:48.5};
const baseLoads={18:22,20:12,27:18,37:15,43:12,45:22};
const costBase={18:4000,20:2500,27:9000,37:5000,43:2500,45:4000};
const escalation={18:450,20:280,27:1000,37:600,43:280,45:450};
const alpha=0.20, gamma=0.025, safeTemp=35, maxPossibleTemp=65; // Documented example alpha; remaining parameters are model assumptions

let shockSeconds=0, shockAmplitude=0, sensorLastLight=110, lastSensorAt=0, sensorPackets=0, sensorTemp=null;
let grid=[],view='HYBRID',brush='TREE_CANOPY',selected=18,paused=false,speed=1,light=110,ambient=30,wind=2,elapsed=0,loss=0,accumulatedLoss=0,heatExposureCost=0,history=[],connected=false,serialPort=null,reading=false,logFilter='ALL',eventLog=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const cell=i=>grid[i];
function initialize(){
 const scenario=$('scenario-select').value;
 // Spatial composition is reconstructed from the publicly visible reference.
 const nodeIds=[18,20,27,37,43,45];
 grid=Array.from({length:64},(_,i)=>({type:(i%8===6&&i>45?'TREE_CANOPY':i%8===7&&i>45?'POCKET_PARK':i%3===0?'CONCRETE_SKYSCRAPER':'ASPHALT_ROAD'),temp:ambient,failed:false,downTimeMinutes:0, failureCause:null}));
 nodeIds.forEach(i=>grid[i].type='UTILITY_HUB');
 if(scenario==='SUSTAINABLE_ECO_DISTRICT')grid.forEach((c,i)=>{if(i%3===0&&!nodeIds.includes(i))c.type='TREE_CANOPY';});
 if(scenario==='METROPOLIS_HARBOR')[48,49,50,56,57,58].forEach(i=>grid[i].type='WATER_BODY');
 // Start at the same displayed 30°C baseline as the public reference; scenarios
 // change infrastructure and thermal forcing, rather than silently overriding it.
 ambient=30;$('ambient-slider').value=30;
 grid.forEach((c,i)=>{c.temp=ambient+(c.type==='CONCRETE_SKYSCRAPER'?3.3:c.type==='ASPHALT_ROAD'?3.5:c.type==='TREE_CANOPY'?0.2:c.type==='POCKET_PARK'?0.6:3.2)+(i%4)*0.07;});
 loss=0;accumulatedLoss=0;heatExposureCost=0;elapsed=0;shockSeconds=0;shockAmplitude=0;history=[];eventLog=[];selected=27;render();
}
function step(dt=1){
 // 4-neighbor heat diffusion, per the recovered original equation.
 const solar=mapLightToSolarShock(light,0,7);
 const pulse=shockSeconds>0 ? shockAmplitude * (shockSeconds/12) : 0;
 const scenario=$('scenario-select').value;
 const extraHeat=scenario==='DOMINO_CASCADE_CRITICAL'?1.7:scenario==='SUSTAINABLE_ECO_DISTRICT'?-0.6:0;
 const next=grid.map((c,i)=>{
  const x=i%8,y=Math.floor(i/8);
  const neighbors=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<8&&b>=0&&b<8).map(([a,b])=>grid[b*8+a].temp);
   const landForcing=effects[c.type]*0.032;
  const scenarioRamp=scenario==='DOMINO_CASCADE_CRITICAL'?Math.min(26,elapsed*0.29):0;
  const target=ambient+solar+extraHeat+scenarioRamp+pulse+effects[c.type]*0.43;
  const environment=(target-c.temp)*0.038;
  return clamp(updateCellTemperature(c.temp,neighbors,alpha,landForcing+environment-wind*.012),10,85);
 });
 // First compute thermal failures from this tick's new temperatures.
 const failedNow=new Set();
 const causes=new Map();
 for(const id of Object.keys(nodeLabels).map(Number)){
   if(grid[id].type==='UTILITY_HUB' && next[id]>(thresholds[id]??48.5)){
     failedNow.add(id); causes.set(id,'THERMAL');
   }
 }
 // Graph closure: downstream failures follow directed utility dependencies.
 const cascaded=cascadeFailures(failedNow,nodeLinks.filter(([a,b])=>grid[a].type==='UTILITY_HUB'&&grid[b].type==='UTILITY_HUB'));
 for(const id of cascaded){
   if(!failedNow.has(id)){
     const parent=nodeLinks.find(([a,b])=>b===id&&cascaded.has(a));
     causes.set(id,`UPSTREAM ${nodeLabels[parent?.[0]]||'UTILITY'}`);
   }
 }
 failedNow.clear();for(const id of cascaded)failedNow.add(id);
 grid.forEach((c,i)=>{
   const wasFailed=c.failed;
   c.temp=clamp(next[i],10,85);
   c.failed=c.type==='UTILITY_HUB'&&failedNow.has(i);
   c.failureCause=c.failed?causes.get(i):null;
   if(c.failed)c.downTimeMinutes+=Math.max(0,dt)/60;
   if(c.type==='UTILITY_HUB'&&!c.failed&&c.temp>(thresholds[i]??48.5)-2&&!c.warned){
     c.warned=true;eventLog.unshift({time:Math.round(elapsed),type:'WARNINGS',message:`${nodeLabels[i]} heat warning: ${c.temp.toFixed(1)}°C near ${(thresholds[i]??48.5).toFixed(1)}°C`});
   }
   if(c.temp<(thresholds[i]??48.5)-3)c.warned=false;
   if(c.failed&&!wasFailed){
     accumulatedLoss+=(costBase[i]||2500);
     eventLog.unshift({time:Math.round(elapsed),type:'FAILURES',message:`${nodeLabels[i]} failed (${c.failureCause}) at (${Math.floor(i/8)}, ${i%8}), ${c.temp.toFixed(1)}°C`});
     eventLog=eventLog.slice(0,50);
   }
   if(!c.failed&&wasFailed){eventLog.unshift({time:Math.round(elapsed),type:'WARNINGS',message:`${nodeLabels[i]} recovered after conditions returned to safe levels`});}
 });
 // Fixed dispatch charge is applied once on failure; escalation accrues for every simulated minute.
 // Heat-exposure impact is tracked separately; it is NOT counted as downtime cost.
 accumulatedLoss+=grid.reduce((sum,c,i)=>sum+(c.failed?(escalation[i]||280)*dt/60:0),0);
 loss=accumulatedLoss;
 heatExposureCost+=grid.reduce((sum,c,i)=>sum+(nodeLabels[i]&&!c.failed?Math.max(0,c.temp-35)*0.12:0),0)*dt;
 history.push({avg:grid.reduce((sum,c)=>sum+c.temp,0)/64,peak:Math.max(...grid.map(c=>c.temp))});if(history.length>60)history.shift();
 elapsed+=dt;
 if(dt>0) shockSeconds=Math.max(0,shockSeconds-dt);
 render();
}
function paint(){
 ctx.clearRect(0,0,560,560);
 const hotColor=t=>{const p=clamp((t-22)/43,0,1);return `hsl(${205-p*200} ${45+p*40}% ${22+p*29}%)`;};
 grid.forEach((c,i)=>{
  const x=(i%8)*S,y=Math.floor(i/8)*S;
  let color=view==='LAND_COVER'?({CONCRETE_SKYSCRAPER:'#745e39',ASPHALT_ROAD:'#a6874a',UTILITY_HUB:'#9e8140',TREE_CANOPY:'#5b8746',POCKET_PARK:'#72a055',WATER_BODY:'#286b91'}[c.type]):view==='NETWORK'?'#131d2c':hotColor(c.temp);
  ctx.fillStyle=color;ctx.fillRect(x+1,y+1,S-2,S-2);
  ctx.strokeStyle='#091524';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,S-2,S-2);
  ctx.textAlign='left';ctx.fillStyle='#f0f8ff';ctx.font='bold 11px monospace';ctx.fillText(`${Math.floor(i/8)},${i%8}`,x+4,y+11);
  if(c.type!=='UTILITY_HUB'){
   ctx.textAlign='center';ctx.font='25px "Segoe UI Emoji",sans-serif';ctx.fillText(icons[c.type],x+35,y+34);
  }
  if(view!=='NETWORK'){
   ctx.textAlign='center';ctx.font='bold 15px monospace';ctx.fillStyle='#fff';ctx.shadowColor='#06101c';ctx.shadowBlur=2;
   ctx.fillText(c.temp.toFixed(1)+'°',x+35,y+61);ctx.shadowBlur=0;
  }
 });
 if(view==='HYBRID'||view==='NETWORK'){
  ctx.save();ctx.lineWidth=2.5;
  nodeLinks.forEach(([a,b])=>{
   const ax=(a%8+.5)*S,ay=(Math.floor(a/8)+.5)*S,bx=(b%8+.5)*S,by=(Math.floor(b/8)+.5)*S;
   const broken=grid[a].failed||grid[b].failed;
   ctx.strokeStyle=broken?'#ff505d':'#8be7ef';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=broken?8:4;
   ctx.setLineDash(broken?[6,5]:[]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle=broken?'#ff505d':'#d8ffff';ctx.beginPath();ctx.arc((ax+bx)/2,(ay+by)/2,4,0,Math.PI*2);ctx.fill();
  });ctx.restore();
 }
 grid.forEach((c,i)=>{
  if(c.type!=='UTILITY_HUB')return;
  const x=(i%8+.5)*S,y=(Math.floor(i/8)+.5)*S;
  ctx.save();ctx.shadowColor=c.failed?'#ff3e53':'#36c8a6';ctx.shadowBlur=3;
  ctx.fillStyle='#203338';ctx.strokeStyle=c.failed?'#ff4759':'#39b88b';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle='#fff';ctx.font='bold 12px Arial,sans-serif';ctx.textAlign='center';ctx.fillText(nodeLabels[i]||'UTIL',x,y+4);
 });
 const sx=(selected%8)*S,sy=Math.floor(selected/8)*S;
 ctx.strokeStyle='#9ce8ff';ctx.lineWidth=3;ctx.strokeRect(sx+2,sy+2,S-4,S-4);
 ctx.textAlign='start';
}
function render(){
 paint();const temps=grid.map(c=>c.temp),peak=Math.max(...temps),avg=temps.reduce((a,b)=>a+b,0)/64,failed=grid.filter(c=>c.failed).length;
 $('kpi-peak-temp').textContent=peak.toFixed(1)+'°C';$('kpi-avg-temp').textContent=avg.toFixed(1)+'°C';
 const totalNodes=Object.keys(nodeLabels).length;const resilience=calculateResilienceScore(totalNodes,failed,avg,safeTemp,maxPossibleTemp);
 $('kpi-resilience-val').textContent=resilience.toFixed(0)+'%';$('kpi-resilience-bar').style.width=resilience+'%';
 $('kpi-downtime-cost').textContent='$'+Math.round(loss).toLocaleString();
 $('kpi-downtime-cost').title='Actual simulated downtime cost: fixed charge per failed node plus escalation per outage minute. Heat exposure is tracked separately.';$('kpi-burn-rate').textContent=`Active Loss: $${Math.round(grid.reduce((sum,c,i)=>sum+(c.failed?(escalation[i]||280):0),0)).toLocaleString()} / min · Heat exposure impact: $${Math.round(heatExposureCost).toLocaleString()}`;
 $('peak-temp-badge').textContent=peak>48?'CRITICAL':peak>40?'WARNING':'NOMINAL';
 const c=grid[selected];$('inspect-icon').textContent=icons[c.type];$('inspect-name').textContent=c.type.replaceAll('_',' ');
 $('inspect-coord').textContent=`(${Math.floor(selected/8)}, ${selected%8})`;
 $('inspect-temp').textContent=c.temp.toFixed(1)+'°C';$('inspect-heat-flux').textContent=(effects[c.type]+light/255*7).toFixed(1)+' W/m²';
 $('inspect-albedo').textContent=({TREE_CANOPY:'.25',ASPHALT_ROAD:'.05',WATER_BODY:'.10'}[c.type]||'.20');
 $('inspect-thermal-mass').textContent=({WATER_BODY:'240',CONCRETE_SKYSCRAPER:'85'}[c.type]||'55')+' kJ';
 $('inspect-cooling-offset').textContent=Math.min(0,effects[c.type]).toFixed(1)+'°C';
 $('inspect-desc').textContent=`Educational model: ${c.type.replaceAll('_',' ').toLowerCase()} changes local heating and cooling.`;
 $('inspect-utility-status').style.display=c.type==='UTILITY_HUB'?'block':'none';
 $('inspect-util-name').textContent=nodeLabels[selected]||'Utility Hub';$('inspect-util-badge').textContent=c.failed?`TRIPPED (${c.failureCause})`:'NOMINAL';
 $('inspect-util-load').textContent=c.failed?'0 MW':calculateElectricLoad({baseLoad:baseLoads[selected]||18},c.temp,gamma,35).toFixed(1)+' MW';
 const shownEvents=eventLog.filter(e=>logFilter==='ALL'||e.type===logFilter);
 $('failure-log-list').replaceChildren();
 if(shownEvents.length){for(const e of shownEvents.slice(0,15)){const item=document.createElement('div');item.className='log-item badge-critical';item.textContent=`T+${e.time}s · ${e.message}`;$('failure-log-list').appendChild(item);}}else{$('failure-log-list').textContent='✓ No matching events recorded.';}
 $('ambient-val-label').textContent=ambient.toFixed(1)+'°C';$('wind-speed-label').textContent=wind.toFixed(1)+' m/s';
 $('microbit-raw-light').textContent=String(Math.round(light))+' / 255';$('solar-val-label').textContent=Math.round(light)+' / 255 (sensor level)';
 $('microbit-lux-val').textContent=Math.round(mapLightToSolarShock(light,0,1100))+' W/m² (estimated)';$('microbit-solar-shock-val').textContent='+'+mapLightToSolarShock(light,0,8.35).toFixed(2)+'°C';
 const leds=document.querySelectorAll('.microbit-led');leds.forEach((el,i)=>el.classList.toggle('on',i>=25-Math.round(light/255*25)));
 const spark=$('sparkline-canvas'),rect=spark.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 if(rect.width>0){spark.width=Math.round(rect.width*dpr);spark.height=Math.round(rect.height*dpr);const sc=spark.getContext('2d');sc.scale(dpr,dpr);sc.clearRect(0,0,rect.width,rect.height);sc.strokeStyle='#38b2ac';sc.lineWidth=2;sc.beginPath();history.forEach((v,i)=>{const x=i/Math.max(1,history.length-1)*rect.width,y=rect.height-clamp((v.avg-15)/55,0,1)*rect.height;i?sc.lineTo(x,y):sc.moveTo(x,y);});sc.stroke();sc.strokeStyle='#fb7185';sc.beginPath();history.forEach((v,i)=>{const x=i/Math.max(1,history.length-1)*rect.width,y=rect.height-clamp((v.peak-15)/55,0,1)*rect.height;i?sc.lineTo(x,y):sc.moveTo(x,y);});sc.stroke();}
}
function canvasIndex(e){const r=canvas.getBoundingClientRect();const x=clamp(Math.floor((e.clientX-r.left)*8/r.width),0,7),y=clamp(Math.floor((e.clientY-r.top)*8/r.height),0,7);return y*8+x;}
let dragging=false;
canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);const i=canvasIndex(e);selected=i;if(nodeLabels[i]&&brush!=='UTILITY_HUB'){selected=i;render();return;}grid[i].type=brush;grid[i].failed=false;grid[i].failureCause=null;grid[i].downTimeMinutes=0;step(0);});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const i=canvasIndex(e);selected=i;if(nodeLabels[i]&&brush!=='UTILITY_HUB'){selected=i;render();return;}grid[i].type=brush;grid[i].failed=false;grid[i].failureCause=null;grid[i].downTimeMinutes=0;step(0);});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('lostpointercapture',()=>dragging=false);
document.querySelectorAll('.palette-btn').forEach(b=>b.addEventListener('click',()=>{brush=b.dataset.brush;document.querySelectorAll('.palette-btn').forEach(x=>x.classList.toggle('active',x===b));}));
document.querySelectorAll('.view-toggle-btn').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelectorAll('.view-toggle-btn').forEach(x=>x.classList.toggle('active',x===b));render();}));
document.querySelectorAll('.speed-btn').forEach(b=>b.addEventListener('click',()=>{speed=num(b.dataset.speed)||1;document.querySelectorAll('.speed-btn').forEach(x=>x.classList.toggle('active',x===b));}));
$('btn-play-pause').addEventListener('click',()=>{paused=!paused;$('btn-play-pause').textContent=paused?'▶ Resume':'⏸ Pause';});
$('solar-slider').addEventListener('input',e=>{if(connected)return;light=clamp(num(e.target.value),0,255);step(0);});
$('ambient-slider').addEventListener('input',e=>{ambient=num(e.target.value);step(0);});
$('wind-speed-slider').addEventListener('input',e=>{wind=num(e.target.value);step(0);});
$('wind-dir-select').addEventListener('change',()=>step(0));
document.querySelectorAll('.log-filter-tab').forEach(b=>b.addEventListener('click',()=>{logFilter=b.dataset.filter;document.querySelectorAll('.log-filter-tab').forEach(x=>x.classList.toggle('active',x===b));render();}));
$('scenario-select').addEventListener('change',initialize);
$('btn-flashlight-burst').addEventListener('click',()=>{
 const previousLight=light;
 light=255;$('solar-slider').value=255;
 shockSeconds=12;shockAmplitude=18;
 eventLog.unshift({time:Math.round(elapsed),type:'WARNINGS',message:'Flashlight solar spike activated: +18°C target forcing, decaying over 12 simulation seconds.'});
 // A one-time sensor-driven temperature impulse, then diffusion advances normally.
 grid.forEach(c=>{if(c.type!=='WATER_BODY')c.temp=clamp(c.temp+mapLightToSolarShock(255,0,7)*0.60,10,85);});
 step(0);render();
 setTimeout(()=>{if(!connected&&light===255){light=previousLight;$('solar-slider').value=previousLight;render();}},3000);
});
$('btn-reset-grid').addEventListener('click',initialize);$('btn-reset-breakers').addEventListener('click',()=>{grid.forEach(c=>{c.failed=false;c.failureCause=null;c.downTimeMinutes=0;if(c.type==='UTILITY_HUB')c.temp=Math.min(c.temp,Math.min(40,(thresholds[grid.indexOf(c)]??48.5)-1));});eventLog.unshift({time:Math.round(elapsed),type:'WARNINGS',message:'Breakers reset; utility hub temperatures reduced for recovery'});render();});
function projectedTemperatureMap(testGrid){
 const solar=mapLightToSolarShock(light,0,7);
 return testGrid.map((c,i)=>{
  const x=i%8,y=Math.floor(i/8);
  const ns=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([xx,yy])=>xx>=0&&xx<8&&yy>=0&&yy<8).map(([xx,yy])=>testGrid[yy*8+xx].temp);
  const avg=ns.length?ns.reduce((a,b)=>a+b,0)/ns.length:c.temp;
  const target=ambient+solar+effects[c.type]*0.43;
  return clamp(updateCellTemperature(c.temp,ns,alpha,effects[c.type]*0.032+(target-c.temp)*0.038-wind*.012),10,85);
 });
}
$('btn-run-ai-optimizer').addEventListener('click',()=>{
 const planted=[];const costPerTree=1; // Relative unit cost; not a market price.
 for(let k=0;k<4;k++){
  let best=null;
  for(let i=0;i<grid.length;i++){
   if(['UTILITY_HUB','WATER_BODY','TREE_CANOPY'].includes(grid[i].type))continue;
   const roi=evaluateTreePlacementROI(grid,i,costPerTree,projectedGrid=>projectedTemperatureMap(projectedGrid).map(temp=>({temp})));
   if(!best||roi>best.roi)best={i,roi};
  }
  if(!best||best.roi<=0)break;
  grid[best.i].type='TREE_CANOPY';planted.push(best);
 }
 const panel=$('ai-recommendations-list');panel.replaceChildren();
 const item=document.createElement('div');item.className='ai-rec-card';
 const heading=document.createElement('strong');heading.textContent=planted.length+' canopy placements selected';item.appendChild(heading);
 const desc=document.createElement('span');desc.textContent=planted.length?planted.map(p=>`(${Math.floor(p.i/8)},${p.i%8}): ${p.roi.toFixed(3)} °C-cell per cost unit`).join(' · '):'No positive thermal ROI placements remain.';item.appendChild(desc);panel.appendChild(item);
 step(0);
});
$('btn-export-report').addEventListener('click',()=>{const data={model:'UrbanPulse reconstructed dynamic model (not original source)',scenario:$('scenario-select').value,grid,ambient,wind,light,estimatedLoss:loss};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='urbanpulse-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);});
[['btn-user-manual','modal-user-manual'],['btn-formulas-guide','modal-formulas-guide'],['btn-microbit-guide','modal-microbit-guide']].forEach(([btn,modal])=>$(btn)?.addEventListener('click',()=>$(modal)?.classList.add('open')));
[['btn-close-manual','modal-user-manual'],['btn-close-formulas','modal-formulas-guide'],['btn-close-guide','modal-microbit-guide']].forEach(([btn,modal])=>$(btn)?.addEventListener('click',()=>$(modal)?.classList.remove('open')));
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
$('btn-copy-firmware')?.addEventListener('click',()=>navigator.clipboard?.writeText($('firmware-code-block').textContent));
let sound=true;$('btn-sound-toggle').addEventListener('click',()=>{sound=!sound;$('btn-sound-toggle').textContent=sound?'🔔 Audio On':'🔕 Audio Off';});
// Sensor updates only update the environmental input. The 1 Hz simulation clock
// advances time, costs and temperatures; fast serial packets do not speed up time.
function applyMicrobitReading(packet){
 const candidate=typeof packet==='number'?packet:packet?.light ?? packet?.lightLevel ?? packet?.value;
 if(candidate===undefined || candidate===null || candidate==='')return false;
 const value=Number(candidate);
 if(!Number.isFinite(value)||value<0||value>255)return false;
 const previous=light;
 light=clamp(value,0,255);
 sensorLastLight=light;
 if(typeof packet==='object' && Number.isFinite(Number(packet.temp)))sensorTemp=Number(packet.temp);
 sensorPackets++;lastSensorAt=Date.now();
 $('solar-slider').value=String(Math.round(light));
 // A rapid flashlight increase adds a short-lived pulse, but ordinary changes
 // still enter the normal light-to-solar formula on every simulation tick.
 if(light-previous>=35){
   shockSeconds=8;
   shockAmplitude=Math.min(12,(light-previous)/255*12);
   eventLog.unshift({time:Math.round(elapsed),type:'WARNINGS',message:`micro:bit detected rapid light increase: ${Math.round(previous)} → ${Math.round(light)}/255`});
   eventLog=eventLog.slice(0,50);
 }
 $('hardware-status-details').textContent=`Live micro:bit · ${sensorPackets} readings${sensorTemp===null?'':` · chip ${sensorTemp}°C`}`;
 render();return true;
}
function parseSensorLine(line){
 const trimmed=line.trim();if(!trimmed)return false;
 try{return applyMicrobitReading(JSON.parse(trimmed));}
 catch{return applyMicrobitReading(Number(trimmed));}
}
$('btn-connect-microbit').addEventListener('click',async()=>{
 if(!('serial' in navigator)){
  alert('micro:bit USB requires Web Serial in Chrome or Edge on a compatible desktop computer. Mobile browsers usually cannot use this USB connection. Virtual sensor mode still works.');return;
 }
 if(connected)return;
 let reader;
 try{
  serialPort=await navigator.serial.requestPort();
  await serialPort.open({baudRate:115200});
  connected=true;reading=true;sensorPackets=0;lastSensorAt=Date.now();
  $('hardware-status-badge').textContent='● micro:bit Connected';
  $('hardware-status-badge').className='status-pill connected';
  $('hardware-status-details').textContent='Connected · waiting for sensor data';
  reader=serialPort.readable.getReader();
  const decoder=new TextDecoder();let buffer='';
  while(reading){
   const {value,done}=await reader.read();if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   if(buffer.length>8192)buffer=buffer.slice(-4096);
   const lines=buffer.split(/\r?\n/);buffer=lines.pop();
   for(const line of lines)parseSensorLine(line);
  }
 }catch(err){
  if(err.name!=='NotFoundError')alert('micro:bit connection issue: '+err.message+'\nCheck firmware, USB data cable, and that no other serial monitor is open.');
 }finally{
  reading=false;
  if(reader){try{reader.releaseLock();}catch{}}
  if(serialPort){try{await serialPort.close();}catch{}}
  serialPort=null;connected=false;
  $('hardware-status-badge').textContent='○ Virtual IoT Sensor Mode';
  $('hardware-status-badge').className='status-pill virtual';
  $('hardware-status-details').textContent='Simulated sensor';
 }
});
initialize();setInterval(()=>{
 if(connected&&Date.now()-lastSensorAt>5000){
  $('hardware-status-details').textContent='Connected · no data for 5s (check firmware)';
 }
 if(!paused)for(let n=0;n<speed;n++)step(1);
},1000);
