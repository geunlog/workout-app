const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync(__dirname+'/../app.js','utf8');
const block=code.match(/\/\/ SESSION_TIMING_START[\s\S]*?\/\/ SESSION_TIMING_END/)[0];
const sandbox={};vm.createContext(sandbox);vm.runInContext(block,sandbox);
if(process.env.WORKER_SOURCE){const worker=fs.readFileSync(process.env.WORKER_SOURCE,'utf8').match(/\/\/ SESSION_TIMING_START[\s\S]*?\/\/ SESSION_TIMING_END/)[0];assert.equal(block,worker);console.log('PASS exact frontend / Worker timing contract parity');}
for(const version of [1,2])for(const sets of [1,2,3,6,20])for(const reps of ['5','8~12','15–20']){
 sandbox.day={timingModel:version,exercises:[{name:'체스트 프레스',muscle:'가슴',sets,reps},{name:'원암 덤벨 로우',muscle:'등',sets,reps}]};
 const n=vm.runInContext('estimateSession(day)',sandbox);assert(Number.isInteger(n)&&n>0);
}
console.log('PASS 30 timing range/version combinations');
const html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8');
const hashes=JSON.parse(sw.match(/const ASSET_HASHES = (\{[^\n]*\});/)[1]);
for(const [file,hash] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/../'+file)).digest('hex'),hash);
const version=html.match(/workout-app-version" content="(\d+)"/)[1];assert(sw.includes(`v${version}-release-${version}`));assert(html.includes(`app.js?v=${version}`));console.log('PASS release/cache/resource versions and hashes');
// Run the real backup validators/operation builders with isolated storage fixtures.
function fn(name){const start=code.indexOf('  function '+name+'(');assert(start>=0,name);const end=code.indexOf('\n  }',start)+4;return code.slice(start,end);}
const muscles=['가슴','등','어깨','하체','삼두','이두','복근'];
const dataBox={MUSCLES:muscles,ROUTINE_KEYS:['mon','tue','wed','thu','fri','sat','sun'],AI_GOALS:{hypertrophy:1},AI_EXPERIENCE:{over3:1},ATHLETE_INFO_KEY:'athlete',readJSON:()=>({}),keyFor:(key,name)=>key+':'+name};vm.createContext(dataBox);
for(const name of ['normalizeRoutine','isRoutine','athleteInfo','validateProfilePayload','validateTransfer','athleteRestoreOperations','profileImportOperations'])vm.runInContext(fn(name),dataBox);
const backup={format:'workout-routine-transfer',version:1,athleteInfo:{goal:'hypertrophy',experience:'over3',preferences:'',excluded:'스쿼트',equipment:'덤벨만'},profile:{name:'테스트',routine:dataBox.ROUTINE_KEYS.map(key=>({key,title:'',letter:'월',cardio:false,ex:[]})),catalog:Object.fromEntries(muscles.map(m=>[m,[]])),logs:[],memos:[],draft:{}}};
dataBox.data=backup;vm.runInContext('validateTransfer(data)',dataBox);assert.equal(vm.runInContext('athleteRestoreOperations(data)[0].value.equipment',dataBox),'덤벨만');
dataBox.readJSON=()=>({goal:'hypertrophy',experience:'over3',preferences:'기존',excluded:'기존',equipment:'바벨'});assert.equal(vm.runInContext('athleteRestoreOperations(data).length',dataBox),0);
dataBox.readJSON=()=>({goal:'hypertrophy',experience:'',preferences:'기존',excluded:'',equipment:''});
for(const version of [1,2]){dataBox.data={...backup,version};const restored=vm.runInContext('athleteRestoreOperations(data)[0].value',dataBox);assert.equal(restored.preferences,'기존');assert.equal(restored.goal,'hypertrophy');assert.equal(restored.experience,'over3');assert.equal(restored.excluded,'스쿼트');assert.equal(restored.equipment,'덤벨만');}
console.log('PASS partial athlete restore fills empty fields only in v1/v2');
const legacy=structuredClone(backup);delete legacy.athleteInfo;legacy.profile.routine.pop();dataBox.data=legacy;vm.runInContext('validateTransfer(data)',dataBox);assert.equal(vm.runInContext('normalizeRoutine(data.profile.routine).length',dataBox),7);assert.equal(vm.runInContext('athleteRestoreOperations(data).length',dataBox),0);
dataBox.data={format:backup.format,version:2,profiles:[backup.profile],athleteInfo:backup.athleteInfo};vm.runInContext('validateTransfer(data)',dataBox);dataBox.data.athleteInfo.equipment='<script>';assert.throws(()=>vm.runInContext('validateTransfer(data)',dataBox));
console.log('PASS backup v1/v2 optional athlete info, missing-field compatibility, six-day normalization, existing settings protection, invalid import rejection');
vm.runInContext(block,dataBox);dataBox.statsOffset=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);dataBox.adjustmentWeek=date=>({from:dataBox.statsOffset(date,-((new Date(date+'T00:00:00Z').getUTCDay()+6)%7))});
vm.runInContext(fn('validateTemporary'),dataBox);vm.runInContext(fn('validateAiEditable'),dataBox);
dataBox.catalog={'가슴':[{n:'체스트 프레스'}]};dataBox.candidate={format:'workout-temporary-routine',version:1,weekStart:'2026-10-12',weekEnd:'2026-10-18',days:[{date:'2026-10-16',title:'가슴',timingModel:2,requestedMinutes:60,rest:false,exercises:[{name:'체스트 프레스',muscle:'가슴',sets:3,reps:'8~12',rir:'2'}]}]};
assert.equal(vm.runInContext("validateAiEditable(validateTemporary(candidate,'2026-10-16',false)).days[0].timingModel",dataBox),2);
dataBox.candidate.days[0].exercises[0].sets=20;assert.throws(()=>vm.runInContext("validateAiEditable(validateTemporary(candidate,'2026-10-16',false))",dataBox));
assert.throws(()=>vm.runInContext("validateTemporary(candidate,'2026-10-19',false)",dataBox));assert.equal(vm.runInContext("validateTemporary(candidate,'2026-10-19',true).version",dataBox),1);
const storage=new Map([['routine','original'],['athlete','old']]);dataBox.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(k==='athlete')throw new Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)};vm.runInContext(fn('storageTransaction'),dataBox);assert.equal(vm.runInContext("storageTransaction([{key:'routine',value:'changed'},{key:'athlete',value:'new'}])",dataBox),false);assert.equal(storage.get('routine'),'original');assert.equal(storage.get('athlete'),'old');
console.log('PASS temporary timing round-trip, edited time cap, expired-week application rejection, archive restore, failed storage rollback');
