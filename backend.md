# ⚙️ Instagram 클론 백엔드 개발 명세서 (backend.md)

본 문서는 **현재 완성된 프론트엔드 UI/UX 디자인 및 데이터 구조를 100% 기준으로 최적화**하여 재정의한 백엔드 개발 명세서입니다. 불필요하거나 UI에 존재하지 않는 사양은 배제하고, **개발(Dev) 및 프로덕션(Prod) 환경 모두 SQLite3 엔진을 단일 표준으로 사용하여 최고 수준의 안정성과 속도를 낼 수 있도록 설계**되었습니다.

> **📋 최종 검토 및 수정 (2026-09-07)**: 프론트엔드 코드 및 실제 모델과 문서 간 불일치 7건 수정 완료. 수정 내역은 문서 말미 **섹션 8 변경 이력** 참조.

---

## 1. 개요 및 기술 스택

### 1.1 기술 스택
- **Language**: Python 3.10+
- **Framework**: FastAPI (최신 비동기 웹 프레임워크)
- **Database Engine**: **SQLite 3 (개발 및 프로덕션 공통 사용)**
- **Database Optimization**: WAL(Write-Ahead Logging) 모드, 메모리 캐시 64MB, Busy Timeout 5초
- **ORM**: SQLAlchemy 2.0+ (Declarative Mapping)
- **Data Validation & Serialization**: Pydantic v2
- **Authentication**: JWT (JSON Web Token - Access Token 60분, Refresh Token 14일)
- **Security**: Passlib with Bcrypt (비밀번호 단방향 암호화)
- **Static & Media Serving**: FastAPI `StaticFiles` (`/uploads/`)
- **Server / ASGI**: Uvicorn

---

## 2. SQLite 프로덕션 최적화 아키텍처

SQLite를 상용/운영 환경에서도 병목 없이 안정적으로 구동하기 위해 아래 **5가지 필수 PRAGMA 설정**과 SQLAlchemy 엔진 커넥션 훅을 시스템 전역에 강제합니다.

### 2.1 필수 SQLite PRAGMA 설정
1. `PRAGMA journal_mode = WAL;`
   - Write-Ahead Logging을 활성화하여 **읽기(Reader) 작업과 쓰기(Writer) 작업이 서로를 블로킹하지 않고 완전 동시 처리**됩니다.
2. `PRAGMA synchronous = NORMAL;`
   - 디스크 동기화 부하를 획기적으로 줄여 쓰기 속도를 수 배 향상시키며, OS 크래시 시에도 데이터 무결성을 보장합니다.
3. `PRAGMA foreign_keys = ON;`
   - SQLite 기본 비활성 상태인 외래키(Foreign Key) CASCADE 제약조건을 강제하여 부모 삭제 시 자식 데이터 자동 정리를 보장합니다.
4. `PRAGMA busy_timeout = 5000;`
   - 동시 다발적 쓰기 트랜잭션 발생 시 `database is locked` 에러를 방지하고, **최대 5초간 대기하며 락이 풀리는 즉시 자동 실행**합니다.
5. `PRAGMA cache_size = -64000;`
   - SQLite 전용 페이지 캐시를 64MB로 확장하여 피드 및 릴스 반복 조회를 메모리에서 초고속 처리합니다.

