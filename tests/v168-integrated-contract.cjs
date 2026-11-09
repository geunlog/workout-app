// Verify the integration against immutable approved parents, not a newly blessed snapshot.
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const base='5003895daa03176dbf0ed0976b237b324405c29c',a='2b7821e5aaf2bb8fa70680818bdbb5ef90dedf88',b='edec2545e7068444e544fdaf7c95bd7ea9e3e4ad';
const source=(rev,f)=>cp.execFileSync('git',['show',rev+':'+f],{encoding:'utf8',maxBuffer:5e6});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const delta=JSON.parse(source(a,'tests/v167-display-delta.json'));
const expected={};
for(const f of ['app.js','index.html','style.css','sw.js'])expected[f]=source(b,f);
function replace(f,before,after){assert.equal(expected[f].split(before).length-1,1,f+' unique approved change');expected[f]=expected[f].replace(before,after);}
for(const change of delta['app.js'])replace('app.js',change.before,change.after);
for(const change of delta['index.html'].filter(c=>c.after.includes('exercise-edit-tools')||c.before==='      </details>\n'))replace('index.html',change.before,change.after);
// Both branches append scoped CSS at the same EOF: retain B then A verbatim.
const aCss=source(a,'style.css'),baseCss=source(base,'style.css');
assert(aCss.startsWith(baseCss),'A only appends scoped CSS');
expected['style.css']+=aCss.slice(baseCss.length);
expected['index.html']=expected['index.html'].replace(/앱 버전 168 · \d{4}-\d{2}-\d{2}/,'앱 버전 168 · 2026-11-10');
const hashes=Object.fromEntries(['index.html','app.js','style.css'].map(f=>[f,hash(expected[f])]));
expected['sw.js']=expected['sw.js'].replace(/const ASSET_HASHES = \{[^\n]*\};/,'const ASSET_HASHES = '+JSON.stringify(hashes)+';');
function check(f,s){assert.equal(s,expected[f],f+' approved A+B and v168 metadata only');return source(base,f);}
function read(f){const s=fs.readFileSync(f,'utf8');return Object.hasOwn(expected,f)?check(f,s):s;}
for(const f of Object.keys(expected)){read(f);assert.throws(()=>check(f,expected[f]+'\n/* unexpected mutation */'));}
console.log('PASS v168 integrated exact A+B contract, asset hashes and mutation rejection');
module.exports={read};
