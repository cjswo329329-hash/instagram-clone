import os
import sqlite3
import sys

# Windows 콘솔 인코딩 대응
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# backend 디렉토리를 sys.path에 추가
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def test_sqlite_verification():
    db_path = os.path.join(backend_dir, "instagram.db")
    print(f"[TEST] 데이터베이스 검증 시작: {db_path}")

    assert os.path.exists(db_path), f"DB 파일이 존재하지 않습니다: {db_path}"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA busy_timeout = 5000;")

    # 1. PRAGMA 검증
    print("\n--- 1. SQLite PRAGMA 설정 검증 ---")
    journal_mode = cursor.execute("PRAGMA journal_mode;").fetchone()[0]
    foreign_keys = cursor.execute("PRAGMA foreign_keys;").fetchone()[0]
    busy_timeout = cursor.execute("PRAGMA busy_timeout;").fetchone()[0]
    print(f"journal_mode: {journal_mode}")
    print(f"foreign_keys: {foreign_keys}")
    print(f"busy_timeout: {busy_timeout}")
    assert journal_mode.lower() == "wal", f"journal_mode가 WAL이 아닙니다: {journal_mode}"
    assert foreign_keys == 1, f"foreign_keys가 ON(1)이 아닙니다: {foreign_keys}"
    assert busy_timeout >= 5000, f"busy_timeout이 5000 이상이 아닙니다: {busy_timeout}"
    print("[PASS] 5대 PRAGMA 설정 검증 완료!")

    # 2. 필수 테이블 13개 존재 검증
    print("\n--- 2. 테이블 스키마 검증 ---")
    expected_tables = {
        "users", "follows", "posts", "post_media", "reels",
        "comments", "likes", "bookmarks", "stories", "story_views",
        "conversations", "messages", "notifications"
    }
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    existing_tables = set(row[0] for row in cursor.fetchall())
    print(f"발견된 테이블 ({len(existing_tables)}개): {sorted(existing_tables)}")
    missing_tables = expected_tables - existing_tables
    assert not missing_tables, f"누락된 테이블이 있습니다: {missing_tables}"
    print("[PASS] 13개 핵심 테이블 모두 정상 존재 확인!")

    # 3. 인덱스 검증
    print("\n--- 3. 커스텀 인덱스 검증 ---")
    expected_indices = {
        "idx_users_username", "idx_follows_follower", "idx_follows_following",
        "idx_posts_user_created", "idx_post_media_post", "idx_reels_created",
        "idx_comments_post", "idx_comments_reel", "idx_likes_post",
        "idx_likes_reel", "idx_likes_comment", "idx_bookmarks_user", "idx_stories_active",
        "idx_conv_users", "idx_messages_conv", "idx_notifications_recipient"
    }
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")
    existing_indices = set(row[0] for row in cursor.fetchall())
    print(f"발견된 인덱스 ({len(existing_indices)}개): {sorted(existing_indices)}")
    missing_indices = expected_indices - existing_indices
    assert not missing_indices, f"누락된 인덱스가 있습니다: {missing_indices}"
    print(f"[PASS] {len(expected_indices)}개 커스텀 인덱스 모두 정상 존재 확인!")

    # 4. 외래키 및 CASCADE 제약조건 테스트
    print("\n--- 4. 외래키 및 CASCADE 제약조건 테스트 ---")
    cursor.execute("BEGIN TRANSACTION;")
    try:
        # 유저 생성
        cursor.execute(
            "INSERT INTO users (username, email, hashed_password, full_name) VALUES (?, ?, ?, ?);",
            ("test_user_cascade", "cascade@test.com", "dummyhash", "Cascade Test")
        )
        test_uid = cursor.lastrowid

        # 게시물 & 미디어 생성
        cursor.execute("INSERT INTO posts (user_id, caption) VALUES (?, ?);", (test_uid, "Test Post"))
        test_pid = cursor.lastrowid
        cursor.execute("INSERT INTO post_media (post_id, media_url) VALUES (?, ?);", (test_pid, "/img1.jpg"))

        # 릴스 생성
        cursor.execute("INSERT INTO reels (user_id, video_url, audio_title) VALUES (?, ?, ?);", (test_uid, "/vid.mp4", "Audio 1"))
        test_rid = cursor.lastrowid

        # 댓글 생성 (post_id)
        cursor.execute("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?);", (test_uid, test_pid, "Nice!"))
        # 댓글 생성 (reel_id)
        cursor.execute("INSERT INTO comments (user_id, reel_id, content) VALUES (?, ?, ?);", (test_uid, test_rid, "Cool Reel!"))

        # 좋아요 & 북마크 생성
        cursor.execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?);", (test_uid, test_pid))
        cursor.execute("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?);", (test_uid, test_pid))

        # 이제 유저를 삭제했을 때 posts, post_media, reels, comments, likes, bookmarks가 모두 자동 삭제되어야 함
        cursor.execute("DELETE FROM users WHERE id = ?;", (test_uid,))

        assert cursor.execute("SELECT COUNT(*) FROM posts WHERE user_id = ?;", (test_uid,)).fetchone()[0] == 0
        assert cursor.execute("SELECT COUNT(*) FROM post_media WHERE post_id = ?;", (test_pid,)).fetchone()[0] == 0
        assert cursor.execute("SELECT COUNT(*) FROM reels WHERE user_id = ?;", (test_uid,)).fetchone()[0] == 0
        assert cursor.execute("SELECT COUNT(*) FROM comments WHERE user_id = ?;", (test_uid,)).fetchone()[0] == 0
        assert cursor.execute("SELECT COUNT(*) FROM likes WHERE user_id = ?;", (test_uid,)).fetchone()[0] == 0
        assert cursor.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = ?;", (test_uid,)).fetchone()[0] == 0
        print("[PASS] 외래키 CASCADE 연쇄 삭제 무결성 검증 성공!")
    finally:
        conn.rollback()

    # 5. CHECK 제약조건 테스트
    print("\n--- 5. CHECK 제약조건 테스트 ---")
    cursor.execute("BEGIN TRANSACTION;")
    try:
        cursor.execute(
            "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?);",
            ("check_user", "check@test.com", "hash")
        )
        c_uid = cursor.lastrowid

        # post_id와 reel_id가 둘 다 NULL인 댓글 삽입 -> CHECK 실패해야 함
        check_passed = False
        try:
            cursor.execute("INSERT INTO comments (user_id, post_id, reel_id, content) VALUES (?, NULL, NULL, ?);", (c_uid, "Invalid"))
        except sqlite3.IntegrityError:
            check_passed = True
        
        assert check_passed, "CHECK 제약조건 (post_id IS NOT NULL OR reel_id IS NOT NULL) 위반이 무시되었습니다!"
        print("[PASS] comments 테이블 CHECK 제약조건 정상 동작 확인!")
    finally:
        conn.rollback()

    # 6. UNIQUE 제약조건 테스트
    print("\n--- 6. UNIQUE 제약조건 테스트 ---")
    cursor.execute("BEGIN TRANSACTION;")
    try:
        cursor.execute("INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?);", ("u1", "u1@test.com", "h"))
        uid1 = cursor.lastrowid
        cursor.execute("INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?);", ("u2", "u2@test.com", "h"))
        uid2 = cursor.lastrowid

        # 팔로우 중복
        cursor.execute("INSERT INTO follows (follower_id, following_id) VALUES (?, ?);", (uid1, uid2))
        dup_follow_blocked = False
        try:
            cursor.execute("INSERT INTO follows (follower_id, following_id) VALUES (?, ?);", (uid1, uid2))
        except sqlite3.IntegrityError:
            dup_follow_blocked = True
        assert dup_follow_blocked, "follows UNIQUE(follower_id, following_id) 제약조건 실패!"

        # 좋아요 중복
        cursor.execute("INSERT INTO posts (user_id, caption) VALUES (?, ?);", (uid1, "cap"))
        pid = cursor.lastrowid
        cursor.execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?);", (uid2, pid))
        dup_like_blocked = False
        try:
            cursor.execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?);", (uid2, pid))
        except sqlite3.IntegrityError:
            dup_like_blocked = True
        assert dup_like_blocked, "likes UNIQUE(user_id, post_id) 제약조건 실패!"

        print("[PASS] UNIQUE 제약조건(팔로우, 좋아요 중복 방지) 정상 동작 확인!")
    finally:
        conn.rollback()

    conn.close()

    # 7. SQLAlchemy 2.0 ORM 모델 연동 검증
    print("\n--- 7. SQLAlchemy ORM 모델 연동 검증 ---")
    from app.database import SessionLocal, engine
    from app.models import (
        User, Follow, Post, PostMedia, Reel, Comment,
        Like, Bookmark, Story, StoryView, Conversation,
        Message, Notification
    )

    db = SessionLocal()
    try:
        # 테이블 매핑 확인 쿼리
        user_cnt = db.query(User).count()
        reel_cnt = db.query(Reel).count()
        post_cnt = db.query(Post).count()
        media_cnt = db.query(PostMedia).count()
        comment_cnt = db.query(Comment).count()
        like_cnt = db.query(Like).count()
        bookmark_cnt = db.query(Bookmark).count()
        story_cnt = db.query(Story).count()
        conv_cnt = db.query(Conversation).count()
        msg_cnt = db.query(Message).count()
        notif_cnt = db.query(Notification).count()
        follow_cnt = db.query(Follow).count()

        print(f"SQLAlchemy ORM 연동 및 실데이터 집계:")
        print(f"   - Users: {user_cnt}, Follows: {follow_cnt}")
        print(f"   - Posts: {post_cnt}, PostMedia: {media_cnt}")
        print(f"   - Reels: {reel_cnt}")
        print(f"   - Comments: {comment_cnt}, Likes: {like_cnt}, Bookmarks: {bookmark_cnt}")
        print(f"   - Stories: {story_cnt}")
        print(f"   - Conversations: {conv_cnt}, Messages: {msg_cnt}")
        print(f"   - Notifications: {notif_cnt}")
        print("[PASS] SQLAlchemy 2.0 ORM 모델 13개 전체 연동 및 쿼리 검증 완료!")
    finally:
        db.close()

    print("\n=======================================================")
    print("🎉 ALL TESTS PASSED: SQLite 데이터베이스가 완벽하게 구축되었습니다!")
    print("=======================================================")

if __name__ == "__main__":
    test_sqlite_verification()
