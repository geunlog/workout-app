// Fixed v166 baseline; only the explicit rendering delta may differ.
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const base='5003895daa03176dbf0ed0976b237b324405c29c';
const raw=fs.readFileSync('tests/v167-display-delta.json','utf8');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'9e220efd55ca629b805f6b5e4216dc05cd388e7d28b79b9b1d1884f733f86b13');
const changes=JSON.parse(raw),original=f=>cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8',maxBuffer:5e6});
function check(f,s){let expected=original(f);for(const e of changes[f]){assert.equal(expected.split(e.before).length-1,1,f+' unique anchor');expected=expected.replace(e.before,e.after);}assert.equal(s,expected,f+' explicit rendering-only delta');return original(f);}
function read(f){const s=fs.readFileSync(f,'utf8');return changes[f]?check(f,s):s;}
for(const f of Object.keys(changes)){read(f);assert.throws(()=>check(f,fs.readFileSync(f,'utf8')+'\n/* unapproved */'));}
console.log('PASS v167 exact display delta; unexpected mutations rejected');
module.exports={read};
