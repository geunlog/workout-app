const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v173-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'a2d9e8116dc02dd36b4dea4e86932f1f361a15d6ff3723e4478612715aa1b6a7');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert.equal(s.split(c.after).length-1,1,'unique v173 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
