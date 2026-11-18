// Normalize only the explicit v183 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v183-ui-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'4f789abe78c37786916a90367d6c7b0f1b985b97be72c81fa5df34d9c979b7b8');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v183 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
