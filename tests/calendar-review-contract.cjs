// v1.7: immutable v161 baseline + explicitly reviewed v1.6 display delta.
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const base='1621e0c1db66eed0b3fc9e9956546e13079b59f9';
const read=f=>fs.readFileSync(f,'utf8'),original=f=>cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8',maxBuffer:5e6});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function appContract(s){const a=original('app.js'),from='전체 기록 보기 ↗',to='전체 기록 보기 ›';assert.equal(a.split(from).length-1,1);assert.equal(s.split(to).length-1,1);assert.equal(s.split(from).length-1,0);assert.equal(s.replace(to,from),a);}
function htmlContract(s){let a=original('index.html');for(const [x,y]of [['content="161"','content="163"'],['style.css?v=161','style.css?v=163'],['app.js?v=161','app.js?v=163'],['앱 버전 161 · 2026-11-06','앱 버전 163 · 2026-11-08']]){assert.equal(a.split(x).length-1,1);a=a.replace(x,y)}assert.equal(s,a)}
// Pinned from the independently reviewed v1.6 ZIP, not generated from current file.
function cssContract(s){
 const marker='\n/* v163 exercise-tab candidate: presentation only; preserve input and storage behavior. */\n';
 const parts=s.split(marker);assert.equal(parts.length,2);
 assert.equal(hash(parts[0]),'4215f5021220704af6d67671180873e30f306fa2f2eed8c75d5b8c5c896546a1');
 const rules=[...parts[1].matchAll(/([^{}]+)\{([^{}]+)\}/g)];assert.equal(rules.length,37);
 for(const [,selector,body]of rules){assert(/^(\.bulk-app #dayView |\.bulk-app #dayView\.routine-editing #dayPanel |\.bulk-app:has\(#dayView:not\(\[hidden\]\)\) \.masthead$|\.ai-quick-menu[ >])/.test(selector.trim()),selector);assert(!/display\s*:\s*none|visibility|pointer-events|opacity/.test(body));}
 assert.equal(parts[1].replace(/[^{}]+\{[^{}]+\}/g,'').trim(),'');
}
function swContract(s){const hashes=JSON.parse(s.match(/const ASSET_HASHES = (\{[^\n]+\});/)[1]);for(const f of ['index.html','app.js','style.css'])assert.equal(hashes[f],hash(read(f)));assert.equal(Object.keys(hashes).length,3);const normalize=t=>t.replace(/const ASSET_HASHES = \{[^\n]+\};/,'const ASSET_HASHES = {};').replace("'v163-release-163'","'v161-release-161'");assert.equal(normalize(s),normalize(original('sw.js')));assert(s.includes("'v163-release-163'"))}
appContract(read('app.js'));htmlContract(read('index.html'));cssContract(read('style.css'));swContract(read('sw.js'));
for(const f of ['manifest.webmanifest','.github/workflows/integration.yml'])assert.equal(read(f),original(f));
console.log('PASS v161 JS exact bytes except one approved label; calendar/date/storage/API/calculation unchanged');
console.log('PASS reviewed v1.6 CSS hash; explicit HTML version delta; SW algorithm and real asset hashes; manifest/workflow unchanged');
const bad="dialog.querySelector('.body-form-scroll').scrollTop=0;";
assert.throws(()=>appContract(read('app.js').replace('function calendar(input,max=',bad+'function calendar(input,max=')));
assert.throws(()=>appContract(read('app.js').replace('localStorage.setItem','localStorage.removeItem')));
assert.throws(()=>appContract(read('app.js').replace('전체 기록 보기 ›','전체 기록 보기 ›전체 기록 보기 ›')));
assert.throws(()=>cssContract(read('style.css')+'\nbutton{display:none}'));
assert.throws(()=>htmlContract(read('index.html').replace('v=163','v=164')));
assert.throws(()=>swContract(read('sw.js').replace(/(index.html":")[a-f0-9]{8}/,'$100000000')));
console.log('PASS 6 negative mutations rejected: calendar bug/storage/label/CSS/version/hash');
