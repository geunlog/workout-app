const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v176-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'0121e8ce52ba067a0f74e4e62c1369b600e78b1122518e8181c642ad9eab5cce');
function read(f){let s=require('./v177-display-contract.cjs').read(f);for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v176 preference change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
