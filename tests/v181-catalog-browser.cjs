const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {mkdirSync,readFileSync} = require('node:fs');
const {createServer} = require('node:http');
const {chromium} = require('playwright');

const baseline = '706b978898a34760903a9ef2c67a107ac272d493';
const catalogKey = 'bulk-routine-catalog-shared-v1';
const assets = {'index.html':'text/html; charset=utf-8','app.js':'text/javascript','style.css':'text/css'};
mkdirSync('test-results',{recursive:true});
const server=createServer((request,response)=>{
  const [,version,path]=new URL(request.url,'http://localhost').pathname.split('/');
  const file=path||'index.html';
  if(!Object.hasOwn(assets,file))return response.writeHead(404).end();
  const bytes=version==='before'?execFileSync('git',['show',baseline+':'+file],{maxBuffer:2e6}):readFileSync(file);
  response.writeHead(200,{'Content-Type':assets[file]}).end(bytes);
});
function seed(){
  localStorage.setItem('bulk-routine-log-v1',JSON.stringify([{
    date:'2026-11-18',dayKey:'wed',entries:[
      {id:'synthetic-dips',n:'가슴 딥스',m:'가슴',w:'40',reps:'10'},
      {id:'synthetic-pullover',n:'덤벨 풀오버',m:'가슴',w:'20',reps:'12'}
    ]
  }]));
}
async function inspect(context,width,version){
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.setDefaultTimeout(6000);
  await page.clock.install({time:new Date('2026-11-18T10:00:00+09:00')});
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/');
  await page.evaluate(seed);
  await page.reload();
  const mode=name=>page.locator('#modeToggle button').filter({hasText:new RegExp('^'+name+'$')});
  const snap=label=>page.screenshot({path:'test-results/v181-'+label+'-'+version+'-'+width+'.png'});
  const original=await page.evaluate(()=>localStorage.getItem('bulk-routine-log-v1'));
  await mode('운동 관리').click();
  await page.locator('[data-catalog-muscle="가슴"] > summary,#catalogList > details:first-child > summary').click();
  const catalogSort=page.locator('#catalogList [data-card-sort=catalog]').first();
  await catalogSort.selectOption('added');
  await snap('catalog');
  assert.equal(await page.locator('#catalogList > .rec-group').count(),7);
  const sortIcon=async select=>select.evaluate(node=>getComputedStyle(node).backgroundImage);
  const catalogSortIcon=await sortIcon(catalogSort);
  await mode('기록').click();
  const recordSort=page.locator('#recordSortControl [data-card-sort=record]');
  await snap('records');
  if(version==='after'){
    assert.equal(await sortIcon(recordSort),catalogSortIcon);
    assert.equal(await recordSort.locator('option[value=recent]').textContent(),'최근순');
    assert.equal(await catalogSort.locator('option[value=added]').textContent(),'최근순');
  }

  await mode('통계').click();
  await page.locator('[data-stats-panel=pins] > summary').click();
  const pin=page.locator('#pinExerciseInput');
  await pin.fill('딥스');
  await pin.evaluate(node=>node.scrollIntoView({block:'center'}));
  if(version==='after'){
    const option=page.locator('#pinExerciseChoices').getByRole('option');
    assert.equal(await option.count(),1);
    assert((await option.innerText()).includes('가슴'));
    const box=await pin.boundingBox(),popup=await option.locator('..').locator('..').boundingBox();
    assert(Math.abs(box.x-popup.x)<2 && popup.y>=box.y+box.height);
    await snap('stats-pin');
    await pin.press('ArrowDown');
    await pin.press('Enter');
    assert.equal(await pin.inputValue(),'가슴 딥스');
    assert(await page.locator('[data-pin-add]').isEnabled());
  }else await snap('stats-pin');
  const stats=page.locator('[data-stats-exercise-search]');
  await stats.fill('딥스');
  await stats.evaluate(node=>node.scrollIntoView({block:'center'}));
  await snap('stats-main');
  if(version==='before')return;
  const statsRow=page.locator('.stats-muscle-group .stats-exercise').filter({hasText:'가슴 딥스'});
  assert.equal(await statsRow.locator('.exercise-muscle-badge').textContent(),'가슴');
  assert((await statsRow.locator('.stats-exercise-title small').textContent()).includes('1세트'));

  await mode('운동 관리').click();
  const search=page.locator('#catalogSearchName');
  await search.fill('딥스');
  const choices=page.locator('#catalogExerciseSuggestions').getByRole('option');
  assert((await choices.count())>0);
  await snap('catalog-search');
  await choices.filter({hasText:'가슴 딥스'}).tap();
  assert.equal(await search.inputValue(),'가슴 딥스');
  assert.equal(await search.getAttribute('aria-expanded'),'false');
  await search.fill('검색 결과 없음 합성');
  assert(await page.locator('#catalogSearchEmpty').isVisible());
  assert.equal(await page.locator('#catalogList .cat-item:visible').count(),0);
  const add=page.locator('#btnCatalogAdd');
  await add.click();
  const dialog=page.locator('#catalogAddDialog');
  const muscle=dialog.locator('[name=muscle]'), name=dialog.locator('[name=name]');
  await muscle.selectOption('가슴');
  await name.fill('가슴 딥스');
  await dialog.getByRole('button',{name:'등록'}).click();
  assert((await dialog.locator('[role=status]').innerText()).includes('같은 이름'));
  await dialog.getByRole('button',{name:'취소'}).click();
  await dialog.waitFor({state:'hidden'});
  assert(await add.evaluate(node=>node===document.activeElement));
  assert.equal(await search.inputValue(),'검색 결과 없음 합성');
  const originalCatalog=await page.evaluate(k=>localStorage.getItem(k),catalogKey);

  await add.click();
  await muscle.selectOption('등');
  await name.fill('합성 신규 로우');
  await dialog.locator('[name=sets]').fill('3');
  await dialog.locator('[name=reps]').fill('8~12');
  await dialog.locator('[name=rir]').fill('2');
  await snap('catalog-add');
  await page.evaluate(key=>{
    const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('synthetic failure');return set.call(this,k,v);};
  },catalogKey);
  await dialog.getByRole('button',{name:'등록'}).click();
  assert((await dialog.locator('[role=status]').innerText()).includes('저장하지 못'));
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),catalogKey),originalCatalog);
  assert.equal(await name.inputValue(),'합성 신규 로우');
  await page.reload();
  await mode('운동 관리').click();
  await add.click();
  await muscle.selectOption('등');
  await name.fill('합성 신규 로우');
  await dialog.locator('[name=sets]').fill('3');
  await dialog.getByRole('button',{name:'등록'}).click();
  await dialog.waitFor({state:'hidden'});
  const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),catalogKey));
  assert.equal(saved.등.find(item=>item.n==='합성 신규 로우').s,3);
  const row=page.locator('[data-catalog-muscle="등"] .cat-item').filter({hasText:'합성 신규 로우'});
  assert(await row.isVisible());
  assert.equal(await row.locator('.exercise-muscle-badge').textContent(),'등');
  await mode('운동').click();
  await snap('day-catalog');
  await page.locator('#dayView [data-catalog-add]').click();
  assert(await dialog.isVisible());
  await dialog.getByRole('button',{name:'취소'}).click();
  await page.locator('#dayView [data-catalog-reset]').click();
  await page.getByRole('button',{name:'취소',exact:true}).click();
  await mode('운동 관리').click();
  await page.locator('#btnCatalogReset').click();
  await page.getByRole('button',{name:'취소',exact:true}).click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),catalogKey),JSON.stringify(saved));
  assert.equal(await page.evaluate(()=>localStorage.getItem('bulk-routine-log-v1')),original);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS '+width+'px: common sort icon/label, aligned search, pin keyboard, category badge, registration, duplicate, reset cancel, save failure and original records');
}
(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch();
    for(const width of [320,390])for(const version of ['before','after']){
      const ctx=await browser.newContext({viewport:{width,height:780},timezoneId:'Asia/Seoul',hasTouch:true,serviceWorkers:'block'});
      try{await inspect(ctx,width,version);}finally{await ctx.close();}
    }
  }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
