/** Pure helpers for the UrbanPulse Event Stream. */
export function eventCounts(events){
 return {failureCount:events.filter(e=>e.type==='FAILURES').length,
 warningCount:events.filter(e=>e.type==='WARNINGS').length};
}
export function shouldRecordEvent(previous,current,elapsed){
 return !(previous && previous.type===current.type && previous.message===current.message && Math.abs(previous.time-elapsed)<2);
}
export function emergencyTransition(offlineCount,wasActive){
 const active=offlineCount>=5;
 return {active,started:active&&!wasActive,cleared:!active&&wasActive};
}
