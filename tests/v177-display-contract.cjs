const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v177-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'fff6d5f32f7c05e9932f20761035e8d1cbf0e8530d70aef462539c74dabe13f6');
function read(f){let s=fs.readFileSync(f,'utf8');for(const c of JSON.parse(raw)[f]||[]){assert(c.after.length);assert.equal(s.split(c.after).length-1,1,'unique v177 layout change');s=s.replace(c.after,c.before);}return s;}
module.exports={read};