### 2.2 SQLAlchemy 엔진 구성 코드 (`app/database.py`)
```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, DeclarativeBase
from sqlalchemy.engine import Engine
from app.config import settings

class Base(DeclarativeBase):
    pass

engine = create_engine(
    settings.DATABASE_URL,  # sqlite:///./instagram.db
    connect_args={
        "check_same_thread": False,  # 멀티스레드 FastAPI 지원
        "timeout": 15
    },
    # SQLite는 connection pool을 지원하지 않음 (pool_size / max_overflow 사용 불가)
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 3. 프로젝트 디렉터리 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI 진입점, CORS, 정적 라우트(/uploads), 라우터 등록
│   ├── config.py              # 환경 변수 (pydantic-settings)
│   ├── database.py            # SQLite 엔진, PRAGMA 이벤트 리스너, get_db
│   │
│   ├── core/                  # 보안 및 공통 의존성
│   │   ├── __init__.py
│   │   ├── security.py        # Bcrypt 해싱, JWT 발급/검증
│   │   └── deps.py            # get_current_user, get_optional_user
│   │
│   ├── models/                # 디자인 화면 1:1 대응 SQLite 모델
│   │   ├── __init__.py
│   │   ├── user.py            # 유저 정보 및 프로필
│   │   ├── follow.py          # 팔로우/팔로워
│   │   ├── post.py            # 피드 게시물 및 다중 미디어
│   │   ├── reel.py            # 릴스 (9:16 비디오, 오디오 정보, 태그 유저)
│   │   ├── comment.py         # 게시물 및 릴스 댓글
│   │   ├── like.py            # 게시물, 릴스, 댓글 좋아요
│   │   ├── bookmark.py        # 게시물 및 릴스 북마크(저장됨)
│   │   ├── story.py           # 24시간 스토리 및 시청 기록
│   │   ├── direct.py          # 1:1 DM 대화방 및 메시지, 하트 리액션
│   │   └── notification.py    # 좋아요/댓글/팔로우 알림
│   │
│   ├── schemas/               # Pydantic 입출력 DTO
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── reel.py
│   │   ├── direct.py
│   │   ├── story.py
│   │   └── common.py
│   │
│   └── routers/               # 프론트엔드 통신 REST API 컨트롤러
│       ├── __init__.py
│       ├── auth.py            # /api/auth
│       ├── users.py           # /api/users
│       ├── follows.py         # /api/follows
│       ├── posts.py           # /api/posts
│       ├── reels.py           # /api/reels
│       ├── explore.py         # /api/explore
│       ├── direct.py          # /api/direct
│       ├── stories.py         # /api/stories
│       ├── notifications.py   # /api/notifications
│       └── uploads.py         # /api/uploads
│
├── uploads/                   # 미디어 저장소
│   ├── profiles/
│   ├── posts/
│   ├── reels/
│   ├── stories/
│   └── direct/
├── scripts/
│   └── seed_data.py           # 프론트엔드 더미 데이터(5개 릴스, 피드, DM) 시딩 스크립트
├── requirements.txt
└── .env.example
```

---

## 4. 데이터베이스 테이블 스키마 (SQLite DDL)

프론트엔드 컴포넌트(`HomePage`, `ReelsPage`, `ExplorePage`, `DirectPage`, `ProfilePage`, `StoryTray`)에 존재하는 필드만을 정밀 매핑한 DDL입니다.

