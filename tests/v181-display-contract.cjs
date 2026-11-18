// Normalize only the explicit v181 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v181-display-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'f03435340c2c2cc165f737e1df6512f7c49af77f8fa2a52f5905e415b23e2474');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v181 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
