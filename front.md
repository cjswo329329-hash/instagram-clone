# 🎨 Instagram 클론 프론트엔드 개발 명세서 (front.md)

## 1. 개요 및 기술 스택

본 문서는 Instagram의 독보적인 감성과 사용자 경험을 웹 표준 환경에 충실히 재현하기 위한 프론트엔드 아키텍처, 디자인 시스템, 컴포넌트 구조 및 인터랙션 명세서입니다.

### 1.1 기술 스택
- **Core**: React 18+ (Vite 번들러)
- **Language**: JavaScript (ES2022+) / JSX
- **Styling**: Vanilla CSS + CSS Modules + CSS Custom Properties (디자인 토큰)
- **Routing**: React Router v6 (`react-router-dom`)
- **State Management**: React Context API (`AuthContext`, `ModalContext`, `ThemeContext`)
- **HTTP Client**: Axios (인터셉터를 통한 JWT 토큰 관리)
- **Icons**: `lucide-react` (Instagram 스타일 미니멀 라인 아이콘)
- **Build & Dev Tool**: Vite 5+

---

## 2. 디자인 시스템 및 UI/UX 원칙

### 2.1 디자인 철학
1. **인스타그램 고유의 미니멀리즘**: 콘텐츠(사진, 영상)가 중심이 되도록 UI 배경과 외곽선은 절제된 모노톤을 유지합니다.
2. **시그니처 비주얼**: 스토리 테두리의 네온 그라디언트(선셋 핑크/오렌지/퍼플)와 더블 탭 하트 팝업 애니메이션을 그대로 구현합니다.
3. **완벽한 반응형 레이아웃**: 데스크톱(확장 사이드바)과 모바일(상단 헤더 + 하단 탭바)에 최적화된 유기적 적응형 UI를 제공합니다.

### 2.2 CSS 디자인 토큰 (`src/styles/variables.css`)
```css
:root {
  /* 라이트 모드 (Default) */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-elevated: #ffffff;
  --text-primary: #262626;
  --text-secondary: #737373;
  --text-muted: #8e8e8e;
  --border-color: #dbdbdb;
  --border-subtle: #efefef;
  --ig-primary-button: #0095f6;
  --ig-primary-button-hover: #1877f2;
  --ig-danger: #ed4956;
  --ig-link: #00376b;

  /* 시그니처 그라디언트 (스토리 링) */
  --story-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  --story-gray: #dbdbdb;

  /* 타이포그래피 */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  
  /* 반응형 분기점 규격 */
  --sidebar-width-expanded: 244px;
  --sidebar-width-collapsed: 72px;
  --feed-max-width: 630px;
  --right-sidebar-width: 320px;
}

[data-theme='dark'] {
  --bg-primary: #000000;
  --bg-secondary: #121212;
  --bg-elevated: #262626;
  --text-primary: #f5f5f5;
  --text-secondary: #a8a8a8;
  --text-muted: #737373;
  --border-color: #262626;
  --border-subtle: #1f1f1f;
  --ig-primary-button: #0095f6;
  --ig-primary-button-hover: #1877f2;
  --ig-link: #e0f1ff;
  --story-gray: #363636;
}
```

---

## 3. 프론트엔드 프로젝트 구조

