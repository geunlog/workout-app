const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {mkdirSync,readFileSync} = require('node:fs');
const {createServer} = require('node:http');
const {chromium} = require('playwright');

const baseline = '0f93051d9a0beecd1f58c09f84f23126411e85cf';
const output = 'test-results/v183-ai-routine';
const assetTypes = {'index.html':'text/html','app.js':'text/javascript','style.css':'text/css'};
const exercise = {name:'가슴 딥스',muscle:'가슴',sets:3,reps:'10',rir:'2'};
const date = '2026-11-18';
const time = new Date('2026-11-18T03:00:00Z');
const keys = {
  routine:'bulk-routine-v9',
  log:'bulk-routine-log-v1',
  temporary:'bulk-workout-temporary-v1',
  survey:'geunlog-adjustment-survey-v1',
  athlete:'geunlog-athlete-info-v1'
};
const seed = {
  [keys.routine]:['mon','tue','wed','thu','fri','sat','sun'].map((key,index)=>({
    key,letter:'월화수목금토일'[index],title:index===2?'가슴 운동':'기본 운동',ex:[
      {uid:'fixture-'+key,n:exercise.name,m:exercise.muscle,s:2,r:'8~12',rir:'2'}
    ]
  })),
  [keys.log]:[{date,dayKey:'wed',entries:[{id:'synthetic-1',n:exercise.name,m:exercise.muscle,w:'20',reps:'10'}]}],
  [keys.athlete]:{goal:'hypertrophy',experience:'one3',equipment:'덤벨',preferences:'',excluded:''}
};
const servers = Object.fromEntries(['before','after'].map(arm=>[arm,{
  'index.html':arm==='before'?execFileSync('git',['show',baseline+':index.html']):readFileSync('index.html'),
  'app.js':arm==='before'?execFileSync('git',['show',baseline+':app.js']):readFileSync('app.js'),
  'style.css':arm==='before'?execFileSync('git',['show',baseline+':style.css']):readFileSync('style.css')
}]));
const server = createServer((request,response)=>{
  const [,arm,file=''] = new URL(request.url,'http://localhost').pathname.split('/');
  const asset=file||'index.html';
  const body=servers[arm]?.[asset];
  if(!body)return response.writeHead(404).end();
  response.writeHead(200,{'Content-Type':assetTypes[asset]+'; charset=utf-8'}).end(body);
});
const snapshot = page=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
const tab = (page,label)=>page.getByRole('tab',{name:label,exact:true}).click();
const proposal = (start,end,dates,title)=>({
  format:'workout-temporary-routine',version:1,weekStart:start,weekEnd:end,
  days:dates.map(date=>({date,title,rest:false,exercises:[exercise]}))
});
async function closeHub(page) {
  await page.locator('[data-ai-menu-close]').click();
  await page.waitForFunction(()=>!history.state?.workoutAiMenu);
  assert(await page.evaluate(()=>['btnAiMenu','btnRoutineEdit'].includes(document.activeElement.id)));
}
async function checkBounds(locator) {
  const rect=await locator.boundingBox();
  assert(rect.width>=44&&rect.height>=44);
  assert(await locator.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
}
async function capture(browser,width,arm) {
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,serviceWorkers:'block',timezoneId:'Asia/Seoul'});
  await context.addInitScript(values=>{
    if(!sessionStorage.fixture){
      for(const [key,value] of Object.entries(values))localStorage.setItem(key,JSON.stringify(value));
      sessionStorage.fixture='1';
    }
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.ciClipboard=text;}}});
  },seed);
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  await page.clock.setFixedTime(time);
  const errors=[],requests=[];
  let holdResponse=null;
  let defer=false;
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1')return route.continue();
    if(url.hostname!=='ai.geunlog.workers.dev'||!['/plan','/adjust'].includes(url.pathname)||route.request().method()!=='POST')return route.abort();
    const payload=route.request().postDataJSON(),plan=payload.plan,adjust=payload.context;
    requests.push({path:url.pathname,payload});
    if(defer)await new Promise(resolve=>{holdResponse=resolve;});
    const input=plan||adjust;
    const days=plan?plan.days.filter(day=>day.mode==='generate'):adjust.availability.filter(day=>day.mode==='adjust');
    const routine=proposal(input.weekStart,input.weekEnd,days.map(day=>day.date),plan?'합성 기본 루틴 제안':'합성 이번 주 루틴 제안');
    await route.fulfill({json:{protocol:plan?3:2,routine,reasons:{}}}).catch(error=>{
      if(!defer)throw error;
    });
  });
  const shot=(name,fullPage=false)=>page.screenshot({path:`${output}/${width}-${name}.png`,fullPage});
  const hub=page.locator('#aiQuickMenu');
  const open=()=>page.locator('#btnAiMenu').click();
  const openWeek=()=>page.locator('#btnWeekAiFromDay').click();
  const openBase=()=>page.locator('#btnBasePlan').click();
  const backup=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/log|memo|catalog|backup/i.test(k)&&!k.includes('-survey-')&&!k.includes('-proposal-')&&!k.includes('athlete'))));
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}/${arm}/`);
    await tab(page,'루틴');
    if(arm==='before'){
      assert(await page.locator('#reportView #weekAdjustment').isVisible());
      await shot('report-before',true);
      await tab(page,'운동');
      await page.locator('#btnRoutineEdit').click();
      await open();
      await shot('menu-before');
      return;
    }
    assert.equal(await page.locator('#reportView #weekAdjustment').count(),0);
    await shot('report-after',true);
    await tab(page,'운동');
    await page.locator('#btnRoutineEdit').click();
    const original=await snapshot(page),protectedData=await backup();
    await open();
    assert.equal(await hub.getByRole('heading',{level:2}).innerText(),'루틴 관리');
    await checkBounds(hub.locator('#btnBasePlan'));
    await checkBounds(hub.locator('#btnWeekAiFromDay'));
    await checkBounds(hub.locator('#btnAiHistoryDay'));
    assert(await hub.getByRole('heading',{name:'AI 추천'}).isVisible());
    assert(await hub.getByRole('heading',{name:'직접 관리'}).isVisible());
    assert.equal(await page.locator('#dayView #btnReset,#dayView #btnClearDay').count(),0);
    const managementState=await snapshot(page);
    for(const [id,selector,choice] of [
      ['btnReset','#baseRoutineChooser','[data-split="1"]'],
      ['btnClearDay','#routineResetChooser','[data-reset-scope="day"]']
    ]){
      const action=hub.locator('#'+id),chooser=page.locator(selector);
      await checkBounds(action);
      await action.click();
      assert(await chooser.evaluate(node=>node.matches(':modal')),'chooser is above the routine management dialog');
      await page.goBack();
      await chooser.waitFor({state:'detached'});
      assert(await hub.isVisible());
      await action.click();
      await chooser.locator(choice).click();
      await chooser.waitFor({state:'detached'});
      await page.locator('#dataConfirmTitle').waitFor();
      await page.getByRole('button',{name:'취소',exact:true}).last().click();
      await page.locator('#dataConfirmTitle').waitFor({state:'detached'});
      assert(await hub.isVisible());
      assert.deepEqual(await snapshot(page),managementState);
    }
    await shot('hub');
    await openBase();
    const titleLayout=await hub.getByRole('heading',{level:2}).evaluate(title=>{
      const range=document.createRange();
      range.selectNodeContents(title);
      return {lines:new Set([...range.getClientRects()].map(rect=>rect.y)).size,width:title.offsetWidth,backWidth:title.previousElementSibling.offsetWidth};
    });
    assert.equal(titleLayout.lines,1,JSON.stringify(titleLayout));
    await shot('base-choices');
    await page.locator('#btnBaseChatGPT').click();
    const survey=page.locator('.ai-base-survey');
    assert(await survey.locator('[data-exchange-copy]').isVisible());
    await survey.locator('[data-no]').click();
    await page.locator('#btnBaseAi').click();
    await survey.locator('[data-day-chip="3"]').click();
    await survey.locator('[data-notes]').fill('합성 조건');
    await page.keyboard.press('Escape');
    await survey.waitFor({state:'detached'});
    await page.goBack();
    await page.waitForFunction(()=>document.getElementById('aiRoutineTitle').textContent==='루틴 관리');
    await openBase();
    await page.locator('#btnBaseAi').click();
    assert.equal(await survey.locator('[data-notes]').inputValue(),'합성 조건');
    assert.equal(await survey.locator('[data-day-chip="3"]').getAttribute('aria-pressed'),'true');
    await survey.locator('[data-generate]').click();
    const basePreview=page.locator('.ai-base-preview');
    await basePreview.waitFor();
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),keys.routine),original[keys.routine]);
    await basePreview.locator('[data-yes]').click();
    await basePreview.waitFor({state:'detached'});
    const newBase=(await snapshot(page))[keys.routine];
    assert.notEqual(newBase,original[keys.routine]);
    assert.equal(JSON.parse(newBase)[3].title,'합성 기본 루틴 제안');
    assert.equal((await snapshot(page))[keys.temporary],undefined);
    await hub.locator('[data-ai-menu-back]').click();
    await openWeek();
    await shot('week-survey');
    await page.locator('#adjustCoverage').selectOption('all');
    await page.locator('#adjustMinutes').selectOption('60');
    await page.locator('#applyAiMinutes').click();
    await page.locator('#adjustNotes').fill('합성 조정 조건');
    await page.locator('#adjustNotes').dispatchEvent('compositionstart',{data:'한'});
    await page.locator('#adjustNotes').dispatchEvent('compositionend',{data:'한'});
    await page.setViewportSize({width,height:420});
    await page.locator('#adjustNotes').focus();
    await page.locator('#adjustNotes').scrollIntoViewIfNeeded();
    assert(await hub.evaluate(dialog=>dialog.getBoundingClientRect().bottom<=visualViewport.height+1));
    await page.setViewportSize({width,height:844});
    await closeHub(page);
    await open();
    await openWeek();
    assert.equal(await page.locator('#adjustNotes').inputValue(),'합성 조정 조건');
    await page.locator('.adjustment-manual > summary').click();
    await page.locator('#btnAdjustmentCopy').click();
    const copied=await page.evaluate(()=>window.ciClipboard);
    assert(copied.includes('합성 조정 조건')&&copied.includes('"timingModel": 2'));
    const preview=page.getByRole('dialog',{name:'이번 주 제안 미리보기'});
    const weekDraft=proposal('2026-11-16','2026-11-22',['18','19','20','21','22'].map(d=>'2026-11-'+d),'합성 외부 제안');
    await page.locator('#temporaryFile').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(weekDraft))});
    await preview.waitFor();
    assert.equal((await snapshot(page))[keys.temporary],undefined);
    await preview.locator('[data-no]').click();
    await preview.waitFor({state:'detached'});
    defer=true;
    await page.locator('#btnAdjustmentGenerate').click();
    await page.waitForFunction(()=>document.getElementById('btnAdjustmentGenerate').disabled);
    await hub.locator('[data-ai-menu-back]').click();
    await openWeek();
    assert.equal(requests.filter(request=>request.path==='/adjust').length,1);
    holdResponse?.();
    await page.waitForFunction(()=>!document.getElementById('btnAdjustmentGenerate').disabled);
    assert.equal(await preview.count(),0);
    defer=false;
    await page.locator('#btnAdjustmentGenerate').click();
    await preview.waitFor();
    await page.clock.setFixedTime(new Date('2026-11-19T03:00:00Z'));
    await preview.locator('[data-yes]').click();
    assert((await preview.locator('[data-error]').innerText()).includes('날짜'));
    assert.equal((await snapshot(page))[keys.temporary],undefined);
    await page.clock.setFixedTime(time);
    await preview.locator('[data-no]').click();
    await preview.waitFor({state:'detached'});
    await page.locator('#btnAdjustmentGenerate').click();
    await preview.waitFor();
    await shot('week-preview');
    const beforeFailedApply=await snapshot(page);
    await page.evaluate(key=>{
      window.originalSet=Storage.prototype.setItem;
      Storage.prototype.setItem=function(target,value){
        if(target===key)throw Error('synthetic storage failure');
        return window.originalSet.call(this,target,value);
      };
    },keys.temporary);
    await preview.locator('[data-yes]').click();
    assert((await preview.locator('[data-error]').innerText()).includes('저장하지'));
    assert.deepEqual(await snapshot(page),beforeFailedApply);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
    await preview.locator('[data-yes]').click();
    await preview.waitFor({state:'detached'});
    assert.equal((await snapshot(page))[keys.routine],newBase);
    assert((await snapshot(page))[keys.temporary]);
    assert.equal(await page.locator('#btnAdjustmentGenerate').innerText(),'남은 일정 다시 추천받기');
    await closeHub(page);
    await page.locator('#btnRoutineEdit').click();
    await open();
    assert(await hub.locator('#routineManualActions').isHidden());
    assert(await hub.locator('#btnWeekAiFromDay').isVisible());
    await closeHub(page);
    await tab(page,'루틴');
    await page.locator('#reportView [data-temp-details]').click();
    await page.locator('#temporaryDetailsDialog [data-temp-cancel]').click();
    await page.getByRole('dialog',{name:'임시 적용 취소'}).locator('[data-yes]').click();
    assert.equal((await snapshot(page))[keys.temporary],undefined);
    assert.equal((await snapshot(page))[keys.routine],newBase);
    assert.deepEqual(await backup(),protectedData);
    assert.equal((await snapshot(page))[keys.log],original[keys.log]);
    await tab(page,'운동');
    await page.locator('#btnRoutineEdit').click();
    await open();
    await page.locator('#btnAiHistoryDay').click();
    assert(await page.locator('.ai-history-dialog .ai-history-item').count()>=2);
    await page.keyboard.press('Escape');
    await page.locator('.ai-history-dialog').waitFor({state:'detached'});
    await page.goBack();
    await hub.waitFor({state:'hidden'});
    await page.locator('#btnSettings').click();
    await page.locator('#btnShowAddProfile').click();
    await page.locator('#newProfileName').fill('합성 비교 플랜');
    await page.locator('#btnAddProfile').click();
    await page.locator('#btnSettingsBack').click();
    if(!await page.locator('#btnAiMenu').isVisible())await page.locator('#btnRoutineEdit').click();
    await open();
    await openWeek();
    assert.equal(await page.locator('#adjustNotes').inputValue(),'');
    assert.equal((await snapshot(page))[keys.routine],newBase);
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px unified hub and manual confirmation cancellation, reduced viewport and focus, browser Back/Escape, draft preservation, intercepted /plan and /adjust, external weekly file, canceled request, failed storage rollback, applies independently, history, report cancellation and protected data`);
  } finally {
    holdResponse?.();
    await context.close();
  }
}
(async()=>{
  mkdirSync(output,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch();
  try{
    for(const width of [320,390])for(const arm of ['before','after'])await capture(browser,width,arm);
  }finally{
    await browser.close();
    server.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