```sql
-- 1. 사용자 테이블 (users)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    website TEXT,
    profile_image_url TEXT,
    is_private INTEGER NOT NULL DEFAULT 0,  -- 0: 공개, 1: 비공개
    is_verified INTEGER NOT NULL DEFAULT 0, -- 0: false, 1: true
    gender TEXT,                            -- 'male', 'female', 'not_specified'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_username ON users (username);

-- 2. 팔로우 관계 (follows)
CREATE TABLE follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted', -- 'accepted' | 'pending' (비공개 계정 승인 대기)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (follower_id, following_id),
    CHECK (follower_id != following_id)      -- 자기 자신 팔로우 방지
);
CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_following ON follows (following_id);

-- 3. 피드 게시물 (posts) & 미디어 (post_media)
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_posts_user_created ON posts (user_id, created_at DESC);

CREATE TABLE post_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video'
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_post_media_post ON post_media (post_id, order_index ASC);

-- 4. 릴스 (reels - 9:16 비디오 숏폼)
CREATE TABLE reels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    poster_url TEXT,
    caption TEXT,
    tagged_user TEXT,                      -- e.g. "qkqkfl4"
    audio_title TEXT NOT NULL,             -- e.g. "Original Audio • qkqkfl4"
    audio_cover_url TEXT,
    audio_is_explicit INTEGER NOT NULL DEFAULT 0,
    shares_count INTEGER NOT NULL DEFAULT 0,
    reposts_count INTEGER NOT NULL DEFAULT 0, -- 프론트엔드 repostsCount 대응
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reels_created ON reels (created_at DESC);

-- 5. 댓글 (comments - 게시물 및 릴스 공용)
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (post_id IS NOT NULL OR reel_id IS NOT NULL)
);
CREATE INDEX idx_comments_post ON comments (post_id, created_at ASC);
CREATE INDEX idx_comments_reel ON comments (reel_id, created_at ASC);

-- 6. 좋아요 (likes - 게시물, 릴스, 댓글)
-- ⚠️ SQLite UNIQUE + NULL 버그 주의:
--    UNIQUE(user_id, NULL)은 SQLite에서 여러 행을 허용합니다.
--    이를 방지하기 위해 CHECK 제약으로 정확히 하나의 대상만 지정하도록 강제합니다.
CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, post_id),
    UNIQUE (user_id, reel_id),
    UNIQUE (user_id, comment_id),
    CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN reel_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);
CREATE INDEX idx_likes_post ON likes (post_id);
CREATE INDEX idx_likes_reel ON likes (reel_id);
CREATE INDEX idx_likes_comment ON likes (comment_id);

-- 7. 북마크 / 저장됨 (bookmarks - 게시물 및 릴스)
-- ⚠️ likes 테이블과 동일한 NULL UNIQUE 버그 방어 적용
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, post_id),
    UNIQUE (user_id, reel_id),
    CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN reel_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);
CREATE INDEX idx_bookmarks_user ON bookmarks (user_id, created_at DESC);

-- 8. 24시간 스토리 (stories) & 시청 기록 (story_views)
CREATE TABLE stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    expires_at TEXT NOT NULL,              -- 24시간 뒤 만료 시점 (ISO-8601 DATETIME)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stories_active ON stories (user_id, expires_at);

CREATE TABLE story_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (story_id, user_id)
);

-- 9. 다이렉트 메시지 (conversations & messages)
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,                   -- "conv-1" or UUID
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user1_id, user2_id)
);
CREATE INDEX idx_conv_users ON conversations (user1_id, user2_id);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,                   -- "msg-101" or UUID
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT,
    media_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    reactions TEXT DEFAULT '[]',          -- JSON 배열 e.g. ["❤️"]
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_conv ON messages (conversation_id, created_at ASC);

-- 10. 활동 알림 (notifications)
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                    -- 'like_post', 'like_reel', 'comment', 'follow'
    target_id INTEGER,                     -- post_id or reel_id
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, is_read, created_at DESC);
```

---

## 5. RESTful API 엔드포인트 명세

### 5.1 인증 (Auth) API (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | 신규 회원가입 (`username`, `email`, `password`, `full_name`) | No |
| `POST` | `/api/auth/login` | 로그인 (`username_or_email`, `password` -> JWT 토큰 및 유저 프로필 반환) | No |
| `POST` | `/api/auth/refresh` | Access Token 무중단 갱신 (`refresh_token`) | No |
| `GET` | `/api/auth/me` | 현재 로그인된 사용자 정보 조회 | Bearer Token |
| `PUT` | `/api/auth/password` | 비밀번호 변경 (`old_password`, `new_password`) - EditProfilePage 보안 탭 대응 | Bearer Token |

---

### 5.2 사용자 및 프로필 (Users) API (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/{username}` | 프로필 상단 헤더 정보 조회 (게시물수, 팔로워수, 팔로잉수, 맞팔 여부, 바이오, `is_private` 등) | Optional |
| `GET` | `/api/users/{username}/posts` | 특정 사용자의 게시물 목록 조회 (`ProfilePage` 게시물 탭 대응, 최신순) | Optional |
| `GET` | `/api/users/{username}/reels` | 특정 사용자의 릴스 목록 조회 (`ProfilePage` 릴스 탭 대응, 최신순) | Optional |
| `GET` | `/api/users/saved` | 본인이 북마크한 저장됨 게시물 목록 (`ProfilePage` 저장됨 탭 대응) | Bearer Token |
| `PUT` | `/api/users/profile` | 프로필 정보 수정 (`full_name`, `username`, `bio`, `website`, `gender`, `is_private`) | Bearer Token |
| `PUT` | `/api/users/profile/image` | 프로필 사진 업로드 및 변경 | Bearer Token |
| `DELETE`| `/api/users/profile/image`| 프로필 사진 제거 (기본 이미지로 리셋) | Bearer Token |
| `GET` | `/api/users/suggestions` | 홈 피드 우측 '회원님을 위한 추천' 유저 5명 목록 | Optional |
| `GET` | `/api/users/search` | 사용자 검색 (`?q=keyword`) - username 및 full_name 검색 (DM 대화상대 검색 등) | Optional |