```
frontend/
├── public/
│   ├── favicon.ico
│   └── default-avatar.png
├── src/
│   ├── assets/              # 로고, 정적 일러스트, 브랜드 에셋
│   ├── components/
│   │   ├── common/          # 공통 UI 컴포넌트
│   │   │   ├── Avatar.jsx           # 크기별(sm, md, lg, xl) 및 스토리 링 지원 아바타
│   │   │   ├── Button.jsx           # Filled, Outline, Text, Follow 전용 버튼
│   │   │   ├── Modal.jsx            # 모달 베이스 프레임 (Esc 닫기, 배경 블러)
│   │   │   ├── LoadingSpinner.jsx   # 인스타그램 스피너
│   │   │   └── HeartAnimation.jsx   # 더블 탭 시 나타나는 팝업 하트
│   │   │
│   │   ├── layout/          # 내비게이션 및 레이아웃 셸
│   │   │   ├── AppLayout.jsx        # 전체 셸 (반응형 사이드바/헤더/바텀바 포함)
│   │   │   ├── DesktopSidebar.jsx   # 좌측 내비게이션 (확장/축소 모드)
│   │   │   ├── MobileHeader.jsx     # 모바일 상단 로고 + DM/알림 아이콘
│   │   │   └── MobileBottomBar.jsx  # 모바일 하단 5대 탭 (홈/검색/생성/릴스/프로필)
│   │   │
│   │   ├── feed/            # 피드 관련 컴포넌트
│   │   │   ├── StoryTray.jsx        # 상단 원형 스토리 횡스크롤 트레이
│   │   │   ├── PostCard.jsx         # 게시물 메인 카드
│   │   │   ├── MediaCarousel.jsx    # 다중 이미지 슬라이더 및 인디케이터
│   │   │   ├── PostActions.jsx      # 좋아요, 댓글, DM공유, 북마크 액션 바
│   │   │   └── CommentSection.jsx   # 캡션 및 댓글 미리보기/입력창
│   │   │
│   │   ├── post-create/     # 새 게시물 작성 모달 컴포넌트
│   │   │   ├── CreatePostModal.jsx  # 다단계 작성 모달
│   │   │   ├── DropZone.jsx         # 파일 드래그 앤 드롭 영역
│   │   │   ├── ImageEditor.jsx      # 이미지 자르기(1:1, 4:5, 16:9) 및 필터 프리뷰
│   │   │   └── CaptionInput.jsx     # 캡션 작성 및 이모지 피커
│   │   │
│   │   ├── story-viewer/    # 스토리 전체화면 뷰어
│   │   │   ├── StoryViewerModal.jsx
│   │   │   └── StoryProgressBar.jsx # 상단 n초 진행 막대
│   │   │
│   │   └── profile/         # 프로필 페이지 컴포넌트
│   │       ├── ProfileHeader.jsx    # 아바타, 카운터, 바이오, 프로필 편집 버튼
│   │       ├── ProfileTabs.jsx      # 게시물 / 저장됨 / 태그됨 탭
│   │       └── PostGrid.jsx         # 3x3 썸네일 그리드 (호버 정보 포함)
│   │
│   ├── contexts/            # 전역 상태 컨텍스트
│   │   ├── AuthContext.jsx          # 사용자 인증 상태, 로그인/로그아웃 함수
│   │   ├── ModalContext.jsx         # 글로벌 모달 제어 (작성, 상세뷰, 팔로우 목록)
│   │   └── ThemeContext.jsx         # 다크/라이트 테마 제어
│   │
│   ├── hooks/               # 커스텀 훅
│   │   ├── useInfiniteScroll.js     # IntersectionObserver 기반 무한 스크롤
│   │   ├── useDoubleClick.js        # 더블 클릭/탭 감지 (하트 애니메이션)
│   │   └── useDebounce.js           # 검색어 디바운싱
│   │
│   ├── pages/               # 라우트 페이지 컴포넌트
│   │   ├── HomePage.jsx             # 메인 피드 (홈)
│   │   ├── ExplorePage.jsx          # 탐색 (3열 그리드 피드)
│   │   ├── ProfilePage.jsx          # 유저 프로필 (`/:username`)
│   │   ├── EditProfilePage.jsx      # 프로필 수정 페이지
│   │   ├── LoginPage.jsx            # 로그인
│   │   ├── SignupPage.jsx           # 회원가입
│   │   └── NotFoundPage.jsx         # 404 페이지
│   │
│   ├── services/            # 백엔드 API 통신 모듈
│   │   ├── api.js                   # Axios 인스턴스 및 인터셉터
│   │   ├── authApi.js
│   │   ├── postApi.js
│   │   ├── userApi.js
│   │   └── storyApi.js
│   │
│   ├── styles/              # 전역 스타일 및 유틸리티
│   │   ├── index.css
│   │   └── variables.css
│   │
│   ├── App.jsx              # 라우팅 테이블 정의
│   └── main.jsx             # React DOM 렌더링
```

---

## 4. 핵심 페이지 및 UI 인터랙션 명세

### 4.1 메인 홈 피드 (`HomePage.jsx`)
- **구조**:
  - `Left`: 상시 고정 내비게이션 사이드바 (데스크톱)
  - `Center (최대 630px)`:
    - **스토리 트레이 (`StoryTray`)**: 좌우 패딩이 적용된 수평 스크롤 컨테이너. 스토리 미시청 유저는 컬러풀한 그라디언트 테두리, 시청 완료 시 그레이 테두리 표시. 본인 아바타에는 `+` 아이콘이 있어 즉시 스토리 등록 모달 트리거.
    - **피드 목록**: `PostCard`의 연속적 렌더링. 하단 도달 시 무한 스크롤(`useInfiniteScroll`)로 10개씩 자동 로드.
  - `Right (320px, 화면 폭 1200px 이상 시 표시)`:
    - 현재 로그인한 유저의 아바타, 계정명, 전환 버튼
    - '회원님을 위한 추천' 유저 리스트 (5명) 및 '팔로우' 버튼
    - Instagram 정보/도움말/저작권 푸터 링크

### 4.2 게시물 카드 (`PostCard.jsx`) & 미디어 슬라이더
- **카드 헤더**: 아바타, 사용자명, 작성 위치, 옵션 메뉴(더보기 `···` 아이콘 - 링크 복사, 신고, 작성자인 경우 삭제/수정)
- **미디어 영역 (`MediaCarousel`)**:
  - 종횡비: 1:1 정사각형 또는 4:5 세로 비율 고정 (레이아웃 시프트 방지)
  - 다중 미디어: 좌/우 네비게이션 화살표, 하단 동그라미 인디케이터(Dots) 표시, 모바일 터치 스와이프 지원
  - **더블 탭 제스처**: 사진을 더블 탭/클릭하면 화면 정중앙에 크고 붉은 하트 아이콘이 솟아올랐다가 서서히 사라지는 스케일 애니메이션(`HeartAnimation`) 작동 및 좋아요 카운트 즉각 반영.
