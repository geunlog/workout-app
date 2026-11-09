const fs = require('fs');
const http = require('http');
const assert = require('assert/strict');
const {chromium} = require('playwright');
const cp = require('child_process');
const base = '5003895daa03176dbf0ed0976b237b324405c29c';
const results = [];
const server = http.createServer((req,res) => {
 const [arm,file='index.html'] = req.url.slice(1).split('/');
 try {
  const name=file.split('?')[0]||'index.html';
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');
  res.end(arm==='A'?cp.execFileSync('git',['show',base+':'+name],{maxBuffer:5000000}):fs.readFileSync(name));
 } catch {res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 try {
 for(const width of [320,360,390,430]) for(const arm of ['A','B']) {
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${arm}/`);
  for(const count of [0,1,2,5,38]) {
   await page.evaluate(count=>{
    const dates=Array.from({length:count},(_,i)=>i<3?`2026-0${5+i}-01T10:00`:new Date(Date.UTC(2026,9,1+i-3)).toISOString().slice(0,16));
    const records=dates.map((at,i)=>({id:'synthetic-'+i,at,device:i%2?'B':'A',note:'',waistUnit:'cm',weight:80+i/10,muscle:i===4?null:40,fatPercent:20,fatMass:null,waist:85,createdAt:at+'Z',updatedAt:at+'Z'}));
    localStorage.setItem('geunlog-body-v1',JSON.stringify({version:1,records,baseline:null}));
    document.body.innerHTML='<main class="bulk-app" id="test"></main>';BodyTracker.mount(document.querySelector('main'));
   },count);
   await page.locator('[data-device]').selectOption('');
   await page.locator('[data-metric]').selectOption('weight');
   await page.locator('[data-period]').selectOption('all');
   const before=await page.evaluate(()=>localStorage.getItem('geunlog-body-v1'));
   if(count) {
    const geometry=()=>page.locator('.body-graph-scroll').evaluate(e=>({width:e.clientWidth,svg:e.querySelector('svg').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1,points:[...e.querySelectorAll('[data-point]')].map(p=>({x:p.getBoundingClientRect().x,id:p.dataset.point}))}));
    const overview=await geometry();assert(!overview.overflow);
    if(arm==='B') {
     await page.locator('[data-graph-zoom]').selectOption('32');
     const expanded=await geometry();assert(expanded.svg>overview.svg*31);assert(!expanded.overflow);
     await page.locator('[data-graph-latest]').click();
     assert((await page.locator('[data-point-position]').innerText()).startsWith(`${count} /`));
     assert(await page.locator('[data-point]').last().evaluate(e=>{const p=e.getBoundingClientRect(),s=e.closest('.body-graph-scroll').getBoundingClientRect();return p.left>=s.left&&p.right<=s.right;}),'latest point visible');
     if(count===38)console.log(JSON.stringify(await page.locator('.body-graph-scroll').evaluate(e=>({scroll:e.scrollLeft,rect:e.getBoundingClientRect().toJSON(),svg:e.querySelector('svg').getBoundingClientRect().toJSON(),dot:e.querySelector('circle:last-of-type').getBoundingClientRect().toJSON(),view:e.querySelector('svg').getAttribute('viewBox'),html:e.querySelector('polyline').outerHTML.slice(0,400)}))));
     if(count===38)assert(expanded.points[37].x-expanded.points[36].x>30);
     results.push({width,count,overview,expanded});
     await page.screenshot({path:`test-results/stats-${width}-${count}.png`,fullPage:true});
     await page.locator('[data-graph-zoom]').selectOption('1');
    }else results.push({width,count,overview});
    for(const metric of ['weight','muscle','fatPercent','fatMass','waist']) {
     await page.locator('[data-metric]').selectOption(metric);
     for(const period of ['30','90','180','all','custom'])await page.locator('[data-period]').selectOption(period);
    }
    await page.locator('[data-period]').selectOption('all');
    await page.locator('[data-device]').selectOption('A');
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('geunlog-body-v1')),before);
  }
  await page.close();
 }
 fs.writeFileSync('test-results/stats-results.json',JSON.stringify({status:'PASS',browser:browser.version(),results},null,2));
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
