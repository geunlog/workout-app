// Isolated event-order reproduction before broader browser regressions.
const fs=require('fs'),path=require('path'),http=require('http'),cp=require('child_process'),assert=require('assert/strict');
const {chromium}=require('playwright'),{fixture}=require('./v162-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/search-event');fs.mkdirSync(out,{recursive:true});
const old=cp.execFileSync('git',['show','6485f973831ab97bd2010e2e5d46bb143dc1cd53:app.js'],{encoding:'utf8',maxBuffer:5e6});let arm='before';
const server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname,f=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(f.endsWith('/app.js')&&arm==='before'?old:fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{let browser;const result={status:'NOT_RUN',samples:[],android:'NOT_RUN'};try{
 browser=await chromium.launch();result.browser=browser.version();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 for(arm of ['before','candidate']){
  const c=await browser.newContext({viewport:{width:320,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'});
  try{await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await c.addInitScript(f=>{for(const[k,v]of Object.entries(f))localStorage.setItem(k,JSON.stringify(v));},Object.assign(fixture('empty'),{'bulk-routine-catalog-shared-v1':{가슴:[{n:'유사 프레스'},{n:'체스트 프레스'}],등:[{n:'유사 프레스'}],하체:[{n:'레그 프레스'}],어깨:[],삼두:[],이두:[],복근:[]}}));
   const p=await c.newPage();await p.clock.install({time:new Date('2026-11-07T12:00:00+09:00')});await p.goto('http://127.0.0.1:'+server.address().port);await p.locator('#btnDirectRecord').click();await p.locator('.direct-record-form input[type=search]').fill('프레스');
   await p.evaluate(()=>{window.__events=[];let n=0;const ids=new WeakMap(),id=e=>{if(!e)return null;if(!ids.has(e))ids.set(e,++n);return ids.get(e)};const desc=e=>({id:id(e),tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,60),connected:e.isConnected});
    for(const type of ['pointerdown','mousedown','change','blur','focusout','focusin','pointerup','mouseup','click'])for(const capture of [true,false])document.addEventListener(type,e=>window.__events.push({type,phase:capture?'capture':'bubble',target:desc(e.target),value:document.querySelector('.direct-record-form input[type=search]')?.value}),capture);
    new MutationObserver(ms=>{for(const m of ms)for(const e of m.removedNodes)window.__events.push({type:'removed',target:desc(e)});}).observe(document.querySelector('#directRecordExerciseList'),{childList:true});
    window.__target=document.querySelector('.direct-search-option');id(window.__target);
   });
   const target=await p.locator('.direct-search-option').first().locator('span').innerText();await p.locator('.direct-search-option').first().click();
   const observed=await p.evaluate(()=>({events:window.__events,input:document.querySelector('.direct-record-form input[type=search]').value,targetConnected:window.__target.isConnected,listClosed:document.querySelector('#directRecordExerciseList').hidden}));
   result.samples.push({arm,target,...observed});await p.screenshot({path:path.join(out,arm+'.png'),fullPage:true});
   if(arm==='before'){assert.notEqual(observed.input,target);assert(!observed.targetConnected);assert(observed.events.some(e=>e.type==='change'));}
   else{assert.equal(observed.input,target,'candidate must select the clicked exercise');assert(observed.listClosed);}
  }finally{await c.close();}
 }result.status='PASS';
}catch(e){result.status='FAIL';result.error=e.stack;process.exitCode=1;}finally{if(browser)await browser.close();if(server.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'events.json'),JSON.stringify(result,null,2));console.log(result.status,result.error||'event regression protected');}})();
