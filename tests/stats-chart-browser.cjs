const fs = require('fs');
const http = require('http');
const assert = require('assert/strict');
const {chromium} = require('playwright');
const cp = require('child_process');
const base = '4a3796a72503494f4ace878f30341388be454f08';
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
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:true,serviceWorkers:'block'});
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${arm}/`);
  for(const count of [0,1,2,5,38]) {
   await page.evaluate(count=>{
    const dates=Array.from({length:count},(_,i)=>i<3?`2026-0${5+i}-01T10:00`:new Date(Date.UTC(2026,9,1+i-3)).toISOString().slice(0,16));
    if(count>4)dates[4]=dates[3];
    const records=dates.map((at,i)=>({id:'synthetic-'+i,at,device:i%2?'B':'A',note:'',waistUnit:'cm',weight:80+i/10,muscle:i===4?null:40,fatPercent:20,fatMass:null,waist:85,createdAt:at+'Z',updatedAt:at+'Z'}));
    localStorage.setItem('geunlog-body-v1',JSON.stringify({version:1,records,baseline:null}));
    document.body.innerHTML='<main class="bulk-app" id="test"></main>';BodyTracker.mount(document.querySelector('main'));
   },count);
   await page.locator('[data-device]').selectOption('');
   await page.locator('[data-metric]').selectOption('weight');
   await page.locator('[data-period]').selectOption('all');
   const before=await page.evaluate(()=>localStorage.getItem('geunlog-body-v1'));
   if(count) {
    const geometry=()=>page.locator('.body-graph-scroll').evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,left:e.getBoundingClientRect().left,svg:e.querySelector('svg').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1,points:[...e.querySelectorAll('[data-point]')].map(p=>({x:p.getBoundingClientRect().x+p.getBoundingClientRect().width/2,id:p.dataset.point}))}));
    const overview=await geometry();assert(!overview.overflow);
    if(arm==='B') {
     await page.locator('[data-graph-latest]').click();
     const expanded=await geometry();assert(Math.abs(expanded.svg-overview.width)<=1);assert.equal(expanded.scrollWidth,expanded.width);assert(!expanded.overflow);
     await page.locator('[data-graph-latest]').click();
     assert((await page.locator('[data-point-position]').innerText()).startsWith(`${count} /`));
     assert(await page.locator('[data-point]').last().evaluate(e=>{const p=e.getBoundingClientRect(),s=e.closest('.body-graph-scroll').getBoundingClientRect();return p.left>=s.left&&p.right<=s.right;}),'latest point visible');
     if(count===38)console.log(JSON.stringify(await page.locator('.body-graph-scroll').evaluate(e=>({scroll:e.scrollLeft,rect:e.getBoundingClientRect().toJSON(),svg:e.querySelector('svg').getBoundingClientRect().toJSON(),dot:e.querySelector('circle:last-of-type').getBoundingClientRect().toJSON(),view:e.querySelector('svg').getAttribute('viewBox'),html:e.querySelector('polyline').outerHTML.slice(0,400)}))));
     assert(expanded.points.every(p=>p.x>expanded.left&&p.x<expanded.left+expanded.width),'all points are visible together');
     results.push({width,count,overview,expanded});
     await page.locator('.body-graph-scroll').scrollIntoViewIfNeeded();
     if(count===38){
      const centers=await page.locator('[data-point]').evaluateAll(dots=>dots.map(dot=>{
       const box=dot.getBoundingClientRect();
       return {x:box.left+box.width/2,y:box.top+box.height/2,id:dot.dataset.point};
      }));
      const selected=()=>page.locator('[data-point][aria-pressed=true]').getAttribute('data-point');
      for(const point of centers){
       await page.mouse.click(point.x,point.y);
       assert.equal(await selected(),point.id,'mouse center at '+width+'px');
      }
      for(const point of centers){
       await page.touchscreen.tap(point.x,point.y);
       assert.equal(await selected(),point.id,'touch center at '+width+'px');
      }
      console.log('PASS '+width+'px: 38 mouse and 38 touch selections');
     }
     const chartImage=await page.locator('.body-graph-scroll').screenshot({path:`test-results/stats-visible-${width}-${count}.png`});
     const bluePixels=await page.evaluate(async data=>{
      const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      let blue=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>100&&pixels[i+2]>pixels[i]+50&&pixels[i+2]>pixels[i+1]+30)blue++;
      return blue;
     },chartImage.toString('base64'));
     assert(bluePixels>5,'graph must paint blue point/line pixels');
     console.log('PAINT '+JSON.stringify({width,count,bluePixels}));
     await page.screenshot({path:`test-results/stats-${width}-${count}.png`,fullPage:true});
     assert.equal(await page.locator('[data-graph-index],[data-graph-zoom]').count(),0);
     const buttons=await page.locator('.body-graph-tools button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,h:r.height};}));
     assert(buttons.every(b=>b.h>=44&&Math.abs(b.y-buttons[0].y)<1));
     for(let i=count-1;i>=0;i--){assert((await page.locator('[data-point-position]').innerText()).startsWith((i+1)+' /'));assert.equal(await page.locator('[data-point][aria-pressed=true]').getAttribute('data-point'),'synthetic-'+i);if(i)await page.locator('[data-point-prev]').click();}
     assert(await page.locator('[data-point-prev]').isDisabled());
     await page.locator('[data-graph-latest]').click();assert(await page.locator('[data-point-next]').isDisabled());
     const xs=expanded.points.map(p=>p.x);if(xs.length>2){const gap=xs[1]-xs[0];assert(Math.abs(gap-(expanded.width*304/360)/(count-1))<.1,'points use the full plot width');assert(xs.slice(1).every((x,i)=>Math.abs(x-xs[i]-gap)<.1));}
    }else results.push({width,count,overview});
    if(arm==='B' && count===38){
     const snapshot=()=>page.evaluate(()=>localStorage.getItem('geunlog-body-v1'));
     const enlarge=async()=>{await page.locator('[data-graph-latest]').click();await page.locator('[data-graph-latest]').click();};
     await enlarge();
     await page.locator('[data-graph-edit]').last().click();
     await page.locator('.body-dialog [name=weight]').fill('83.8');
     await page.locator('.body-dialog footer [data-close]').click();
     await page.locator('.body-confirm [data-confirm]').click();
     assert.equal(await snapshot(),before,'edit cancel preserves source');
     await page.locator('[data-graph-edit]').last().click();
     await page.locator('.body-dialog [name=weight]').fill('83.8');
     await page.evaluate(()=>{window.savedSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='geunlog-body-v1')throw Error('synthetic quota');return window.savedSetItem.call(this,key,value);};});
     await page.locator('.body-dialog button[type=submit]').click();
     assert((await page.locator('.body-dialog [data-error]').innerText()).includes('quota'));
     assert.equal(await snapshot(),before,'failed save preserves source');
     await page.evaluate(()=>Storage.prototype.setItem=window.savedSetItem);
     await page.locator('.body-dialog button[type=submit]').click();
     await page.locator('.body-dialog').waitFor({state:'detached'});
     const edited=await snapshot();assert.equal(JSON.parse(edited).records.find(r=>r.id==='synthetic-37').weight,83.8);
     await enlarge();
     await page.locator('[data-graph-delete]').last().click();
     await page.locator('.body-confirm [data-cancel]').click();
     assert.equal(await snapshot(),edited,'delete cancel preserves source');
     await page.locator('[data-graph-delete]').last().click();
     await page.locator('.body-confirm [data-confirm]').click();
     await page.waitForFunction(()=>JSON.parse(localStorage.getItem('geunlog-body-v1')).records.length===37);
     await page.locator('[data-import]').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'geunlog-body',...JSON.parse(edited)}))});
     await page.locator('.body-confirm [data-confirm]').click();
     await page.waitForFunction(()=>JSON.parse(localStorage.getItem('geunlog-body-v1')).records.length===38);
     const restored=JSON.parse(await snapshot());assert.deepEqual(restored,JSON.parse(edited));
     // Return the fixture to its initial bytes only after the end-to-end assertions.
     await page.evaluate(raw=>{localStorage.setItem('geunlog-body-v1',raw);BodyTracker.mount(document.querySelector('main'));},before);
     console.log('PASS expanded edit/cancel/quota/delete/cancel/restore '+width);
    }
    for(const metric of ['weight','muscle','fatPercent','fatMass','waist']) {
     await page.locator('[data-metric]').selectOption(metric);
     for(const period of ['30','90','180','all','custom']){
      await page.locator('[data-period]').selectOption(period);
      if(arm==='B' && await page.locator('[data-graph-latest]').count()){
       await page.locator('[data-graph-latest]').click();
       await page.locator('[data-graph-latest]').click();
       await page.locator('.body-graph-scroll').scrollIntoViewIfNeeded();
       await page.waitForFunction(()=>{
        const box=document.querySelector('.body-graph-scroll').getBoundingClientRect();
        return [...document.querySelectorAll('.body-graph-scroll svg text')].filter(e=>Number(e.getAttribute('y'))<200).every(e=>{const r=e.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.top>=box.top-1&&r.bottom<=box.bottom+1;});
       });
      }
     }
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
