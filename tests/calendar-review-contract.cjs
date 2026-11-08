// v1.7: immutable v161 baseline + explicitly reviewed v1.6 display delta.
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const base='1621e0c1db66eed0b3fc9e9956546e13079b59f9';
const read=f=>fs.readFileSync(f,'utf8'),original=f=>cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8',maxBuffer:5e6});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const currentBase='acbcd27f7c1e234ef91dc51856f5a0f79768578d';
const baseline=f=>cp.execFileSync('git',['show',currentBase+':'+f],{encoding:'utf8',maxBuffer:5e6});
function appContract(s){
 const delta=JSON.parse(read('tests/v164-display-delta.json'));let expected=baseline('app.js');
 for(const {before,after}of delta){assert.equal(expected.split(before).length-1,1);expected=expected.replace(before,after);}
 assert.equal(s,expected,'only explicit reviewed rendering/focus changes permitted');
}
function htmlContract(s){let a=baseline('index.html');for(const [x,y]of [['content="163"','content="164"'],['style.css?v=163','style.css?v=164'],['app.js?v=163','app.js?v=164'],['앱 버전 163 · 2026-11-08','앱 버전 164 · 2026-11-08']]){assert.equal(a.split(x).length-1,1);a=a.replace(x,y)}assert.equal(s,a)}
function cssContract(s){assert.equal(s,baseline('style.css')+read('tests/v164-style-delta.css'),'exact scoped selector/property/value delta');}
function swContract(s){const hashes=JSON.parse(s.match(/const ASSET_HASHES = (\{[^\n]+\});/)[1]);for(const f of ['index.html','app.js','style.css'])assert.equal(hashes[f],hash(read(f)));assert.equal(Object.keys(hashes).length,3);const normalize=t=>t.replace(/const ASSET_HASHES = \{[^\n]+\};/,'const ASSET_HASHES = {};').replace("'v164-release-164'","'v163-release-163'");assert.equal(normalize(s),normalize(baseline('sw.js')));assert(s.includes("'v164-release-164'"))}
appContract(read('app.js'));htmlContract(read('index.html'));cssContract(read('style.css'));swContract(read('sw.js'));
for(const f of ['manifest.webmanifest','.github/workflows/integration.yml'])assert.equal(read(f),original(f));
console.log('PASS v163 JS exact bytes outside explicit v164 display/focus delta; calendar/date/storage/API/calculation unchanged');
console.log('PASS scoped CSS delta, HTML version, SW algorithm and asset hashes, manifest/workflow');
const bad="dialog.querySelector('.body-form-scroll').scrollTop=0;";
assert.throws(()=>appContract(read('app.js').replace('function calendar(input,max=',bad+'function calendar(input,max=')));
assert.throws(()=>appContract(read('app.js').replace('localStorage.setItem','localStorage.removeItem')));
assert.throws(()=>appContract(read('app.js').replace('전체 기록 보기 ›','전체 기록 보기 ›전체 기록 보기 ›')));
assert.throws(()=>cssContract(read('style.css')+'\nbutton{display:none}'));
assert.throws(()=>htmlContract(read('index.html').replace('v=164','v=165')));
assert.throws(()=>swContract(read('sw.js').replace(/(index.html":")[a-f0-9]{8}/,'$100000000')));
assert.throws(()=>cssContract(read('style.css').replace('left:10px;top:60px','left:11px;top:60px')));
assert.throws(()=>cssContract(read('style.css').replace('padding-left:96px','padding-right:96px')));
console.log('PASS 8 negative mutations rejected: calendar bug/storage/label/CSS/version/hash');

assert.equal(hash(read('tests/v164-display-delta.json')),'328a32ccd713a794a9c924af4e4ccc58a5a239a3b5722e2dbc78b26195e46c6c');

assert.equal(hash(read('tests/v164-style-delta.css')),'8da96a8eca4426c37dbf642e1db64d3c21b926aafddb2178f73fbfebf0cbe760');
