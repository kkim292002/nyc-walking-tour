# NYC Walking Tour

뉴욕 현장에서 iPhone으로 사용하는 한국어 도보 투어 PWA입니다. 현재 **Central Park Part 1**이 완성되어 있고, 같은 데이터 구조로 9개 이상의 후속 투어를 추가할 수 있습니다.

## 들어 있는 기능

- GPS로 각 정거장까지의 직선거리 확인
- Google Maps 무료 도보 길찾기 링크 (API 키 없음)
- 현장 관찰 체크리스트
- 짧은 현장 요약 + 긴 한국어 가이드북
- 수동 방문 완료 체크만 사용 (GPS 자동 완료 없음)
- 방문 기록·체크리스트·전체 진행률을 기기 로컬 저장소에 보존
- 앱 본문과 필수 파일 오프라인 캐싱
- iPhone 홈 화면 설치, 안전 영역, 다크 모드 대응
- 외부 폰트·추적 스크립트·유료 서비스 없음

## GitHub Pages로 무료 공개하기

아래 단계만 사용자가 직접 하면 됩니다. 앱은 아직 인터넷에 배포된 상태가 아닙니다.

1. [GitHub](https://github.com/)에 로그인합니다.
2. 오른쪽 위 **+** → **New repository**를 누릅니다.
3. Repository name에 `nyc-walking-tour`를 입력하고 **Public**을 선택합니다.
4. README, .gitignore, license 자동 생성 옵션은 체크하지 않고 **Create repository**를 누릅니다.
5. 이 프로젝트 폴더의 **내용물 전체**를 업로드합니다. 폴더 자체가 한 단계 더 들어가지 않도록 `index.html`이 저장소 최상단에 보여야 합니다.
6. 업로드 화면 아래의 **Commit changes**를 누릅니다.
7. 저장소의 **Settings** → 왼쪽 **Pages**로 이동합니다.
8. **Build and deployment**의 Source를 **Deploy from a branch**로 선택합니다.
9. Branch에서 **main**, 폴더에서 **/(root)**를 선택하고 **Save**를 누릅니다.
10. 보통 몇 분 안에, 늦으면 약 10분 뒤 Pages 화면에 표시되는 HTTPS 주소를 엽니다. 일반적인 주소 형식은 `https://사용자이름.github.io/nyc-walking-tour/`입니다.

GitHub 무료 계정의 공개 저장소와 GitHub Pages만 사용하므로 별도 웹호스팅 요금이나 유료 API가 필요하지 않습니다.

## iPhone에 설치하기

1. iPhone의 **Safari**로 배포된 HTTPS 주소를 엽니다.
2. 하단의 **공유** 버튼을 누릅니다.
3. **홈 화면에 추가**를 누르고 이름을 확인한 뒤 **추가**합니다.
4. 여행 전에 홈 화면의 앱을 한 번 열어 둡니다. 이때 가이드와 앱 파일이 오프라인용으로 저장됩니다.
5. **내 위치로 거리 확인**을 처음 누를 때 Safari의 위치 권한을 허용합니다.

Google Maps 길찾기는 인터넷 연결이 필요하지만, 가이드 본문·체크리스트·방문 기록은 오프라인에서도 동작합니다. iPhone에서 브라우저 데이터나 이 웹사이트 데이터를 삭제하면 로컬 기록도 함께 지워집니다.

## 다음 투어 추가하기

콘텐츠는 [`data/tours.js`](./data/tours.js)에 모여 있습니다.

- 목록에만 보일 예정 투어: `status: "planned"`
- 실제로 열리는 투어: `status: "published"`와 `stops` 배열
- 정거장마다 좌표, 현장 요약, 관찰 체크리스트, 상세 본문을 가집니다.

새 파일을 추가하거나 캐시 대상 파일명을 바꾸면 [`sw.js`](./sw.js)의 `APP_SHELL`과 `CACHE_NAME`도 함께 갱신합니다. `CACHE_NAME` 버전을 올리면 기존 설치 앱이 새 파일을 다시 받습니다.

## 로컬 확인

서비스 워커와 GPS는 보안 컨텍스트에서 동작하므로 파일을 더블 클릭해 여는 대신 로컬 웹 서버 또는 배포된 HTTPS 주소에서 확인해야 합니다. 배포 전에는 프로젝트 폴더에서 정적 서버를 실행한 뒤 브라우저로 접속하면 됩니다.

## 출처

Part 1은 Architectural Digest의 *How Central Park Was Created Entirely By Design and Not By Nature* 현장 해설을 바탕으로, 실제 도보 여행에서 읽고 관찰하기 좋은 한국어 가이드로 재구성했습니다. 앱의 상세 가이드 아래에 원본 영상 페이지 링크가 포함되어 있습니다.
