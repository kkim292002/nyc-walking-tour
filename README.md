# NYC Walking Tour · Nearby Guide

여행 중 현재 위치 주변의 흥미로운 포인트를 지도에서 발견하고, 일행에게 짧고 재미있게 설명하기 위한 iPhone용 한국어 PWA입니다. **정해진 투어 순서나 경로는 없습니다.**

## 핵심 사용 방식

1. 지도에서 **내 위치**를 누릅니다.
2. 300m, 800m, 2km 중 검색 반경을 고릅니다.
3. 반경 안의 포인트가 가까운 순서로 표시됩니다.
4. 지도 마커나 가까운 포인트 카드를 누르면 해당 장소의 상세 가이드로 바로 이동합니다.
5. 포인트 목록의 **상세 가이드** 버튼으로도 긴 해설을 열 수 있습니다.
6. 포인트의 한 문장 설명을 일행에게 들려주거나 iPhone 공유 메뉴로 전달합니다.

GPS는 거리 계산과 지도 표시만 담당합니다. **방문 완료는 GPS로 자동 판정하지 않으며**, 사용자가 직접 누른 경우에만 기록됩니다.

## 포함된 기능

- OpenStreetMap 기반 인터랙티브 지도
- 선택한 반경 안의 포인트 탐색 및 가까운 순 정렬
- 사용자가 요청할 때만 시작되는 실시간 위치 추적
- 포인트별 “일행에게 들려줄 한 문장”
- iPhone 공유 메뉴 또는 설명·지도 링크 복사
- Google Maps 도보 길찾기 링크
- 현장 관찰 체크리스트와 상세 한국어 가이드
- 방문 기록·체크리스트의 기기 내 저장
- 콘텐츠와 앱 파일의 오프라인 캐싱
- iPhone 홈 화면 설치와 다크 모드
- 향후 9개 이상의 뉴욕 주제 추가를 위한 데이터 구조

Leaflet 지도 엔진은 프로젝트 안에 포함되어 오프라인에서도 실행됩니다. 지도 타일은 OpenStreetMap에서 현재 화면에 필요한 것만 온라인으로 불러오며 대량 다운로드하거나 오프라인용으로 미리 저장하지 않습니다. 인터넷이 없을 때도 포인트 좌표, 설명, 가이드와 방문 기록은 사용할 수 있습니다.

## GitHub Pages로 무료 공개하기

1. [GitHub](https://github.com/)에 로그인합니다.
2. 오른쪽 위 **+** → **New repository**를 누릅니다.
3. Repository name에 nyc-walking-tour를 입력하고 **Public**을 선택합니다.
4. **Create repository**를 누릅니다.
5. 빈 저장소의 하늘색 **Quick setup** 상자에서 **uploading an existing file**을 누릅니다.
6. 압축을 푼 nyc-walking-tour 폴더 안의 내용물을 모두 업로드합니다. index.html이 저장소 첫 화면에 바로 보여야 합니다.
7. 아래의 **Commit changes**를 누릅니다.
8. **Settings → Pages → Deploy from a branch → main → /(root) → Save**를 선택합니다.
9. 보통 몇 분 안에, 늦으면 약 10분 뒤 **Visit site**로 HTTPS 주소를 엽니다.

GitHub Free 공개 저장소와 GitHub Pages만 사용하므로 별도 웹호스팅 비용이나 지도 API 요금이 없습니다.

## iPhone에 설치하기

1. Safari로 배포된 HTTPS 주소를 엽니다.
2. **공유 → 홈 화면에 추가**를 누릅니다.
3. 여행 전에 앱을 한 번 열어 콘텐츠가 저장되도록 합니다.
4. 현장에서 **내 위치**를 처음 누를 때 Safari 위치 권한을 허용합니다.

iPhone에서 이 웹사이트의 브라우저 데이터를 삭제하면 로컬 방문 기록도 함께 지워집니다.

## 다음 콘텐츠 추가

콘텐츠는 [data/tours.js](./data/tours.js)에 모여 있습니다. 새 포인트에는 이름, 좌표, 카테고리, 지도 마커 문자, 공유용 한 문장, 체크리스트와 상세 본문을 추가합니다. 앱 파일을 바꾼 뒤에는 [sw.js](./sw.js)의 CACHE_NAME 버전을 올려 기존 설치 앱이 새 파일을 받게 합니다.

## 오픈소스와 지도 출처

- 지도 엔진: Leaflet 1.9.4, BSD-2-Clause. 라이선스는 [vendor/leaflet/LICENSE](./vendor/leaflet/LICENSE)에 포함되어 있습니다.
- 지도 데이터·타일: © OpenStreetMap contributors. 앱 지도 위에 출처 링크가 항상 표시됩니다.
- Part 1 콘텐츠: Architectural Digest의 *How Central Park Was Created Entirely By Design and Not By Nature*를 여행용 한국어 가이드로 재구성했습니다.
