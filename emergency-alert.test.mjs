import test from 'node:test';
import assert from 'node:assert/strict';
import {massOutageTransition, MASS_OUTAGE_THRESHOLD,CRITICAL_NODE_COUNT} from '../js/emergency-alert.js';
test('threshold triggers exactly at five offline nodes',()=>{
 assert.equal(CRITICAL_NODE_COUNT,6);
 assert.equal(MASS_OUTAGE_THRESHOLD,5);
 for(let n=0;n<5;n++) assert.equal(massOutageTransition(n,false).started,false);
 assert.equal(massOutageTransition(5,false).started,true);
 assert.equal(massOutageTransition(6,false).started,true);
});
test('no duplicate emergency while already active',()=>{
 assert.equal(massOutageTransition(6,true).started,false);
});
test('alert clears after recovery and can trigger again',()=>{
 assert.equal(massOutageTransition(4,true).cleared,true);
 assert.equal(massOutageTransition(5,false).started,true);
});
