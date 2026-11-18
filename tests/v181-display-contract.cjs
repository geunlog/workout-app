// Normalize only the explicit v181 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v181-display-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'1b431779704c3aaf1fe528d805cd1ddd01eaa203a9d46b7f88bf69dcec907da3');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v181 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
