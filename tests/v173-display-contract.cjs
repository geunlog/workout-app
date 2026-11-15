const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v173-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'a3839cadcdd232ab80e43dc94b77209ef9cc0181274cbbfe3f186b408b680a4f');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert.equal(s.split(c.after).length-1,1,'unique v173 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
