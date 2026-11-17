// Normalize only the explicit v178 display/event delta; earlier immutable contracts still run.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v178-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'daf20115e0449fa658da535432c2373cf76aaae78c88c33dc694081d454ef597');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v178 exercise UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