---

### 5.3 팔로우 (Follows) API (`/api/follows`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/follows/{user_id}` | 팔로우 / 언팔로우 즉시 토글 (대상 비공개 계정 여부에 따라 `status: 'accepted'` 또는 `'pending'` 반환) | Bearer Token |
| `GET` | `/api/users/{user_id}/followers` | 특정 사용자의 팔로워 목록 (`FollowersModal` 대응) | Optional |
| `GET` | `/api/users/{user_id}/following` | 특정 사용자의 팔로잉 목록 (`FollowersModal` 대응) | Optional |

- 팔로우 토글 응답 형식:
```json
{
  "following": true,
  "status": "accepted" // 비공개 계정 대상일 경우 "pending" (요청됨)
}
```

---

### 5.4 홈 피드 및 게시물 (Posts) API (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/feed` | 홈 메인 피드 (팔로우한 유저 + 추천 게시물, 최신순, 커서 페이지네이션) | Optional |
| `POST` | `/api/posts` | 새 게시물 생성 (`media: [{url, type, order}]`, `caption`, `location`) | Bearer Token |
| `GET` | `/api/posts/{post_id}` | 게시물 상세 모달용 단건 조회 (`PostDetailModal`) | Optional |
| `DELETE`| `/api/posts/{post_id}` | 게시물 삭제 (본인 작성물) | Bearer Token |
| `POST` | `/api/posts/{post_id}/likes` | 게시물 좋아요 토글 (하트 클릭 및 더블 탭) | Bearer Token |
| `POST` | `/api/posts/{post_id}/bookmarks`| 게시물 북마크/저장 토글 | Bearer Token |
| `GET` | `/api/posts/{post_id}/comments` | 게시물 댓글 목록 조회 | Optional |
| `POST` | `/api/posts/{post_id}/comments` | 게시물 새 댓글 등록 | Bearer Token |
| `DELETE`| `/api/comments/{comment_id}` | 댓글 삭제 (작성자 또는 게시물 소유자) | Bearer Token |
| `POST` | `/api/comments/{comment_id}/likes`| 댓글 좋아요 토글 | Bearer Token |

---

