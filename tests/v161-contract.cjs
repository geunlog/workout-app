const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const base='86b52f80e399f1dace7b352a9cd74e8c8d4458e8',a=cp.execFileSync('git',['show',base+':app.js'],{encoding:'utf8',maxBuffer:5e6}),b=fs.readFileSync('app.js','utf8');
const block=(s,start,end)=>{const i=s.indexOf(start),j=s.indexOf(end,i+start.length);assert(i>=0&&j>i,start);return s.slice(i,j);};
for(const [start,end] of [
 ['function validate(data){','function graph(points){'],
 ['  function adjustmentRecords(', '  function adjustmentHtml('],
 ['  function planForAi(', '  function baseExchangeChanges('],
 ['  function attachBaseExchange(', '  function previewBasePlan('],
 ["dialog.querySelector('[data-yes]').onclick=function(){try{\n      if(exchange",'  function openBasePlanSurvey('],
 ['  function openBasePlanSurvey(', '  function openProposalHistory(']
]){assert.equal(block(b,start,end),block(a,start,end),start);console.log('PASS byte-identical v160 protected block '+start);}
for(const file of ['manifest.webmanifest','.github/workflows/integration.yml'])assert.equal(fs.readFileSync(file,'utf8'),cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}));
const ak=[...a.matchAll(/(?:localStorage|storage)\.(?:setItem|removeItem)\([^\n]+/g)].map(m=>m[0]),bk=[...b.matchAll(/(?:localStorage|storage)\.(?:setItem|removeItem)\([^\n]+/g)].map(m=>m[0]);assert.deepEqual(bk,ak);console.log('PASS storage writes, manifest and CI deployment configuration unchanged');
