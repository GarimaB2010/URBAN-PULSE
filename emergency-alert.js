/** Threshold for city-wide emergency, based on six fixed critical infrastructure nodes. */
export const CRITICAL_NODE_COUNT=6;
export const MASS_OUTAGE_THRESHOLD=5;
export function massOutageTransition(offlineCount,previouslyActive){
 const active=offlineCount>=MASS_OUTAGE_THRESHOLD;
 return {active,started:active&&!previouslyActive,cleared:!active&&previouslyActive};
}
