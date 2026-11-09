// v1.7: immutable v161 baseline + explicitly reviewed v1.6 display delta.
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const base='1621e0c1db66eed0b3fc9e9956546e13079b59f9';
const read=require('./stats-display-contract.cjs').read,original=f=>cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8',maxBuffer:5e6});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const currentBase='acbcd27f7c1e234ef91dc51856f5a0f79768578d';
const baseline=f=>cp.execFileSync('git',['show',currentBase+':'+f],{encoding:'utf8',maxBuffer:5e6});
function appContract(s){
 const delta=JSON.parse(read('tests/v164-display-delta.json'));let expected=baseline('app.js');
 for(const {before,after}of delta){assert.equal(expected.split(before).length-1,1);expected=expected.replace(before,after);}
 for(const {before,after} of JSON.parse(read('tests/v165-display-delta.json'))){assert.equal(expected.split(before).length-1,1);expected=expected.replace(before,after);}
 assert.equal(s,expected,'only explicit reviewed rendering/focus changes permitted');
}
function htmlContract(s){let a=baseline('index.html');for(const [x,y]of [['content="163"','content="166"'],['style.css?v=163','style.css?v=166'],['app.js?v=163','app.js?v=166'],['앱 버전 163 · 2026-11-08','앱 버전 166 · 2026-11-09']]){assert.equal(a.split(x).length-1,1);a=a.replace(x,y)}assert.equal(s,a)}
function cssContract(s){let expected=baseline('style.css')+read('tests/v164-style-delta.css')+read('tests/v165-style-delta.css');const delta=JSON.parse(read('tests/v166-style-delta.json'));for(const {before,after} of delta.replacements){assert.equal(expected.split(before).length-1,1);expected=expected.replace(before,after);}assert.equal(s,expected+delta.append,'exact scoped selector/property/value delta');}
function swContract(s){const hashes=JSON.parse(s.match(/const ASSET_HASHES = (\{[^\n]+\});/)[1]);for(const f of ['index.html','app.js','style.css'])assert.equal(hashes[f],hash(read(f)));assert.equal(Object.keys(hashes).length,3);const normalize=t=>t.replace(/const ASSET_HASHES = \{[^\n]+\};/,'const ASSET_HASHES = {};').replace("'v166-release-166'","'v163-release-163'");assert.equal(normalize(s),normalize(baseline('sw.js')));assert(s.includes("'v166-release-166'"))}
appContract(read('app.js'));htmlContract(read('index.html'));cssContract(read('style.css'));swContract(read('sw.js'));
for(const f of ['manifest.webmanifest','.github/workflows/integration.yml'])assert.equal(read(f),original(f));
console.log('PASS v163 JS exact bytes outside explicit v164 display/focus delta; calendar/date/storage/API/calculation unchanged');
console.log('PASS scoped CSS delta, HTML version, SW algorithm and asset hashes, manifest/workflow');
const bad="dialog.querySelector('.body-form-scroll').scrollTop=0;";
assert.throws(()=>appContract(read('app.js').replace('function calendar(input,max=',bad+'function calendar(input,max=')));
assert.throws(()=>appContract(read('app.js').replace('localStorage.setItem','localStorage.removeItem')));
assert.throws(()=>appContract(read('app.js').replace('전체 기록 보기 ›','전체 기록 보기 ›전체 기록 보기 ›')));
assert.throws(()=>cssContract(read('style.css')+'\nbutton{display:none}'));
assert.throws(()=>htmlContract(read('index.html').replace('v=166','v=167')));
assert.throws(()=>swContract(read('sw.js').replace(/(index.html":")[a-f0-9]{8}/,'$100000000')));
assert.throws(()=>cssContract(read('style.css').replace('left:10px;top:60px','left:11px;top:60px')));
assert.throws(()=>cssContract(read('style.css').replace('padding-left:96px','padding-right:96px')));
console.log('PASS 8 negative mutations rejected: calendar bug/storage/label/CSS/version/hash');

assert.equal(hash(read('tests/v164-display-delta.json')),'a72d3872f247ffa3209f90b6e6a258ade8f4186e511346226abf5f2f9d363f93');

assert.equal(hash(read('tests/v164-style-delta.css')),'8da96a8eca4426c37dbf642e1db64d3c21b926aafddb2178f73fbfebf0cbe760');

assert.equal(hash(read('tests/v165-display-delta.json')),'cad4291f719c2bb89ccc332cac5313f5472ba6c774516509104b5d05c5e2770d');

assert.equal(hash(read('tests/v165-style-delta.css')),'92f1e5745900347e8f03b42fc19ffc6b9bd761b9fb218f5d713efbc34110ac18');

assert.equal(hash(read('tests/v166-style-delta.json')),'131d4b864ea28336b3cb93ad796cf5e246566149e3fc804b29f253ad09de2775');
