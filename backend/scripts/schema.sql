-- ==============================================================================
-- ⚙️ Instagram 클론 SQLite DDL 스키마 (backend.md 기준 - 2026-09-07 업데이트)
-- ==============================================================================

-- 1. 사용자 테이블 (users)
CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- 2. 팔로우 관계 (follows)
CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted', -- 'accepted' | 'pending' (비공개 계정 승인 대기)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (follower_id, following_id),
    CHECK (follower_id != following_id)      -- 자기 자신 팔로우 방지
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

-- 3. 피드 게시물 (posts) & 미디어 (post_media)
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS post_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video'
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media (post_id, order_index ASC);

-- 4. 릴스 (reels - 9:16 비디오 숏폼)
CREATE TABLE IF NOT EXISTS reels (
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
CREATE INDEX IF NOT EXISTS idx_reels_created ON reels (created_at DESC);

-- 5. 댓글 (comments - 게시물 및 릴스 공용)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (post_id IS NOT NULL OR reel_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_reel ON comments (reel_id, created_at ASC);

-- 6. 좋아요 (likes - 게시물, 릴스, 댓글)
-- ⚠️ SQLite UNIQUE + NULL 버그 방어: CHECK 제약으로 단일 대상만 지정하도록 강제
CREATE TABLE IF NOT EXISTS likes (
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
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel ON likes (reel_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment ON likes (comment_id);

-- 7. 북마크 / 저장됨 (bookmarks - 게시물 및 릴스)
-- ⚠️ SQLite UNIQUE + NULL 버그 방어: CHECK 제약으로 단일 대상만 지정하도록 강제
CREATE TABLE IF NOT EXISTS bookmarks (
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
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id, created_at DESC);

-- 8. 24시간 스토리 (stories) & 시청 기록 (story_views)
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    expires_at TEXT NOT NULL,              -- 24시간 뒤 만료 시점 (ISO-8601 DATETIME)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories (user_id, expires_at);

CREATE TABLE IF NOT EXISTS story_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (story_id, user_id)
);

-- 9. 다이렉트 메시지 (conversations & messages)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,                   -- "conv-1" or UUID
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_users ON conversations (user1_id, user2_id);

-- 10. 메시지 (messages)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,                   -- "msg-101" or UUID
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT,
    media_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    reactions TEXT DEFAULT '[]',          -- JSON 배열 e.g. ["❤️"]
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, created_at ASC);

-- 11. 활동 알림 (notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                    -- 'like_post', 'like_reel', 'comment', 'follow'
    target_id INTEGER,                     -- post_id or reel_id
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, is_read, created_at DESC);