### 5.5 릴스 (Reels) API (`/api/reels`)
*프론트엔드 `ReelsPage` 및 `ReelCard`와 100% 일치하도록 구성된 전용 엔드포인트*

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reels` | 9:16 릴스 스트림 목록 (최신순 또는 추천순, 커서 페이징 지원) | Optional |
| `POST` | `/api/reels` | 새 릴스 업로드 (`video_url`, `poster_url`, `caption`, `tagged_user`, `audio_title`) | Bearer Token |
| `POST` | `/api/reels/{reel_id}/likes` | 릴스 좋아요 토글 (우측 하트 버튼 및 영상 더블탭) | Bearer Token |
| `POST` | `/api/reels/{reel_id}/bookmarks` | 릴스 북마크/저장 토글 | Bearer Token |
| `GET` | `/api/reels/{reel_id}/comments` | 릴스 댓글 목록 조회 (`ReelsCommentDrawer`) | Optional |
| `POST` | `/api/reels/{reel_id}/comments` | 릴스 새 댓글 작성 (`ReelsCommentDrawer`) | Bearer Token |
| `POST` | `/api/reels/{reel_id}/share` | 릴스 공유 카운트 1 증가 | Optional |
| `POST` | `/api/reels/{reel_id}/repost` | 릴스 리포스트 카운트 1 증가 (`reposts_count` 대응) | Bearer Token |

#### 릴스 응답 JSON 규격 (`GET /api/reels`):
```json
[
  {
    "id": 1,
    "videoUrl": "/videos/reel1.mp4",
    "posterUrl": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
    "author": {
      "id": 1,
      "username": "x. .rb",
      "fullName": "x. .rb",
      "profileImageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      "isVerified": false,
      "isFollowing": false
    },
    "taggedUser": "qkqkfl4",
    "caption": "😎",
    "audio": {
      "title": "Original Audio • qkqkfl4",
      "isExplicit": false,
      "coverUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"
    },
    "likesCount": 435,
    "isLiked": false,
    "commentsCount": 2,
    "sharesCount": 10,
    "repostsCount": 12,
    "isBookmarked": false,
    "comments": [
      {
        "id": 101,
        "username": "dance_lover_kr",
        "profileImageUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        "text": "두 분 춤선 너무 힙하고 멋져요! 선글라스 어디 제품인가요? 😎✨",
        "timeAgo": "15분 전",
        "likes": 3
      }
    ]
  }
]
```

---

### 5.6 탐색 (Explore) API (`/api/explore`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/explore` | 4열 미디어 그리드 조회 (`?q=keyword` 검색 지원) | Optional |

- 검색 키워드 `q`가 주어지면: 게시물/릴스의 `title`, `caption`, 작성자의 `username`, `full_name`을 SQLite `LIKE` 절로 검색
- 반환 형식: `ExplorePage`의 4:5 그리드 카드 렌더링에 필요한 `id`, `title`, `mediaUrl`, `isVideo`, `likesCount`, `commentsCount`, `author`, `caption` 반환

---

### 5.7 다이렉트 메시지 (Direct) API (`/api/direct`)
*프론트엔드 `DirectPage.jsx`, `ConversationList.jsx`, `ChatThread.jsx`와 100% 일치*

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/direct/conversations` | 내 1:1 대화방 목록 조회 (상대방 프로필, 최신 메시지, 안읽은 수) | Bearer Token |
| `POST` | `/api/direct/conversations` | 특정 유저와의 대화방 생성 또는 기존 방 조회 (`target_user_id`) | Bearer Token |
| `GET` | `/api/direct/conversations/{conv_id}/messages` | 특정 대화방의 메시지 타임라인 조회 | Bearer Token |
| `POST` | `/api/direct/conversations/{conv_id}/messages` | 메시지 전송 (`text`, `media_url`) | Bearer Token |
| `POST` | `/api/direct/conversations/{conv_id}/read` | 대화방 내 모든 수신 메시지 읽음 처리 (`is_read = 1`) | Bearer Token |
| `POST` | `/api/direct/messages/{msg_id}/reactions` | 메시지 하트(`❤️`) 반응 토글 | Bearer Token |

#### 대화방 목록 응답 JSON 예시 (`GET /api/direct/conversations`):
```json
[
  {
    "id": "conv-1",
    "partner": {
      "id": 201,
      "username": "전진님",
      "full_name": "전진",
      "profile_image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150",
      "is_verified": false,
      "is_online": false,
      "last_active": "4주 전 활동",
      "is_muted": false,
      "has_story": false
    },
    "unread_count": 0,
    "time_ago": "4주",
    "messages": [
      {
        "id": "msg-101",
        "sender_id": 201,
        "text": "형 저번에 추천해주신 카페 가봤어요 ㅋㅋㅋ",
        "mediaUrl": null,
        "created_at": "오후 2:30",
        "is_read": true,
        "reactions": ["❤️"]
      }
    ]
  }
]
```

---

### 5.8 스토리 (Stories) API (`/api/stories`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/stories/feed` | 홈 상단 스토리 트레이 (24시간 활성 스토리 그룹화 목록, `hasUnseen` 상태) | Optional |
| `POST` | `/api/stories` | 스토리 업로드 (`media_url`, `media_type`) | Bearer Token |
| `POST` | `/api/stories/{story_id}/view` | 스토리 시청 완료 등록 | Bearer Token |
| `GET` | `/api/users/{username}/highlights` | 프로필 화면용 스토리 하이라이트 목록 | Optional |

