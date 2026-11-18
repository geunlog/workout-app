// Normalize only the explicit v183 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v183-ui-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'aae81c5686af7b3f06cf183ba56f8a43ef40f6519c2f9048a9774f00855258fc');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v183 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
