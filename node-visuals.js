// Consistent infrastructure status across network and land-cover views.
export function nodeAppearance(failed) {
 return failed
  ? {fill:'#772036',stroke:'#ff4759',landColor:'#8c203a',label:'OFFLINE'}
  : {fill:'#203338',stroke:'#39b88b',landColor:'#bb7c21',label:'ONLINE'};
}
export function failureCauseLabel(cause) {
 return cause==='THERMAL'?'Thermal limit exceeded'
  : cause?.startsWith('UPSTREAM ') ? `Dependency failure: ${cause}`
  : 'Dependency failure: upstream system';
}
