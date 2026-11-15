const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v173-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'d65800750a73e4eaf9d36b61fdc7a456b628e5b2cd19d95a40c520bde5c66070');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert.equal(s.split(c.after).length-1,1,'unique v173 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
