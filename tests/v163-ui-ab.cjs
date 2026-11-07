// v162 actual-source A/B. Run in isolated PR CI; not Android IME.
// Run only in an approved isolated environment. No production URLs accepted.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {fixture,splitStorage}=require('./v162-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(__dirname,'../test-results/v163');fs.mkdirSync(out,{recursive:true});
const results={status:'NOT_RUN',samples:[],errors:[],android:'NOT_RUN',keyboard:'reduced viewport is not Android IME',environment:{node:process.version}};
const cp=require('child_process'),os=require('os');const baseline='da7a19eb257764dd6f02e548b8611cd5c7d31f4d',original=fs.mkdtempSync(path.join(os.tmpdir(),'v162-A-'));for(const f of ['index.html','app.js','style.css','sw.js','manifest.webmanifest'])fs.writeFileSync(path.join(original,f),cp.execFileSync('git',['show',baseline+':'+f],{maxBuffer:5e6}));let currentRoot=root;
const server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname;const file=path.resolve(currentRoot,'.'+(rel==='/'?'/index.html':rel));if(!file.startsWith(currentRoot+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function main(){let browser;try{
 const pw=process.env.PLAYWRIGHT_MODULE?require(path.resolve(process.env.PLAYWRIGHT_MODULE)):require('playwright');
 // No guessed browser path. Caller supplies a supported path or installed Playwright browser.
 browser=await pw.chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 results.environment.browser=browser.version();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 for(const width of [320,360,390,430])for(const state of ['empty','recorded'])for(const arm of ['A','B']){
  currentRoot=arm==='A'?original:root;const sample={width,state,arm,status:'RUNNING',steps:[]};results.samples.push(sample);
  const ctx=await browser.newContext({viewport:{width,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'});
  try{await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await ctx.addInitScript(f=>{if(sessionStorage.getItem('audit-seeded'))return;for(const [k,v]of Object.entries(f))localStorage.setItem(k,JSON.stringify(v));sessionStorage.setItem('audit-seeded','1');},fixture(state));
   const p=await ctx.newPage();p.setDefaultTimeout(6000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.clock.install({time:new Date('2026-11-07T12:00:00+09:00')});await p.goto('http://127.0.0.1:'+server.address().port);

   const raw=()=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
   const baseline=splitStorage(await raw()).protected;
   async function geometry(label){let g=await p.evaluate(()=>{const rect=e=>{let b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};const cards=[...document.querySelectorAll('#dayPanel .ex-row')],nav=document.querySelector('#modeToggle'),modal=document.querySelector('.direct-record-modal');return {scrollY,viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth+1,cards:cards.map(rect),nav:rect(nav),buttons:[...document.querySelectorAll('#dayPanel .btn-record-one,.direct-record-close,.recent-history-all')].filter(e=>e.checkVisibility()).map(e=>({label:e.textContent,disabled:e.disabled,...rect(e)})),inputs:[...document.querySelectorAll('#dayPanel .in-weight,#dayPanel .in-done')].map(rect),modal:modal?rect(modal):null,modalScroll:modal?modal.scrollHeight-modal.clientHeight:null,headerHeight:document.querySelector('#dayPanel').getBoundingClientRect().top+scrollY,exerciseListHeight:document.querySelector('#dayPanel .exercise-list').getBoundingClientRect().height,thirdScroll:cards[2]?Math.max(0,cards[2].getBoundingClientRect().bottom+scrollY-(innerHeight-nav.getBoundingClientRect().height)):null};});sample.steps.push({label,...g});await p.screenshot({path:path.join(out,`${arm}-${width}-${state}-${label}.png`),fullPage:true});assert(!g.overflow,'horizontal overflow');if(label==='main')assert(g.buttons.filter(b=>b.label.includes('저장')).every(b=>b.height>=48),'save minimum 48');}
   await geometry('main');assert.equal(await p.locator('#dayPanel .ex-row').count(),3);
   // Synthetic input drafts may change, but logs/routine/notes must not until Save.
   await p.locator('#dayPanel .in-weight').first().fill('60');await p.locator('#dayPanel .in-done').first().fill('10');
   const afterInput=splitStorage(await raw()).protected;
   for(const [k,v] of Object.entries(baseline))if(!k.startsWith('bulk-routine-draft-v2'))assert.equal(afterInput[k],v,'protected '+k);
   const logBefore=JSON.parse(afterInput['bulk-routine-log-v1']||'[]'),count=rows=>rows.reduce((n,r)=>n+r.entries.length,0);
   await p.locator('#dayPanel .btn-record-one').first().click();const saved=splitStorage(await raw()).protected,logs=JSON.parse(saved['bulk-routine-log-v1']);
   assert.equal(count(logs),count(logBefore)+1,'one explicit save creates one set');
   assert.equal(saved['bulk-routine-v9'],afterInput['bulk-routine-v9']);assert.equal(saved['bulk-exercise-notes-v1'],afterInput['bulk-exercise-notes-v1']);
   sample.saveDelta=1;await geometry('saved');
   // Both edit counts use original runtime with synthetic fixtures; no API calls.
   const beforeEdit=splitStorage(await raw()).protected;
   await p.locator('#btnRoutineEdit').click();await geometry('edit3');
   assert(await p.locator('#dayPanel .move-up').first().isDisabled());
   assert(await p.locator('#dayPanel .move-down').last().isDisabled());
   const orderBefore=await p.locator('#dayPanel .in-name').evaluateAll(es=>es.map(e=>e.value));
   await p.locator('#dayPanel .move-down').first().click();
   const orderAfter=await p.locator('#dayPanel .in-name').evaluateAll(es=>es.map(e=>e.value));
   assert.deepEqual(orderAfter,[orderBefore[1],orderBefore[0],orderBefore[2]]);
   assert.equal((await raw())['bulk-routine-v9'],beforeEdit['bulk-routine-v9'],'reorder not saved before explicit Save');
   await p.locator('#btnSaveNow').click();
   await p.locator('#btnRoutineEdit').click();
   assert.deepEqual(await p.locator('#dayPanel .in-name').evaluateAll(es=>es.map(e=>e.value)),orderAfter);
   await p.locator('#btnRoutineEdit').click();
   // Restore only isolated synthetic routine so recent-history target remains first.
   await p.evaluate(r=>localStorage.setItem('bulk-routine-v9',r),beforeEdit['bulk-routine-v9']);
   await p.reload();
   const trigger=p.locator('#dayPanel .history-tappable').first();await trigger.click();await p.locator('.direct-record-modal').waitFor({state:'visible'});
   const recent=await p.locator('.recent-history-list').innerText();sample.recentText=recent;assert(recent.includes('60kg'),'saved value visible');

   await geometry('recent');const beforeNavigation=splitStorage(await raw()).protected;
   await p.locator('.recent-history-all').click();await p.locator('.direct-record-modal').waitFor({state:'detached'});
   assert.equal(await p.locator('[data-records-view=exercise]').getAttribute('aria-selected'),'true');assert.deepEqual(splitStorage(await raw()).protected,beforeNavigation);
   sample.internalNavigation=true;
   // Eight exercises: re-seed synthetic local routine, return to workout via saved UI state.
   await p.evaluate(()=>{const r=JSON.parse(localStorage.getItem('bulk-routine-v9'));r.forEach(d=>{d.ex=Array.from({length:8},(_,i)=>({...d.ex[i%3],uid:'eight-'+d.key+'-'+i}));});localStorage.setItem('bulk-routine-v9',JSON.stringify(r));localStorage.setItem('bulk-routine-active-mode-v1',JSON.stringify('day'));});
   await p.reload();await p.locator('#modeToggle [aria-controls=dayView]').click();await p.locator('#btnRoutineEdit').click();await geometry('edit8');
   assert.equal(await p.locator('#dayPanel .ex-row').count(),8);
   if(arm==='B'){const targets=await p.locator('#dayPanel .reorder-step,#dayPanel .btn-del,#dayPanel .exercise-note-button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}));assert(targets.every(([w,h])=>w>=44&&h>=44));}
   assert.deepEqual(errors,[]);sample.status='PASS';
  }catch(e){sample.status='FAIL';sample.error=e.stack;throw e;}finally{await ctx.close();}
 }
 results.status='PASS';
}catch(e){results.status=results.samples.length?'FAIL':'BLOCKED';results.errors.push(e.stack);process.exitCode=1;}finally{if(browser)await browser.close();if(server.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}}
main();
