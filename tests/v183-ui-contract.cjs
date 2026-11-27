// Normalize only the explicit v183 UI delta; all earlier immutable contracts remain.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v183-ui-delta.json');
const changes=JSON.parse(raw);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'bb5cf399a7e49ea4e21ed19b78e4313fc33e184eb63d7fdde4f49dda10ef598a');
function read(f){let s=require('./v184-body-contract.cjs').read(f);for(const c of changes[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v183 UI change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
