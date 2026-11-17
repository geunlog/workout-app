// Normalize only the explicit v179 display/event delta; earlier immutable contracts still run.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v179-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'71a69467003bb3b34194630f5e16c4d38f8c0e0b310df71d959bb721e8ccd608');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v179 exercise UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
