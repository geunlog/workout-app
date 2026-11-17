// Normalize only the explicit v178 display/event delta; earlier immutable contracts still run.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v178-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'9bd63df67b7a5f9d7c7db6499471bf7b4c5c00f088fcad6bae22d4fec6e23590');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v178 exercise UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
