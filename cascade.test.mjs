import test from 'node:test';
import assert from 'node:assert/strict';
import {cascadeFailures,calculateTotalEconomicLoss,updateCellTemperature,mapLightToSolarShock} from '../js/formulas.js';
test('directed cascading reaches downstream but not upstream',()=>{const failed=cascadeFailures([1],[[1,2],[2,3],[4,1]]);assert.deepEqual([...failed].sort(),[1,2,3]);});
test('cascade handles cycles',()=>assert.deepEqual([...cascadeFailures([1],[[1,2],[2,1]])].sort(),[1,2]));
test('fixed cost and escalating minutes',()=>assert.equal(calculateTotalEconomicLoss([{baseCost:500,escalationCost:100,downTimeMinutes:3}]),800));
test('diffusion responds to hotter neighbors',()=>assert.equal(updateCellTemperature(30,[40,40,40,40],0.2,0),32));
test('sensor mapping clamps 0..255',()=>assert.equal(mapLightToSolarShock(500,0,8),8));
