// Normalize only the explicit v184 body delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v184-body-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'56a0755a07b8648a7a64c436b1668579f7ff2f730d09cfa8fa6757bcb9a30a5e');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v184 body change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
