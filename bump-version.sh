#!/bin/bash
# 사용법: bash bump-version.sh 53
# 개발 환경에 Node.js 필요. 검증 후 버전·리소스 주소·해시를 함께 반영한다.
set -euo pipefail
VERSION="${1:?사용법: bash bump-version.sh <버전번호>}"
[[ "$VERSION" =~ ^[1-9][0-9]*$ ]] || { echo '버전번호는 양의 정수여야 합니다.' >&2; exit 1; }
TODAY="$(TZ=Asia/Seoul date +%Y-%m-%d)"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node - "$DIR" "$VERSION" "$TODAY" <<'NODE'
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [dir,version,date]=process.argv.slice(2);
const htmlPath=path.join(dir,'index.html'),swPath=path.join(dir,'sw.js');
let html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
function replaceOne(text,regex,value,label){
  const matches=[...text.matchAll(regex)];
  if(matches.length!==1)throw new Error(label+' 대상은 정확히 1개여야 합니다. 파일은 변경하지 않았습니다.');
  return text.replace(regex,()=>value);
}
html=replaceOne(html,/<meta name="workout-app-version" content="\d+">/g,`<meta name="workout-app-version" content="${version}">`,'메타 버전');
html=replaceOne(html,/앱 버전 \d+ · \d{4}-\d{2}-\d{2}/g,`앱 버전 ${version} · ${date}`,'화면 버전');
html=replaceOne(html,/href="style\.css(?:\?v=\d+)?"/g,`href="style.css?v=${version}"`,'CSS 주소');
html=replaceOne(html,/src="app\.js(?:\?v=\d+)?"/g,`src="app.js?v=${version}"`,'JS 주소');
sw=replaceOne(sw,/const CACHE_NAME = CACHE_PREFIX \+ 'v\d+-release-\d+';/g,`const CACHE_NAME = CACHE_PREFIX + 'v${version}-release-${version}';`,'캐시 버전');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const hashes={'index.html':hash(html),'app.js':hash(fs.readFileSync(path.join(dir,'app.js'))),'style.css':hash(fs.readFileSync(path.join(dir,'style.css')))};
sw=replaceOne(sw,/const ASSET_HASHES = \{[^\n]*\};/g,`const ASSET_HASHES = ${JSON.stringify(hashes)};`,'파일 해시');
const originals=[fs.readFileSync(htmlPath),fs.readFileSync(swPath)];
try{
  fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
  if(fs.readFileSync(htmlPath,'utf8')!==html || fs.readFileSync(swPath,'utf8')!==sw)throw new Error('저장 검증 실패');
}catch(error){fs.writeFileSync(htmlPath,originals[0]);fs.writeFileSync(swPath,originals[1]);throw error;}
console.log(`버전 ${version} (${date}) 반영 및 검증 완료: HTML · 화면 · 캐시 · 리소스 주소 · 파일 해시`);
NODE
