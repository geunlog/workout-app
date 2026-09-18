#!/bin/bash
# 버전 하나만 넣으면 세 곳(메타 태그 / 화면 문구 / sw.js 캐시명)을 한 번에 맞춘다.
# 사용법: bash bump-version.sh 46
set -euo pipefail

VERSION="${1:?사용법: bash bump-version.sh <버전번호>}"
[[ "$VERSION" =~ ^[1-9][0-9]*$ ]] || { echo '버전번호는 양의 정수여야 합니다.' >&2; exit 1; }
TODAY="$(TZ=Asia/Seoul date +%Y-%m-%d)"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1) index.html <meta> 태그
sed -i -E "s/(<meta name=\"workout-app-version\" content=\")[0-9]+(\">)/\1${VERSION}\2/" "$DIR/index.html"

# 2) index.html 화면에 보이는 "앱 버전 N · YYYY-MM-DD" 문구
sed -i -E "s/(앱 버전 )[0-9]+( · )[0-9]{4}-[0-9]{2}-[0-9]{2}/\1${VERSION}\2${TODAY}/" "$DIR/index.html"

# 3) sw.js 캐시 이름
sed -i -E "s/(CACHE_PREFIX \+ 'v)[0-9]+(-release-)[0-9]+(')/\1${VERSION}\2${VERSION}\3/" "$DIR/sw.js"

echo "버전 ${VERSION} (${TODAY}) 반영 완료:"
grep -n "workout-app-version\" content" "$DIR/index.html"
grep -n "앱 버전" "$DIR/index.html"
grep -n "CACHE_NAME =" "$DIR/sw.js"