- **액션 바 (`PostActions`)**:
  - 좋아요(하트) 아이콘: 클릭 시 빨간색 채움 + 튀어 오르는 바운스 애니메이션
  - 댓글(말풍선) 아이콘: 클릭 시 포커스를 댓글 인풋으로 이동하거나 상세 모달 열기
  - 공유(비행기) 아이콘
  - 북마크(리본) 아이콘: 우측 끝 정렬, 클릭 시 채워진 아이콘으로 토글
- **본문 및 댓글 영역**:
  - "좋아요 n개"
  - `username` + 캡션 본문 (2줄 이상일 경우 "... 더보기" 링크 제공)
  - "댓글 n개 모두 보기" 링크 (클릭 시 상세 모달 오픈)
  - 최근 댓글 1~2개 인라인 노출
  - "댓글 달기..." 인풋 및 '게시' 버튼 (내용이 1자 이상일 때만 파란색 활성화)

### 4.3 게시물 작성 모달 (`CreatePostModal.jsx`)
- **스텝 1: 파일 선택**:
  - 드래그 앤 드롭 영역 또는 '컴퓨터에서 선택' 버튼
  - 다중 파일 선택 지원 (최대 10장)
- **스텝 2: 편집 및 필터**:
  - 가로 세로 비율 선택기 (원본, 1:1, 4:5, 16:9)
  - 확대/축소 및 슬라이더 순서 변경
- **스텝 3: 정보 입력 및 공유**:
  - 좌측: 완성된 미디어 프리뷰 슬라이더
  - 우측: 본인 프로필 정보, 캡션 텍스트에어리어 (글자 수 카운터, 이모지 피커), 위치 추가 인풋, 고급 설정(댓글 기능 해제)
  - '공유하기' 클릭 시 로딩 스피너 노출 후 피드 최상단에 자동 삽입 및 모달 닫힘

### 4.4 탐색(Explore) 페이지 (`ExplorePage.jsx`)
- 3열 균일 그리드 (`grid-template-columns: repeat(3, 1fr)`, 간격 4px 또는 28px)
- 각 그리드 아이템 호버 시 어두운 오버레이와 함께 좋아요 수 및 댓글 수 아이콘 노출
- 다중 이미지 게시물은 우측 상단에 겹친 사각형 아이콘 표시
- 아이템 클릭 시 URL 파라미터 또는 모달 상태로 `PostDetailModal` 호출

### 4.5 24시간 스토리 뷰어 (`StoryViewerModal.jsx`)
- 전체 화면 다크 오버레이
- 상단: 사용자 아바타, 닉네임, 업로드 경과 시간(예: '3시간 전'), 닫기 버튼
- 상단 인디케이터: 보유한 스토리 개수만큼 균등 분할된 프로그레스 바. 현재 활성 스토리는 5초 동안 0%에서 100%로 `requestAnimationFrame` 또는 CSS 트랜지션으로 채워짐.
- 화면 좌측 클릭: 이전 스토리로 이동
- 화면 우측 클릭: 다음 스토리로 이동
- 마우스 길게 누르기(Long Press): 타이머 일시정지 (스토리 자세히 보기 지원)
- 모든 스토리 완료 시 자동으로 다음 유저의 스토리로 넘어가거나 뷰어 닫힘

### 4.6 사용자 프로필 페이지 (`ProfilePage.jsx`)
- **프로필 헤더**:
  - 대형 원형 아바타 (150px)
  - 계정명 및 버튼 그룹:
    - 본인인 경우: '프로필 편집', '보관된 스토리 보기', 설정 아이콘
    - 타인인 경우: '팔로우' / '팔로잉' (클릭 시 언팔로우 확인 팝업), '메시지 보내기'
  - 통계 정보: **게시물 n**, **팔로워 n**, **팔로우 n** (팔로워/팔로우 클릭 시 모달 목록 표시)
  - 풀네임, 바이오 줄바꿈 지원, 외부 링크
- **탭 메뉴**:
  - `게시물` (그리드 아이콘)
  - `저장됨` (북마크 아이콘 - 본인 계정에서만 탭 노출)
  - `태그됨` (사람 태그 아이콘)
- **컨텐츠 그리드**: 해당 탭에 맞는 게시물 목록 출력

---

## 5. 상태 관리 및 API 통신 아키텍처

### 5.1 `AuthContext` 명세
```javascript
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기화 시 토큰 검증 및 내 정보(GET /api/auth/me) 로딩
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials) => { ... };
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.2 Axios 인터셉터 설정 (`services/api.js`)
- 요청 인터셉터: `localStorage`의 `access_token`이 존재하면 `Authorization: Bearer <token>` 자동 주입
- 응답 인터셉터:
  - 401 Unauthorized 에러 수신 시:
    1. 저장된 `refresh_token`으로 `POST /api/auth/refresh` 요청 수행
    2. 갱신 성공 시 새 `access_token` 저장 후 기존 실패했던 요청 자동 재시도
    3. 갱신 실패 시 토큰 삭제 및 `/login`으로 리다이렉트
