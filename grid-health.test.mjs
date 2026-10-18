import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateGridHealth} from '../js/formulas.js';
const city = temp => Array.from({length:64},()=>({temp}));
test('safe city is 100%',()=>assert.equal(calculateGridHealth(city(30),6,0),100));
test('hot city loses average heat and hotspot points',()=>assert.ok(calculateGridHealth(city(45),6,0)<60));
test('one failure reduces health',()=>assert.ok(calculateGridHealth(city(30),6,1)<100));
test('hotspots reduce health despite moderate average',()=>{const g=city(30);g[0].temp=55;assert.ok(calculateGridHealth(g,6,0)<100)});
test('score bounded',()=>{assert.equal(calculateGridHealth(city(90),6,6),0);assert.equal(calculateGridHealth(city(30),6,0),100)});
