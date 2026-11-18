const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { chromium } = require('playwright');

const preferencesKey = 'bulk-view-preferences-v1';
const statsScopeKey = 'bulk-workout-stats-scope-v1';
const seed = {
  'bulk-routine-profiles-v1': ['기본', '합성 플랜'],
  'bulk-routine-log-v1': [{date:'2026-11-18',dayKey:'wed',entries:[{id:'own-1',n:'합성 프레스',m:'가슴',w:'50',reps:'10'}]}],
  'bulk-routine-log-v1::합성 플랜': [{date:'2026-11-18',dayKey:'wed',entries:[{id:'other-1',n:'합성 로우',m:'등',w:'40',reps:'8'}]}],
  'geunlog-body-v1': {version:1,records:[],baseline:null},
  [statsScopeKey]: 'all'
};
const types = {'index.html':'text/html; charset=utf-8','app.js':'text/javascript','style.css':'text/css'};
const server = createServer((request,response)=>{
  const file = new URL(request.url,'http://localhost').pathname.slice(1)||'index.html';
  if (!Object.hasOwn(types,file)) return response.writeHead(404).end();
  response.writeHead(200,{'Content-Type':types[file]}).end(readFileSync(join(__dirname,'..',file)));
});

async function run(width,url){
  const profile = mkdtempSync(join(tmpdir(),'workout-v180-'));
  let context;
  const pageErrors = [];
  const open = async () => {
    context = await chromium.launchPersistentContext(profile,{
      viewport:{width,height:844},timezoneId:'Asia/Seoul',hasTouch:true,serviceWorkers:'block'
    });
    await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const page = context.pages()[0];
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.setDefaultTimeout(8000);
    await page.clock.install({time:new Date('2026-11-18T10:00:00+09:00')});
    await page.goto(url);
    return page;
  };
  try {
    let page = await open();
    const mode = name => page.locator('#modeToggle button').filter({hasText:new RegExp('^'+name+'$')});
    const tab = id => page.locator(id).getAttribute('aria-selected');
    const current = selector => page.locator(selector).getAttribute('aria-pressed');
    const reopen = async name => {
      await page.reload();
      await mode(name).click();
    };
    const stored = key => page.evaluate(key=>localStorage.getItem(key),key);
    const rawSources = () => page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/log-v1|routine-v9|notes|temporary|memo|geunlog-body-v1/i.test(key))));
    await page.evaluate(values=>{
      Object.entries(values).forEach(([key,value])=>localStorage.setItem(key,JSON.stringify(value)));
    },seed);
    await page.reload();
    const original = await rawSources();

    await mode('기록').click();
    assert.equal(await tab('#recordsTab-exercise'),'true');
    assert.equal(await current('[data-records-scope=current]'),'true');
    assert.equal(await stored(preferencesKey),null);
    await page.locator('#recordsTab-exercise').press('Home');
    await page.locator('[data-records-scope=all]').click();
    await reopen('기록');
    assert.equal(await tab('#recordsTab-date'),'true');
    assert.equal(await current('[data-records-scope=all]'),'true');
    assert((await page.locator('#recordsList').innerText()).includes('합성 로우'));

    await mode('통계').click();
    assert.equal(await tab('#exerciseStatsTab'),'true');
    assert.equal(await current('[data-stats-scope=all]'),'true','v179 scope is preserved');
    await page.locator('[data-stats-scope=current]').click();
    await page.locator('#exerciseStatsTab').press('End');
    assert.equal(await tab('#bodyStatsTab'),'true');
    await context.close();
    context = null;
    page = await open();
    await mode('통계').click();
    assert.equal(await tab('#bodyStatsTab'),'true','body tab survives browser restart');
    await page.locator('#exerciseStatsTab').click();
    assert.equal(await current('[data-stats-scope=current]'),'true');
    await page.locator('[data-stats-scope=all]').click();
    await reopen('통계');
    assert.equal(await tab('#exerciseStatsTab'),'true');
    assert.equal(await current('[data-stats-scope=all]'),'true');
    await mode('기록').click();
    assert.equal(await tab('#recordsTab-date'),'true');
    assert.equal(await current('[data-records-scope=all]'),'true');

    await page.locator('[data-records-scope=current]').click();
    await page.locator('#recordsTab-exercise').click();
    await page.locator('.exercise-record-head').first().click();
    await page.locator('.record-edit-trigger').first().click();
    const beforeEdit = await stored(preferencesKey);
    await page.locator('#recordsTab-date').click();
    await page.locator('[data-records-scope=all]').click();
    assert(await page.locator('.record-edit-form').isVisible());
    assert.equal(await stored(preferencesKey),beforeEdit);
    await page.locator('.record-edit-form button').filter({hasText:/^취소$/}).click();
    await reopen('기록');
    assert.equal(await tab('#recordsTab-exercise'),'true');
    assert.equal(await current('[data-records-scope=current]'),'true');

    // A link may set temporary filters for navigation, independent of explicit tab choices.
    await page.locator('#recordsTab-date').click();
    await mode('통계').click();
    await page.locator('[data-record-muscle="등"]').click();
    assert.equal(await tab('#recordsTab-exercise'),'true');
    assert.equal(await current('[data-records-scope=all]'),'true');
    await reopen('기록');
    assert.equal(await tab('#recordsTab-date'),'true');
    assert.equal(await current('[data-records-scope=current]'),'true');

    for (const value of ['{','[]','null','{"version":9}', '{"version":1,"recordsView":"unexpected","recordsScope":"unexpected","statsView":"unexpected"}']){
      await page.evaluate(([key,value])=>localStorage.setItem(key,value),[preferencesKey,value]);
      await reopen('기록');
      assert.equal(await tab('#recordsTab-exercise'),'true');
      assert.equal(await current('[data-records-scope=current]'),'true');
      await mode('통계').click();
      assert.equal(await tab('#exerciseStatsTab'),'true');
      assert.equal(await current('[data-stats-scope=all]'),'true');
      assert.equal(await stored(preferencesKey),value,'startup leaves invalid values untouched');
      await mode('기록').click();
    }

    const values = {version:1,recordsView:'exercise',recordsScope:'current',statsView:'body'};
    await page.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),[preferencesKey,values]);
    await reopen('기록');
    const firstPage = page;
    const secondPage = await context.newPage();
    await secondPage.goto(url);
    await secondPage.locator('#modeToggle button').filter({hasText:/^기록$/}).click();
    await secondPage.locator('[data-records-scope=all]').click();
    await firstPage.locator('#recordsTab-date').click();
    assert.deepEqual(JSON.parse(await stored(preferencesKey)),{...values,recordsView:'date',recordsScope:'all'});
    await secondPage.close();
    await page.evaluate(key=>{
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===key)throw new DOMException('Synthetic quota test','QuotaExceededError');
        return write.call(this,name,value);
      };
    },preferencesKey);
    await page.locator('#recordsTab-exercise').click();
    assert.equal(await tab('#recordsTab-exercise'),'true');
    await page.waitForFunction(()=>document.getElementById('appToast').textContent.includes('저장하지 못'));
    assert.equal(JSON.parse(await stored(preferencesKey)).recordsView,'date');
    await reopen('기록');
    assert.equal(await tab('#recordsTab-date'),'true');
    await page.addInitScript(key=>{
      const read = Storage.prototype.getItem;
      Storage.prototype.getItem=function(name){
        if(name===key)throw new DOMException('Synthetic read failure','SecurityError');
        return read.call(this,name);
      };
    },preferencesKey);
    await reopen('기록');
    assert.equal(await tab('#recordsTab-exercise'),'true');
    assert.equal(await current('[data-records-scope=current]'),'true');
    assert.deepEqual(await rawSources(),original);
    assert.deepEqual(pageErrors,[]);
    console.log('PASS '+width+'px: legacy/default, all four independent choices, reload and persistent browser restart, record edit guard, transient stats link, malformed preferences, cross-window writes, quota/read failure and source bytes');
  } finally {
    if(context)await context.close();
    rmSync(profile,{recursive:true,force:true});
  }
}

(async()=>{
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    for(const width of [320,390])await run(width,'http://127.0.0.1:'+server.address().port);
  } finally {
    server.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
