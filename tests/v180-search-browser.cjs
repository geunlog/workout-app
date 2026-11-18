const {chromium}=require('playwright');
const {mkdirSync,readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const {createServer}=require('node:http');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const output=root+'/test-results';
const baseline='4d1bce052437a8f3724eb6980b3b268bcd915f95';
mkdirSync(output,{recursive:true});
const assets={'index.html':'text/html; charset=utf-8','app.js':'text/javascript','style.css':'text/css'};
const server=createServer((request,response)=>{
  const [,version,path]=request.url.split('?')[0].split('/');
  const file=path||'index.html';
  if(!(file in assets))return response.writeHead(404).end();
  const bytes=version==='before'?execFileSync('git',['show',baseline+':'+file],{cwd:root,maxBuffer:2e6}):readFileSync(root+'/'+file);
  response.writeHead(200,{'Content-Type':assets[file]}).end(bytes);
});
function seed() {
  if(sessionStorage.getItem('seed'))return;
  sessionStorage.setItem('seed','1');
  const exercises=[['체스트 프레스','가슴'],['레그 프레스','하체'],['덤벨 숄더 프레스','어깨'],['랫풀다운','등'],['시티드 로우','등'],['케이블 로우','등'],['체스트 프레스','등']];
  const record={date:'2026-11-18',dayKey:'wed',entries:exercises.map(([n,m],i)=>({id:'synthetic-'+i,n,m,w:'50',reps:'10'}))};
  localStorage.setItem('bulk-routine-log-v1',JSON.stringify([record]));
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch();
  try {
    for(const width of [320,390]){
      for(const variant of ['before','after']){
        const ctx=await browser.newContext({viewport:{width,height:680},timezoneId:'Asia/Seoul',hasTouch:true,serviceWorkers:'block'});
        await ctx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
        await ctx.addInitScript(seed);
        const p=await ctx.newPage();
        const errors=[];p.on('pageerror',error=>errors.push(error.message));p.setDefaultTimeout(6000);
        await p.clock.install({time:new Date('2026-11-18T10:00:00+09:00')});
        await p.goto('http://127.0.0.1:'+server.address().port+'/'+variant+'/');
        const original=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/log-v1|routine-v9|notes|temporary/i.test(k))));
        const mode=name=>p.locator('#modeToggle button').filter({hasText:new RegExp('^'+name+'$')});
        await mode('통계').click();
        const input=p.locator('[data-stats-exercise-search]');
        await input.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
        await input.fill('프레스');
        await input.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
        const popup=p.locator('.stats-exercise-search .stats-search-popup');
        const options=popup.getByRole('option');
        if(variant==='after'){
          assert.equal(await input.getAttribute('aria-expanded'),'true');
          assert.equal(await options.count(),3);
          const multi=options.filter({hasText:'체스트 프레스'}).locator('span');
          assert.equal(await multi.count(),2);
          const colors=await multi.evaluateAll(labels=>labels.map(e=>getComputedStyle(e,'::before').backgroundColor));
          assert.notEqual(colors[0],colors[1]);
          const inputBox=await input.boundingBox(),popupBox=await popup.boundingBox();
          assert(Math.abs(inputBox.x-popupBox.x)<1&&popupBox.y>=inputBox.y+inputBox.height);
        }
        await p.screenshot({path:output+'/v180-stats-search-'+variant+'-'+width+'.png'});
        if(variant==='after'){
          await input.press('ArrowDown');
          assert.equal(await options.first().getAttribute('aria-selected'),'true');
          await input.press('Enter');
          assert(await popup.isHidden());
          await input.fill('없는 종목');
          assert(await popup.isHidden());
          await input.fill('프레스');
          await options.filter({hasText:'레그 프레스'}).tap();
          assert.equal(await input.inputValue(),'레그 프레스');
          assert(await popup.isHidden());
          await input.dispatchEvent('compositionstart');
          await input.evaluate(e=>{e.value='ㄹ';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
          assert(await popup.isHidden());
          await input.evaluate(e=>{e.value='로우';e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'로우'}));});
          assert.equal(await options.count(),2);
          await input.press('Escape');
          assert(await popup.isHidden());
          await p.locator('#statsMuscleSelect').selectOption('가슴');
          await input.fill('프레스');
          assert.equal(await options.count(),1);
        }
        await mode('운동').click();
        await p.locator('#btnRoutineEdit').click();
        const trigger=p.locator('.btn-add-ex').first();
        await trigger.click();
        const modal=p.locator('#exerciseSearchOverlay');
        const chooser=modal.locator('input[type=search]');
        await chooser.fill('프레스');
        if(variant==='after'){
          const colors=await modal.locator('.exercise-muscle-label').evaluateAll(labels=>labels.map(e=>getComputedStyle(e,'::before').backgroundColor));
          assert(new Set(colors).size>=2);
          assert((await modal.locator('.exercise-search-result').first().boundingBox()).height>=44);
        }
        await p.screenshot({path:output+'/v180-exercise-search-'+variant+'-'+width+'.png'});
        await chooser.press('Escape');
        assert(await modal.isHidden());
        assert(await trigger.evaluate(e=>e===document.activeElement));
        assert.deepEqual(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/log-v1|routine-v9|notes|temporary/i.test(k)))),original);
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        assert.deepEqual(errors,[]);
        await ctx.close();
        console.log('PASS v180 search',width,variant);
      }
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
