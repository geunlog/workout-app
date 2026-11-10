const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v169-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'f0b50d13b71d324f661197bd9b61a38978ed95810d048e4faad882d8caa7e0d4');
const changes=JSON.parse(raw);
function read(file){let source=fs.readFileSync(file,'utf8');for(const change of changes[file]||[]){assert(change.after.length);assert.equal(source.split(change.after).length-1,1,'unique v169 display delta');source=source.replace(change.after,change.before);}return source;}
module.exports={read};
