// Normalize only the explicit v183 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v183-ui-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'7a7dbee6f390fa4cf252156dcef5a95f4b9a0278664700158b368b5c6eb434cc');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v183 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
