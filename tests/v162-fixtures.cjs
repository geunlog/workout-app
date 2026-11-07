const date='2026-11-07';
function fixture(state='recorded'){
 const names=['레그 프레스','합성 긴 운동명 — 원암 덤벨 로우 (벤치 지지, 좌우 각각 수행)','체스트 프레스'];
 const routine=['mon','tue','wed','thu','fri','sat','sun'].map((key,i)=>({key,letter:'월화수목금토일'[i],title:'합성 테스트',cardio:false,ex:names.map((n,j)=>({uid:`audit-${i}-${j}`,n,m:['하체','등','가슴'][j],s:3,r:'8~12',rir:'2'}))}));
 const logs=state==='empty'?[]:[{date,dayKey:'sat',entries:names.flatMap((n,i)=>[0,1,2].map(j=>({id:`audit-${i}-${j}`,n,m:['하체','등','가슴'][i],w:String(40+5*j),reps:String(10+j)})))}];
 return {'bulk-routine-v9':routine,'bulk-routine-log-v1':logs,'bulk-exercise-notes-v1':[{n:names[0],m:'하체',body:'합성 메모\n줄바꿈 보존'}]};
}
// Explicit allowlist: everything else is protected, including unknown future keys.
const viewKeys=new Set(['bulk-routine-active-mode-v1','bulk-record-sort-v1','bulk-catalog-sort-v1']);
function splitStorage(raw){return {view:Object.fromEntries(Object.entries(raw).filter(([k])=>viewKeys.has(k))),protected:Object.fromEntries(Object.entries(raw).filter(([k])=>!viewKeys.has(k)))};}
module.exports={fixture,splitStorage,date};
