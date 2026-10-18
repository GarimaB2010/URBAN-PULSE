import test from 'node:test';
import assert from 'node:assert/strict';
import {eventCounts,shouldRecordEvent,emergencyTransition} from '../js/event-logic.js';
test('failure and warning counts reflect log contents',()=>{
 assert.deepEqual(eventCounts([{type:'INFO'},{type:'FAILURES'},{type:'FAILURES'},{type:'WARNINGS'}]),{failureCount:2,warningCount:1});
});
test('duplicate event suppressed only within time window',()=>{
 const prev={type:'FAILURES',message:'SUB-A OFFLINE',time:5};
 assert.equal(shouldRecordEvent(prev,{type:'FAILURES',message:'SUB-A OFFLINE'},6),false);
 assert.equal(shouldRecordEvent(prev,{type:'FAILURES',message:'SUB-A OFFLINE'},8),true);
 assert.equal(shouldRecordEvent(prev,{type:'INFO',message:'SUB-A RESTORED'},6),true);
});
test('emergency starts at five and clears on recovery',()=>{
 assert.deepEqual(emergencyTransition(5,false),{active:true,started:true,cleared:false});
 assert.deepEqual(emergencyTransition(6,true),{active:true,started:false,cleared:false});
 assert.deepEqual(emergencyTransition(4,true),{active:false,started:false,cleared:true});
});
