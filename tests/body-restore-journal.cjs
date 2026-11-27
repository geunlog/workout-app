const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('app.js','utf8');
const body=s.slice(s.indexOf('  const restoreJournalKey='),s.indexOf('  try{\n    if(localStorage.getItem(restoreJournalKey)'));
const journal='geunlog-body-restore-journal-v1';
const initial=[['bulk-plan','old'],['geunlog-body-overlay-v1','oldBody']];
const ops=[{key:'geunlog-body-overlay-v1',value:'newBody'},{key:'bulk-plan',value:'new'},{key:'bulk-extra',value:1}];
let state=new Map(initial),snapshots=[];
const ctx={scheduleWeeklySummary(){},localStorage:{getItem:k=>state.get(k)??null,setItem(k,v){state.set(k,v);snapshots.push(new Map(state));},removeItem(k){state.delete(k);snapshots.push(new Map(state));}}};
vm.runInNewContext(body,ctx);
ctx.storeFullRestore(ops);
const checkpoints=snapshots.slice();
for(const persisted of checkpoints.filter(m=>m.has(journal))){
 state=new Map(persisted);ctx.recoverBodyRestore();assert.deepEqual(state,new Map(initial));
}
state=new Map(checkpoints[1]);state.set('bulk-plan','independent');const concurrent=new Map(state);
assert.throws(()=>ctx.recoverBodyRestore());assert.deepEqual(state,concurrent);
console.log('PASS rollback at each persisted boundary; independent writes preserved on conflict');
