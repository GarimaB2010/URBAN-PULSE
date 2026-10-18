import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeAppearance,failureCauseLabel} from '../js/node-visuals.js';
test('failed nodes show red circle, red land tile and OFFLINE',()=>{
 const a=nodeAppearance(true);assert.equal(a.stroke,'#ff4759');assert.equal(a.landColor,'#8c203a');assert.equal(a.label,'OFFLINE');
});
test('healthy nodes show green circle',()=>{
 const a=nodeAppearance(false);assert.equal(a.stroke,'#39b88b');assert.equal(a.label,'ONLINE');
});
test('failure reasons distinguish thermal and cascade',()=>{
 assert.match(failureCauseLabel('THERMAL'),/Thermal/);assert.match(failureCauseLabel('UPSTREAM SUB-A'),/SUB-A/);
});
