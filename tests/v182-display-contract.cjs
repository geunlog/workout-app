// Normalize only the explicit v182 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v182-display-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'059bbeb50d13c4a1e820abd18950b7edaa7f840544f55b605846eab940ac100e');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v182 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
