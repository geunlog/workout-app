// Actual v164/v165, synthetic data, isolated Chromium. Reduced viewport is NOT Android IME.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),cp=require('child_process'),os=require('os');
const {fixture,splitStorage}=require('./v162-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/v164');fs.mkdirSync(out,{recursive:true});
const original=fs.mkdtempSync(path.join(os.tmpdir(),'v164-A-'));
for(const f of ['index.html','app.js','style.css','sw.js','manifest.webmanifest'])fs.writeFileSync(path.join(original,f),cp.execFileSync('git',['show','4e3c271cc067795fe03498e41fb823f4aca6e8a7:'+f],{maxBuffer:5e6}));
let currentRoot=root;const server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname,f=path.resolve(currentRoot,'.'+(rel==='/'?'/index.html':rel));if(!f.startsWith(currentRoot+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
const results={status:'NOT_RUN',samples:[],android:'NOT_RUN',IME:'NOT_RUN',environment:{node:process.version,viewportHeight:844,samplesPerCondition:1}};
async function main(){let browser;try{
 browser=await require('playwright').chromium.launch();results.environment.browser=browser.version();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 for(const width of [320,360,390,430])for(const state of ['empty','recorded'])for(const arm of ['A','B']){
  currentRoot=arm==='A'?original:root;const sample={width,state,arm,status:'RUNNING',geometry:{}};results.samples.push(sample);
  const ctx=await browser.newContext({viewport:{width,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'});
  try{
   await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await ctx.addInitScript(f=>{if(sessionStorage.getItem('seed'))return;for(const[k,v]of Object.entries(f))localStorage.setItem(k,JSON.stringify(v));sessionStorage.setItem('seed','1');},Object.assign(fixture(state),{'bulk-routine-catalog-shared-v1':{가슴:[{n:'체스트 프레스'},{n:'유사 프레스'},{n:'유사 프레스 덤벨'}],등:[{n:'합성 긴 운동명 — 원암 덤벨 로우 (벤치 지지, 좌우 각각 수행)'},{n:'유사 프레스'}],하체:[{n:'레그 프레스'}],어깨:[],삼두:[],이두:[],복근:[]}}));
   const p=await ctx.newPage();p.setDefaultTimeout(6000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date('2026-11-07T12:00:00+09:00')});await p.goto('http://127.0.0.1:'+server.address().port);
   const raw=()=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
   const initial=splitStorage(await raw()).protected;
   async function measure(label){sample.geometry[label]=await p.evaluate(()=>{const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};const c=[...document.querySelectorAll('#dayPanel .ex-row')],nav=document.querySelector('#modeToggle');return{cards:c.map(rect),firstY:c[0].getBoundingClientRect().top+scrollY,thirdScroll:Math.max(0,c[2].getBoundingClientRect().bottom+scrollY-(innerHeight-nav.getBoundingClientRect().height)),overflow:document.documentElement.scrollWidth>innerWidth+1,save:rect(document.querySelector('#dayPanel .btn-record-one')),popup:rect(document.querySelector('.direct-record-modal')),ai:rect(document.querySelector('#aiQuickMenu'))};});assert(!sample.geometry[label].overflow,'horizontal overflow '+label);await p.screenshot({path:path.join(out,`${arm}-${width}-${state}-${label}.png`),fullPage:true});}
   await measure('main');assert(sample.geometry.main.save.height>=48);
   const card=p.locator('#dayPanel .ex-row').first();await card.locator('.in-weight').fill('60');await card.locator('.in-done').fill('10');
   const beforeSave=await raw();for(const[k,v]of Object.entries(initial))if(!k.includes('draft'))assert.equal(beforeSave[k],v,'input preserves '+k);
   await card.locator('.btn-record-one').click();const after=await raw();const count=s=>JSON.parse(s||'[]').reduce((n,r)=>n+r.entries.length,0);assert.equal(count(after['bulk-routine-log-v1']),count(initial['bulk-routine-log-v1'])+1);
   assert.equal(after['bulk-routine-v9'],initial['bulk-routine-v9']);assert.equal(after['bulk-exercise-notes-v1'],initial['bulk-exercise-notes-v1']);
   if(arm==='B')assert.equal(await card.locator('.exercise-saved-count').innerText(),state==='recorded'?'4/3 저장':'1/3 저장');
   await measure('saved');await p.locator('#btnRoutineEdit').click();await measure('edit');assert(sample.geometry.edit.cards.every(c=>c.height<=184),'preserve three-row edit cards');
   await p.locator('#btnAiMenu').click();await measure('ai');assert.equal(await p.locator('#aiQuickMenu .ai-day-actions button').count(),4);const touch=await p.locator('#aiQuickMenu button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height]}));assert(touch.every(([w,h])=>w>=44&&h>=44));await p.locator('[data-ai-menu-close]').click();await p.locator('#btnRoutineEdit').click();
   const protectedBefore=splitStorage(await raw()).protected;
   await p.locator('#btnDirectRecord').click();const modal=p.locator('.direct-record-modal'),search=modal.locator('input[type=search]'),muscle=modal.locator('select');
   await measure('direct');await muscle.selectOption('');await search.fill('프레스');
   sample.searchCount=await modal.locator('small[role=status]').innerText();
   const oldOptions=(await p.locator('#directRecordExerciseList option').count())?await p.locator('#directRecordExerciseList option').evaluateAll(es=>es.map(e=>({name:e.value,muscle:e.label}))):await p.locator('.direct-search-option').evaluateAll(es=>es.map(e=>({name:e.querySelector('span').textContent,muscle:e.querySelector('small').textContent})));
   sample.searchOptions=oldOptions;assert(oldOptions.length>1);await measure('search');
   if(arm==='B'){
    const a=results.samples.find(s=>s.width===width&&s.state===state&&s.arm==='A');assert.deepEqual(oldOptions,a.searchOptions,'identical filter/order');
    const dims=await p.locator('.direct-search-option').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));assert(dims.every(d=>d.w>=44&&d.h>=44));assert(dims.slice(1).every((d,i)=>d.y>=dims[i].y+dims[i].h-1));sample.listDirection='vertical';
    sample.visibleCandidates=await p.locator('.direct-search-results').evaluate(e=>{const r=e.getBoundingClientRect();return[...e.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().bottom<=r.bottom+1).length});
    await p.locator('.direct-search-option').first().click();assert.equal(await search.inputValue(),oldOptions[0].name);assert(await p.locator('.direct-search-results').isHidden());
    await muscle.selectOption('');await search.fill('없는 합성 신규 운동');assert.equal(await p.locator('.direct-search-option').count(),0);assert(await modal.locator('.direct-record-custom-note').isVisible());
    await search.fill('');await muscle.selectOption('');assert((await p.locator('.direct-search-option').count())>1);
    await search.fill('합성 긴 운동명');assert.equal(await p.locator('.direct-search-option').count(),1);assert((await p.locator('.direct-search-option').innerText()).includes('좌우 각각 수행'));
    await p.setViewportSize({width,height:420});await search.focus();await p.clock.runFor(400);await search.evaluate(e=>e.scrollIntoView({block:'nearest'}));
    assert(await search.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'search reachable reduced viewport');
    await p.locator('.direct-search-option').click();await modal.locator('input[type=number]').last().fill('8');await modal.locator('button[type=submit]').scrollIntoViewIfNeeded();
    sample.reducedTrace=[];
    async function traceSave(label){sample.reducedTrace.push(await modal.evaluate((m,label)=>{const b=m.querySelector('button[type=submit]'),r=b.getBoundingClientRect(),o=m.parentElement;return{label,button:{top:r.top,bottom:r.bottom,height:r.height},innerHeight,visualHeight:visualViewport.height,overlayHeight:o.style.height,modalTop:m.getBoundingClientRect().top,modalBottom:m.getBoundingClientRect().bottom,scrollTop:m.scrollTop,scrollHeight:m.scrollHeight,clientHeight:m.clientHeight,active:document.activeElement.outerHTML};},label));}
    await traceSave('immediate');
    await p.clock.runFor(600);
    await traceSave('after-focus-timer');
    await modal.locator('button[type=submit]').scrollIntoViewIfNeeded();
    await traceSave('after-user-scroll');
    assert(await modal.locator('button[type=submit]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'save reachable reduced viewport');await measure('reduced');await p.setViewportSize({width,height:844});
   }
   await modal.locator('.direct-record-close').click();assert(await p.locator('#btnDirectRecord').evaluate(e=>document.activeElement===e));assert.deepEqual(splitStorage(await raw()).protected,protectedBefore,'cancel protects all stored data');
   await p.locator('#btnDirectRecord').click();await modal.locator('input[type=search]').fill('새 합성 운동');await modal.locator('select').selectOption('가슴');await modal.locator('input[type=number]').first().fill('35');await modal.locator('input[type=number]').last().fill('9');
   await modal.locator('button[type=submit]').click();await modal.waitFor({state:'detached'});const custom=await raw();assert.equal(count(custom['bulk-routine-log-v1']),count(protectedBefore['bulk-routine-log-v1'])+1);for(const[k,v]of Object.entries(protectedBefore))if(k!=='bulk-routine-log-v1'&&!k.includes('draft'))assert.equal(custom[k],v,'custom name does not change '+k);
   sample.actions={setSave:1,openDirect:1,searchInput:1,selectCandidate:1};assert.deepEqual(errors,[]);sample.status='PASS';
  }catch(e){sample.status='FAIL';sample.error=e.stack;throw e;}finally{await ctx.close();}
 }
 results.status='PASS';
}catch(e){results.status='FAIL';results.error=e.stack;process.exitCode=1;}finally{if(browser)await browser.close();if(server.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}}
main();
