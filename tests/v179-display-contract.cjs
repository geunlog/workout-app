// Normalize only the explicit v179 display/event delta; earlier immutable contracts still run.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v179-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'e5b00f35979cca8bb4e5f720cba8cdcca7e69af8bbfe6eccd8c0b7df93d855cd');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v179 exercise UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
