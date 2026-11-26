// Normalize only the explicit v184 body delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v184-body-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'b73359f0ee6b077c110a9ad614a21829e7a3b26b1babcf63163624e9975fcda7');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v184 body change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
