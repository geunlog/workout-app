// Normalize only the explicit v181 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v181-display-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'c5ee1e7a5e379067af0da7747a4869c69ea5a82bea59ca9a0ee0ea2118e8dc26');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v181 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
