const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync('tests/v169-display-delta.json');
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'6eb37fe0f194d318268dbb0db83809960c163165fd264c3c198e5ed5b8d4e32a');
const changes=JSON.parse(raw);
function read(file){let source=fs.readFileSync(file,'utf8');const delta=fs.readFileSync('tests/v170-display-delta.json');assert.equal(crypto.createHash('sha256').update(delta).digest('hex'),'c5686483550a1d46ac217334ebf974daf4e67e1691a0ba303a169520e0e7385a');for(const change of JSON.parse(delta)[file]||[]){assert(change.after.length);assert.equal(source.split(change.after).length-1,1);source=source.replace(change.after,change.before);}for(const change of changes[file]||[]){assert(change.after.length);assert.equal(source.split(change.after).length-1,1,'unique v169 display delta');source=source.replace(change.after,change.before);}return source;}
module.exports={read};
