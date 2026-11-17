const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v177-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'877c3d87dc97dc31b2365f4a6a8efd01e7a15398f6f10d224e2da203ea614a5c');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v177 layout change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
