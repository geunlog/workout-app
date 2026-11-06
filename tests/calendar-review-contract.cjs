const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const base='ad6978476b7242caf9cc95cff552091aa6745aa0',bad="dialog.querySelector('.body-form-scroll').scrollTop=0;";
const a=cp.execFileSync('git',['show',base+':app.js'],{encoding:'utf8',maxBuffer:5e6}),b=fs.readFileSync('app.js','utf8');
assert.equal(a.split(bad).length,2);assert.equal(b,a.replace(bad,''));
for(const f of ['index.html','style.css','manifest.webmanifest','.github/workflows/integration.yml'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8'}));
console.log('PASS calendar fix is exactly one invalid statement removal; all other app/date/storage/JSON/API/graph code and UI assets/workflow identical to reviewed candidate');