---

### 5.9 알림 (Notifications) API (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | 활동 알림 목록 조회 (최신순) | Bearer Token |
| `PUT` | `/api/notifications/{id}/read` | 단일 알림 읽음 처리 | Bearer Token |
| `PUT` | `/api/notifications/read-all` | 모든 알림 일괄 읽음 처리 | Bearer Token |

---

### 5.10 파일 업로드 (Uploads) API (`/api/uploads`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/uploads/media` | 멀티파트 파일 업로드 (`category`: `posts`, `reels`, `profiles`, `stories`, `direct`) | Bearer Token |

- 허용 확장자: `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`
- 파일명 처리: UUID 기반 난수화 (`{uuid4().hex}.{ext}`)
- 응답: `{ "url": "/uploads/reels/a1b2c3d4.mp4", "media_type": "video" }`

---

## 6. 프론트엔드 데이터 필드 매핑 및 직렬화 가이드

프론트엔드 JavaScript 객체(`camelCase`)와 Python 백엔드(`snake_case`) 간의 직렬화 오차를 완전히 없애기 위해 Pydantic의 `populate_by_name = True` 및 `alias_generator = to_camel`을 기본 적용하거나 엔드포인트 응답에서 프론트 규격에 맞춰 직렬화합니다.

| 프론트엔드 필드 (JavaScript) | 백엔드 DB/API 필드 (Python/SQLite) | 타입 |
|---|---|---|
| `videoUrl` | `video_url` | TEXT |
| `posterUrl` | `poster_url` | TEXT |
| `likesCount` | `likes_count` | INTEGER |
| `isLiked` | `is_liked` | BOOLEAN (0 or 1) |
| `commentsCount` | `comments_count` | INTEGER |
| `isBookmarked` | `is_bookmarked` | BOOLEAN (0 or 1) |
| `profileImageUrl` | `profile_image_url` | TEXT |
| `isVerified` | `is_verified` | BOOLEAN (0 or 1) |
| `isPrivate` | `is_private` | BOOLEAN (0 or 1) |
| `isFollowing` | `is_following` | BOOLEAN (0 or 1) |
| `taggedUser` | `tagged_user` | TEXT |
| `sharesCount` | `shares_count` | INTEGER |
| `repostsCount` | `reposts_count` | INTEGER |
| `unreadCount` | `unread_count` | INTEGER |
| `timeAgo` | `time_ago` (계산된 상대시간 문자열) | TEXT |

---

## 7. 공통 응답 및 예외 처리 규격

### 7.1 성공 응답 (기본)
상태 코드 `200 OK` 또는 `201 Created`와 함께 순수 JSON 객체 또는 배열 반환.

### 7.2 표준 에러 응답
```json
{
  "status_code": 401,
  "error": "UNAUTHORIZED",
  "message": "인증 토큰이 유효하지 않거나 만료되었습니다.",
  "detail": null
}
```

- `400 Bad Request`: 필수 파라미터 누락 또는 잘못된 입력
- `401 Unauthorized`: 인증 토큰 누락 또는 유효하지 않음
- `403 Forbidden`: 본인 작성물이 아닌 게시물/댓글/메시지 수정/삭제 시도
- `404 Not Found`: 대상 유저, 게시물, 릴스, 대화방이 존재하지 않음
- `409 Conflict`: 이미 존재하는 아이디(`username`) 또는 이메일(`email`)
- `422 Unprocessable Entity`: 파일 크기 초과 또는 지원하지 않는 확장자

---

### 8.1 데이터베이스 스키마 및 모델 정합성 수정 (1차)

프론트엔드 실제 코드(`mockData.js`, `reelsData.js`, `mockDirectData.js`, 각 Page 컴포넌트)와 백엔드 SQLAlchemy 모델을 교차 검토하여 발견된 **7건의 불일치를 수정**했습니다.

