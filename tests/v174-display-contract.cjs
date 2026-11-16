const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v174-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'ded67a38daa4179aefc0baba31bb36210785aae1cc127c07ceb365195e0dd03e');
function read(f){let s=require('./v175-display-contract.cjs').read(f);for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v174 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
