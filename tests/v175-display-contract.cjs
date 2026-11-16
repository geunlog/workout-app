const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v175-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'814f7006a4a6ddd12f2dff43d0e893448084e08370794c78aee607e29e33a558');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v175 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
