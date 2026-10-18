import test from 'node:test';
import assert from 'node:assert/strict';
import {thermalColor,THERMAL_STOPS} from '../js/thermal-colors.js';
import {updateCellTemperature,mapLightToSolarShock,cascadeFailures,evaluateTreePlacementROI,calculateTotalEconomicLoss,calculateElectricLoad,calculateGridHealth} from '../js/formulas.js';

test('thermal color endpoints match the legend and temperatures transition continuously',()=>{
 assert.equal(thermalColor(22),'rgb(36,85,180)');
 assert.equal(thermalColor(65),'rgb(114,33,75)');
 assert.equal(thermalColor(-100),thermalColor(22));
 assert.equal(thermalColor(100),thermalColor(65));
 assert.ok(THERMAL_STOPS.every(([t],i)=>i===0||t>THERMAL_STOPS[i-1][0]));
 assert.notEqual(thermalColor(26),thermalColor(42));
});
test('diffusion moves a cold cell toward warmer neighbors',()=>{
 assert.equal(updateCellTemperature(20,[40,40,40,40],.2,0),24);
});
test('micro:bit 0..255 light mapping clamps and scales',()=>{
 assert.equal(mapLightToSolarShock(255,0,7),7);
 assert.equal(mapLightToSolarShock(0,0,1100),0);
 assert.equal(mapLightToSolarShock(203,0,1100),203/255*1100);
});
test('directed failures cascade to all downstream nodes, not upstream',()=>{
 const failed=cascadeFailures(new Set([18]),[[18,20],[20,27],[37,43]]);
 assert.deepEqual([...failed].sort((a,b)=>a-b),[18,20,27]);
});
test('tree ROI re-simulates a cloned grid and never mutates original',()=>{
 const grid=[{type:'ASPHALT_ROAD',temp:40},{type:'ASPHALT_ROAD',temp:42}];
 const predict=g=>g.map(c=>({temp:c.temp+(c.type==='TREE_CANOPY'?-3:2)}));
 assert.equal(evaluateTreePlacementROI(grid,0,2,predict),2.5);
 assert.equal(grid[0].type,'ASPHALT_ROAD');
});
test('downtime loss combines dispatch and elapsed duration',()=>{
 assert.equal(calculateTotalEconomicLoss([{baseCost:9000,escalationCost:1000,downTimeMinutes:3}]),12000);
});
test('electrical load rises above threshold only',()=>{
 assert.equal(calculateElectricLoad({baseLoad:20},30,.025,35),20);
 assert.equal(calculateElectricLoad({baseLoad:20},45,.025,35),25);
});
test('grid health decreases with hotspots and failures',()=>{
 const cool=Array.from({length:64},()=>({temp:30}));
 const hot=Array.from({length:64},()=>({temp:45}));
 assert.equal(calculateGridHealth(cool,6,0),100);
 assert.ok(calculateGridHealth(hot,6,0)<calculateGridHealth(cool,6,0));
 assert.ok(calculateGridHealth(hot,6,2)<calculateGridHealth(hot,6,0));
});
