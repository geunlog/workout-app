// Real UI, isolated synthetic storage, outbound requests blocked. No personal data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('playwright');const root=path.resolve(process.env.AB_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.AB_OUT||path.join(__dirname,'../test-results'));fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const f=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^[\w.-]+$/.test(f)){res.writeHead(404).end();return;}try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(path.join(root,f)));}catch{res.writeHead(404).end();}});
let groups=0;const evidence=[],keys=['mon','tue','wed','thu','fri','sat','sun'],name='시티드 케이블 오버헤드 익스텐션(EZ바)';
function pass(s){console.log('PASS '+s);groups++;}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});try{
for(const width of [320,360,390,430])for(const scenario of ['empty','partial','full']){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});let external=0,blockedFonts=0;await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();if(['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(r.request().url()).hostname)&&['stylesheet','font'].includes(r.request().resourceType()))blockedFonts++;else external++;return r.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(({scenario,keys,name})=>{
 localStorage.setItem('bulk-routine-v9',JSON.stringify(keys.map((key,i)=>({key,letter:['월','화','수','목','금','토','일'][i],title:'기존 '+key,cardio:false,ex:scenario==='empty'||scenario==='partial'&&i!==1?[]:[{uid:'old-'+key,n:name,m:'삼두',s:3,r:'8~12',rir:'2'},...(scenario==='full'?[{uid:'second-'+key,n:'시티드 케이블 푸시다운(로프)',m:'삼두',s:2,r:'12',rir:'3'}]:[])]}))));
 localStorage.setItem('bulk-routine-log-v1',JSON.stringify([{date:'2026-10-01',dayKey:'mon',entries:[{id:'private-record',n:name,m:'삼두',w:'30',reps:'8'}]}]));
 localStorage.setItem('geunlog-athlete-info-v1',JSON.stringify({goal:'hypertrophy',experience:'one3',equipment:'덤벨',excluded:'',preferences:''}));
 localStorage.setItem('bulk-routine-memos-v1',JSON.stringify([{title:'private memo',body:'DO_NOT_EXPORT_MEMO'}]));
 localStorage.setItem('bulk-exercise-notes-v1',JSON.stringify([{m:'삼두',n:name,body:'DO_NOT_EXPORT_NOTE'}]));
 const d=new Date(Date.now()+9*3600000),date=d.toISOString().slice(0,10),start=new Date(date+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);
 localStorage.setItem('bulk-workout-temporary-v1',JSON.stringify({format:'workout-temporary-routine',version:1,weekStart:start.toISOString().slice(0,10),weekEnd:end.toISOString().slice(0,10),days:[{date,title:'임시 보존',rest:false,exercises:[{name,muscle:'삼두',sets:2,reps:'10',rir:'2'}]}]}));
 },{scenario,keys,name});await page.reload();
 await page.evaluate(()=>{window.copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
 const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
 async function open(){await page.locator('#btnRoutineEdit').click();await page.locator('#btnAiMenu').click();await page.locator('#btnBaseChatGPT').click();}
 const openedAt=performance.now();await open();const openMs=performance.now()-openedAt;const survey=page.locator('.ai-base-survey');await survey.locator('[data-day-chip="0"]').click();await survey.locator('[data-day-chip="2"]').click();

 const isB=!!(await survey.locator('.exchange-show-days').count());
 await survey.locator('.exchange-advanced summary').click();
 for(const [field,value] of Object.entries({equipment:'덤벨·케이블',preferences:'푸시다운',excluded:'딥스',required:name}))await survey.locator('[data-exchange-field="'+field+'"]').fill(value);
 await survey.locator('.exchange-advanced summary').click();
 if(isB){assert.equal(await survey.locator('[data-base-day]:visible').count(),2);assert((await survey.locator('[data-advanced-summary]').textContent()).includes('필수:'));}
 const before=await snapshot();
 const geometry=()=>survey.evaluate(d=>{const b=d.querySelector('.temporary-dialog-body');return {scrollHeight:b.scrollHeight,clientHeight:b.clientHeight,scrollRange:b.scrollHeight-b.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth,modalOverflow:b.scrollWidth>b.clientWidth};});
 const initial=await geometry();
 if(!isB)await survey.locator('.ai-day-details summary').click();
 const editing=await geometry();await survey.evaluate(d=>d.querySelector('.temporary-dialog-body').scrollTop=0);await survey.screenshot({path:path.join(out,`v159-${process.env.AB_LABEL}-${width}-${scenario}-survey.png`)});
 const copiedAt=performance.now();await survey.locator('[data-exchange-copy]').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const copyMs=performance.now()-copiedAt;
 const prompt=await survey.locator('[data-exchange-prompt]').inputValue();
 const normalized=prompt.replace(/"requestId": "[^"]+"/g,'"requestId": "FIXED"');
 const after=await geometry();assert.deepEqual(await snapshot(),before);
 // Navigation changes visibility only; neither values nor the request identity are regenerated.
 await survey.locator('.exchange-conditions summary').first().click();
 assert.equal(await survey.locator('[data-exchange-field="required"]').inputValue(),name);
 await survey.locator('.exchange-conditions summary').first().click();
 assert.equal(await survey.locator('[data-exchange-prompt]').inputValue(),prompt);
 const start=prompt.indexOf('[반환 형식]\n')+'[반환 형식]\n'.length,end=prompt.indexOf('\n[사용자가');
 const json=JSON.parse(prompt.slice(start,end));for(const d of json.days){d.title='검토 '+d.key;d.exercises=[{name,muscle:'삼두',sets:4,reps:'10~12',rir:'2'}];}
 await survey.locator('[data-exchange-json]').fill(JSON.stringify(json));
 const previewAt=performance.now();await survey.locator('[data-exchange-preview]').click();const preview=page.locator('.ai-base-preview');await preview.waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const previewMs=performance.now()-previewAt;
 const result=await preview.evaluate(d=>{const b=d.querySelector('.temporary-dialog-body');return {scrollHeight:b.scrollHeight,clientHeight:b.clientHeight,scrollRange:b.scrollHeight-b.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth,modalOverflow:b.scrollWidth>b.clientWidth};});
 if(isB){assert.equal(await preview.locator('.exchange-analysis').getAttribute('open'),null);assert((await preview.locator('.exchange-result-summary').textContent()).includes('2일'));assert.equal(await preview.locator('.base-exchange-diff').getAttribute('open'),null);}
 if(isB){
  const details=preview.locator('.exchange-analysis');await details.locator('summary').first().click();
  await preview.locator('[data-day="0"] [data-ex-sets]').first().fill('5');await preview.locator('[data-day="0"] [data-ex-sets]').first().press('Tab');
  assert((await preview.locator('.exchange-result-summary').textContent()).includes('5세트'));
  assert.equal(await preview.locator('.exchange-analysis').getAttribute('open'),'');
  await preview.locator('.exchange-analysis>summary').click();
  await preview.locator('[data-day="0"] [data-ex-sets]').first().fill('4');await preview.locator('[data-day="0"] [data-ex-sets]').first().press('Tab');
 }
 assert.deepEqual(await snapshot(),before);
 await preview.evaluate(d=>d.querySelector('.temporary-dialog-body').scrollTop=0);
 await preview.screenshot({path:path.join(out,`v159-${process.env.AB_LABEL}-${width}-${scenario}-preview.png`)});
 evidence.push({width,scenario,initial,editing,after,result,openMs,copyMs,previewMs,prompt:normalized,storageUnchanged:true,externalRequests:external,errors});
 assert.equal(external,0);assert.deepEqual(errors,[]);assert(!initial.overflow&&!after.overflow&&!result.overflow&&!result.modalOverflow);
 await context.close();
}
fs.writeFileSync(path.join(out,'v159-ab-'+process.env.AB_LABEL+'.json'),JSON.stringify(evidence,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
