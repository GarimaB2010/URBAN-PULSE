/** UrbanPulse mathematical core. SI-inspired educational simulation, not calibrated forecasts. */
export const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
export function updateCellTemperature(currentTemp, neighborTemps, alpha, hType) {
  if (!neighborTemps.length) return currentTemp + hType;
  const avg = neighborTemps.reduce((sum,t)=>sum+t,0)/neighborTemps.length;
  return currentTemp + alpha*(avg-currentTemp)+hType;
}
export function mapLightToSolarShock(rawVal, sMin, sMax) {
  return sMin + clamp(Number(rawVal)||0,0,255)/255*(sMax-sMin);
}
export function evaluateNodeState(node, currentTemp) {
  node.state = currentTemp > node.maxThreshold ? 'Failed':'Active';
  return node.state;
}
export function propagateFailure(parentNode, downstreamNode, failurePenalty) {
  if(parentNode.state==='Failed') downstreamNode.temperature += failurePenalty;
  return downstreamNode.temperature;
}
export function getCityTotalTemperature(grid) {
  return grid.reduce((total,cell)=>total+cell.temp,0);
}
/** Recalculate a future thermal state for both candidates, rather than summing unchanged current temperatures. */
export function evaluateTreePlacementROI(grid, targetIndex, treeCost, predict) {
  if(!(treeCost>0)) throw new Error('treeCost must be positive');
  const before = getCityTotalTemperature(predict(grid));
  const alternative=grid.map(c=>({...c}));
  alternative[targetIndex].type='TREE_CANOPY';
  const after = getCityTotalTemperature(predict(alternative));
  return (before-after)/treeCost;
}
export function calculateTotalEconomicLoss(failedNodesArray) {
  return failedNodesArray.reduce((total,node)=>total+node.baseCost+node.escalationCost*node.downTimeMinutes,0);
}
export function calculateElectricLoad(node, currentTemp, gamma, threshold) {
  return node.baseLoad*(1+gamma*Math.max(0,currentTemp-threshold));
}
export function calculateResilienceScore(totalNodes,failedCount,avgTemp,safeTemp,maxPossibleTemp) {
  if(totalNodes<=0 || maxPossibleTemp<=0) return 0;
  const survival=1-failedCount/totalNodes;
  const thermal=1-Math.max(0,avgTemp-safeTemp)/maxPossibleTemp;
  return clamp(100*survival*thermal,0,100);
}

/** Propagate cascading shutdowns through a directed graph, without infinite loops. */
export function cascadeFailures(initialFailed, edges){
  const failed=new Set(initialFailed);
  let changed=true;
  while(changed){changed=false;for(const [source,target] of edges){if(failed.has(source)&&!failed.has(target)){failed.add(target);changed=true;}}}
  return failed;
}
