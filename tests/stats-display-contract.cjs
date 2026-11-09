const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const delta=JSON.parse(fs.readFileSync('tests/stats-display-delta.json'));
function read(file){
 let text=fs.readFileSync(file,'utf8');
 if(!delta[file])return text;
 for(const change of delta[file]){
  assert(change.after.length,'replacement must be explicit');
  assert.equal(text.split(change.after).length-1,1,'unique display change');
  text=text.replace(change.after,change.before);
 }
 assert.equal(text,cp.execFileSync('git',['show','5003895daa03176dbf0ed0976b237b324405c29c:'+file],{encoding:'utf8',maxBuffer:5000000}));
 return text;
}
for(const file of Object.keys(delta))read(file);
module.exports={read};
