const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v173-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'162faf96164587c87ae94a005a1d31af637f5e92fc62551455bcf8a9c81a6866');
function read(f){let s=require('./v174-display-contract.cjs').read(f);for(const c of JSON.parse(raw)[f]||[]){assert.equal(s.split(c.after).length-1,1,'unique v173 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