| # | 대상 파일 | 문제 유형 | 수정 내용 |
|---|---|---|---|
| 1 | `models/user.py` | **누락 필드** | `is_private` 컬럼 추가 (프론트엔드 `mockData.js`의 `is_private: false`와 `db.md` 명세 반영) |
| 2 | `models/follow.py` | **누락 필드 + 누락 제약조건** | `status` 컬럼 추가 (`'accepted'`\|`'pending'`), 자기 팔로우 방지 `CHECK(follower_id != following_id)` 추가 |
| 3 | `models/post.py` | **누락 필드** | `PostMedia`에 `created_at` 컬럼 추가 (`db.md` 명세 반영) |
| 4 | `models/reel.py` | **누락 필드** | `reposts_count` 컬럼 추가 (프론트엔드 `reelsData.js`의 `repostsCount` 반영) |
| 5 | `models/story.py` | **타입 불일치** | `expires_at` 타입을 `String(50)` → `DateTime`으로 수정 (`db.md` 및 실제 사용 패턴 반영) |
| 6 | `models/like.py` & `models/bookmark.py` | **SQLite NULL UNIQUE 버그** | `UNIQUE(user_id, NULL)`이 SQLite에서 무력화되는 문제 방어: `CHECK` 제약으로 "정확히 하나의 대상만 지정" 강제 |
| 7 | `database.py` | **잘못된 엔진 설정** | SQLite가 지원하지 않는 `pool_size=10`, `max_overflow=20` 옵션 제거 |

### 8.2 API 명세 검증 및 프론트엔드-데이터베이스 최적화 (2차)

완성된 프론트엔드 전체 페이지(`HomePage`, `ProfilePage`, `ReelsPage`, `ExplorePage`, `DirectPage`, `EditProfilePage` 등) 및 13개 데이터베이스 테이블과의 정합성을 면밀히 분석하여 누락 엔드포인트 7건을 추가하고, 기존 명세의 불일치 사항을 최적화했습니다.

| # | API 영역 | 변경 유형 | 엔드포인트 및 내용 | 대응 프론트엔드 / DB 사유 |
|---|---|---|---|---|
| 1 | **인증** | **누락 추가** | `PUT /api/auth/password` | `EditProfilePage.jsx`의 비밀번호 변경 양식 (`old_password`, `new_password`) |
| 2 | **사용자** | **누락 추가** | `GET /api/users/{username}/posts` | `ProfilePage.jsx`의 "게시물(Grid)" 탭 렌더링에 필수 |
| 3 | **사용자** | **누락 추가** | `GET /api/users/{username}/reels` | `ProfilePage.jsx`의 "릴스(Reels)" 탭 렌더링에 필수 |
| 4 | **사용자** | **누락 추가** | `GET /api/users/saved` | `ProfilePage.jsx`의 본인 "저장됨(Bookmarks)" 탭 렌더링에 필수 |
| 5 | **사용자** | **필드 보강** | `PUT /api/users/profile` (`is_private` 추가) | `EditProfilePage.jsx`의 비공개 계정 토글 스위치 설정 반영 |
| 6 | **팔로우** | **응답 보강** | `POST /api/follows/{user_id}` (`status` 반환) | 비공개 계정 대상 팔로우 시 `status: 'pending'`(요청됨) UI 처리 및 DB `follows.status` 매칭 |
| 7 | **릴스** | **누락 추가** | `POST /api/reels/{reel_id}/repost` | 프론트 `reelsData.js`의 `repostsCount` 및 DB `reels.reposts_count` 대응 |
| 8 | **다이렉트**| **누락 추가** | `POST /api/direct/conversations/{conv_id}/read` | 대화방 입장 시 안읽은 메시지 일괄 읽음 처리 (`messages.is_read = 1`) |
| 9 | **알림** | **누락 추가** | `PUT /api/notifications/read-all` | 모든 활동 알림 일괄 읽음 처리 기능 |
