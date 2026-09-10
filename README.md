# 📸 Instagram Clone

> **React 18(Vite)**, **FastAPI**, **SQLite** 기반으로 구현된 고품질 풀스택 인스타그램 클론 프로젝트입니다.  
> 실제 인스타그램의 핵심 인터랙션(피드, 릴스, 스토리, DM, 다크 모드, 어드민 대시보드)을 완성도 높게 재현했습니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 피드 & 포스트 (Feed & Posts)
- **다중 미디어 캐러셀**: 슬라이드 형태의 사진 브라우징 및 인디케이터
- **더블 탭 하트 애니메이션**: 인스타그램 고유의 하트 팝업 인터랙션
- **좋아요 & 북마크**: 즉각적인 낙관적 업데이트(Optimistic UI)
- **댓글 & 대댓글**: 스레드형 댓글 작성, 삭제 및 좋아요
- **게시물 생성**: 드래그 앤 드롭 업로드, 이미지 미리보기, 캡션 입력

### 2. 릴스 (Reels)
- **숏폼 비디오 플레이어**: 풀스크린 수직 스크롤 릴스 피드
- **비디오 컨트롤**: 자동 재생, 음소거 토글, 진행 표시줄
- **릴스 인터랙션**: 좋아요, 댓글 서랍(Drawer), 공유 모달

### 3. 스토리 (Stories)
- **스토리 트레이**: 그라디언트 링 아바타 목록
- **전체화면 스토리 뷰어**: 5초 타이머 자동 프로그레스 바, 탭/클릭으로 이전/다음 전환
- **24시간 자동 만료** 로직 지원

### 4. 실시간 스타일 다이렉트 메시지 (Direct Messages)
- 대화방 목록 및 1:1 메시지 스레드 인터페이스
- 상대방 검색 및 신규 대화 시작 모달

### 5. 탐색 & 검색 (Explore & Search)
- 인스타그램 특유의 반응형 3열 비대칭 그리드 레이아웃
- 사용자 검색 및 추천 계정 목록

### 6. 프로필 & 설정 (Profile & Settings)
- 게시물 / 릴스 / 저장됨(북마크) 탭 뷰
- 프로필 정보 수정 및 아바타 변경
- 스토리 하이라이트 생성 및 재생
- 다크 모드 / 라이트 모드 테마 전환

### 7. 관리자 대시보드 (Admin Dashboard)
- 전체 사용자, 게시물, 릴스 통계 차트
- 악성 콘텐츠 및 사용자 관리 기능

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Core**: React 18, Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios (인터셉터를 통한 JWT 자동 주입)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (CSS Variables 기반 디자인 시스템, 다크 모드 완벽 지원)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn (ASGI)
- **ORM & Database**: SQLAlchemy 2.0, SQLite (WAL 모드 활성화)
- **Validation**: Pydantic v2
- **Auth & Security**: JWT (python-jose), Password Hashing (passlib bcrypt)
- **Media Handling**: Pillow, Multipart Upload

---

## 📁 프로젝트 구조 (Directory Structure)

```text
my_instagram/
├── backend/                  # FastAPI 백엔드
│   ├── app/
│   │   ├── core/             # 인증, 보안, 의존성 주입
│   │   ├── models/           # SQLAlchemy DB 모델
│   │   ├── schemas/          # Pydantic DTO 스키마
│   │   ├── routers/          # API 엔드포인트 라우터
│   │   ├── database.py       # DB 커넥션 설정
│   │   └── main.py           # 앱 엔트리포인트
│   ├── scripts/              # DB 초기화 및 시드 데이터 스크립트
│   ├── requirements.txt      # 파이썬 패키지 목록
│   └── .env.example          # 백엔드 환경변수 예시
│
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 도메인별 UI 컴포넌트
│   │   ├── contexts/         # 전역 상태 (Auth, Theme, Modal)
│   │   ├── hooks/            # 커스텀 훅 (무한 스크롤 등)
│   │   ├── pages/            # 페이지 라우트 컴포넌트
│   │   ├── services/         # Axios API 클라이언트 모듈
│   │   └── styles/           # 디자인 토큰 & 전역 CSS
│   ├── package.json
│   └── vite.config.js
│
├── start.bat                 # Windows 원클릭 동시 실행 스크립트
└── README.md
```

---

## 🚀 시작하기 (Getting Started)

### 사전 요구사항 (Prerequisites)
- **Node.js**: v18.x 이상
- **Python**: v3.10 이상

---

### 방법 1. 원클릭 실행 (Windows)
루트 폴더의 `start.bat`을 더블 클릭하거나 터미널에서 실행하면 프론트엔드와 백엔드가 자동으로 동시 실행됩니다.

```bash
start.bat
```

---

### 방법 2. 수동 실행

#### 1) 백엔드 (FastAPI) 설정 및 실행
```bash
# 1. backend 폴더로 이동
cd backend

# 2. 파이썬 가상환경 생성 및 활성화
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

# 3. 의존성 패키지 설치
pip install -r requirements.txt

# 4. 초기 DB 마이그레이션 & 시드 데이터 생성 (필요 시)
python scripts/seed_db.py

# 5. 서버 실행
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- 백엔드 API 주소: `http://localhost:8000`
- 대화형 Swagger 문서: `http://localhost:8000/docs`

#### 2) 프론트엔드 (React) 설정 및 실행
새 터미널을 열고 다음을 진행합니다:

```bash
# 1. frontend 폴더로 이동
cd frontend

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```
- 프론트엔드 접속 주소: `http://localhost:5173`

---

## 🧪 테스트 계정 정보 (Test Credentials)

시드 스크립트(`scripts/seed_db.py`) 실행 시 기본 제공되는 테스트 계정입니다:

| 구분 | 사용자명 (Username) | 비밀번호 (Password) |
|---|---|---|
| 일반 사용자 | `testuser` | `password123` |
| 관리자 계정 | `admin` | `admin123` |

---

## 📄 라이선스 (License)
This project is open-sourced under the MIT License.
