const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v173-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'06f19b3b98f820bdad99c4e980d58c9da569350b1a9f16f20b203a06f713f870');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert.equal(s.split(c.after).length-1,1,'unique v173 display change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
