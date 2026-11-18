// Normalize only the explicit v180 UI/pref delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v180-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'c10e5f5d3da3584f0f649e10116d2bcf6380cb6757827a847c42bccda8ab31f7');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v180 UI/pref change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
