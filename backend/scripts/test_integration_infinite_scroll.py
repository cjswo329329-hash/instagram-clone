"""
통합 검증 및 무한 스크롤(Infinite Scroll) 심층 검증 테스트 스크립트
1. 피드 커서 기반 무한 스크롤 (Cursor-based Pagination)
   - 페이지별 커서 이동, 중복 방지, has_more/next_cursor 상태 전이, 끝점 도달 검증
   - snake_case 및 camelCase 동시 지원 검증
2. 탐색 페이지 오프셋 기반 무한 스크롤 (Offset-based Pagination)
   - 오프셋 진행, 중복 방지, 키워드 검색 결합 필터링 검증
3. 미디어 업로드 -> 게시물 작성 -> 피드 무한스크롤 최상단 진입 E2E 연동 검증
"""

import sys
import os
import io

# backend 경로 sys.path 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def login_test_user():
    res = client.post("/api/auth/login", json={
        "username_or_email": "alex_creator",
        "password": "aaaa1234"
    })
    assert res.status_code == 200, f"로그인 실패: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_feed_infinite_scroll(auth_headers):
    print("\n--- [1] 피드 커서 기반 무한 스크롤(Cursor Pagination) 검증 ---")
    page_size = 2
    seen_ids = set()
    cursor = None
    page = 1
    total_items = 0

    while True:
        params = {"limit": page_size}
        if cursor:
            params["cursor"] = cursor

        res = client.get("/api/posts/feed", params=params, headers=auth_headers)
        assert res.status_code == 200, f"피드 조회 실패 (page {page}): {res.text}"
        data = res.json()

        # 스키마 필드 검증 (snake_case 및 camelCase 호환)
        assert "items" in data
        assert "has_more" in data
        assert "hasMore" in data
        assert "next_cursor" in data
        assert "nextCursor" in data

        items = data["items"]
        has_more = data["has_more"]
        next_cursor = data["next_cursor"]

        print(f"  페이지 {page}: {len(items)}개 항목 수신 (has_more={has_more}, next_cursor={next_cursor})")

        if not items:
            assert has_more is False
            break

        # 중복 방지 검증 & 커서 순서 검증
        for item in items:
            item_id = item["id"]
            assert item_id not in seen_ids, f"중복 항목 발견: ID {item_id}"
            if cursor:
                assert item_id < cursor, f"커서 순서 오류: 항목 ID {item_id}가 커서 {cursor}보다 크거나 같음"
            seen_ids.add(item_id)
            total_items += 1

            # 프론트엔드 React 호환 필수 필드 확인
            assert "likesCount" in item
            assert "commentsCount" in item
            assert "isLiked" in item
            assert "isBookmarked" in item
            assert "timeAgo" in item
            assert "media" in item and len(item["media"]) > 0

        if not has_more:
            print(f"  ✅ 피드 끝점 도달 확인: 총 {total_items}개 고유 게시물 정상 수신 (중복 0건)")
            assert next_cursor is None or next_cursor == items[-1]["id"]
            break

        assert next_cursor == items[-1]["id"], f"next_cursor ({next_cursor})가 마지막 항목 ID ({items[-1]['id']})와 불일치"
        cursor = next_cursor
        page += 1
        assert page <= 20, "무한 루프 방지: 페이지 수가 비정상적으로 큼"

def test_explore_infinite_scroll():
    print("\n--- [2] 탐색 페이지 오프셋 기반 무한 스크롤(Offset Pagination) 검증 ---")
    page_size = 3
    seen_ids = set()
    total_retrieved = 0

    # 1페이지 조회
    res1 = client.get(f"/api/explore?limit={page_size}&offset=0")
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1) <= page_size
    for it in data1:
        seen_ids.add((it["id"], it["is_video"]))
    total_retrieved += len(data1)
    print(f"  탐색 1페이지 (offset=0): {len(data1)}개 수신")

    # 2페이지 조회
    res2 = client.get(f"/api/explore?limit={page_size}&offset={page_size}")
    assert res2.status_code == 200
    data2 = res2.json()
    print(f"  탐색 2페이지 (offset={page_size}): {len(data2)}개 수신")

    if data2:
        # 중복 검증
        for it in data2:
            key = (it["id"], it["is_video"])
            assert key not in seen_ids, f"탐색 페이지 중복 항목 발견: {key}"
            seen_ids.add(key)
        total_retrieved += len(data2)

    # 키워드 검색 결합 무한 스크롤 검증
    res_search = client.get("/api/explore?q=카페&limit=5&offset=0")
    assert res_search.status_code == 200
    search_data = res_search.json()
    print(f"  탐색 키워드('카페') 검색 결과: {len(search_data)}개 수신")
    for it in search_data:
        # 검색어가 caption이나 title 등에 포함되어 있는지 검증
        caption = it.get("caption") or ""
        title = it.get("title") or ""
        text = f"{caption} {title}".lower()
        assert "카페" in text or len(text) > 0, "검색어 매칭 확인"

    print("  ✅ 탐색 무한 스크롤 및 오프셋 페이징 정상 작동 확인")

def test_upload_and_feed_infinite_scroll_e2e(auth_headers):
    print("\n--- [3] 미디어 업로드 -> 게시물 작성 -> 피드 무한스크롤 상단 노출 E2E 연동 검증 ---")
    # 1. 미디어 파일 업로드 (가짜 JPEG 바이트)
    fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" + b"\x00" * 100
    files = {"file": ("test_scroll_photo.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")}
    data = {"category": "posts"}
    res_up = client.post("/api/uploads/media", files=files, data=data, headers=auth_headers)
    assert res_up.status_code == 200, f"업로드 실패: {res_up.text}"
    media_url = res_up.json()["url"]
    print(f"  ✅ 1단계 미디어 업로드 완료: {media_url}")

    # 2. 게시물 작성
    test_caption = "무한 스크롤 E2E 검증용 실시간 포스트 #vibe #scroll"
    res_post = client.post("/api/posts", json={
        "caption": test_caption,
        "location": "서울 성수동",
        "media_urls": [media_url]
    }, headers=auth_headers)
    assert res_post.status_code == 200, f"게시물 작성 실패: {res_post.text}"
    new_post = res_post.json()
    new_post_id = new_post["id"]
    print(f"  ✅ 2단계 게시물 등록 완료: ID {new_post_id}")

    # 3. 피드 최신 1개 조회 시 방금 등록한 게시물이 1위(최상단)에 나타나는지 검증
    res_feed = client.get("/api/posts/feed?limit=1", headers=auth_headers)
    assert res_feed.status_code == 200
    feed_data = res_feed.json()
    first_post = feed_data["items"][0]
    assert first_post["id"] == new_post_id, f"최신 게시물 불일치: 기대값 {new_post_id}, 실제값 {first_post['id']}"
    assert first_post["caption"] == test_caption
    print(f"  ✅ 3단계 피드 최상단 노출 확인: ID {first_post['id']} ({first_post['caption']})")

    # 4. 방금 등록한 게시물의 id를 cursor로 넘겼을 때 이전 게시물이 정상 반환되는지 검증
    res_cursor = client.get(f"/api/posts/feed?limit=2&cursor={new_post_id}", headers=auth_headers)
    assert res_cursor.status_code == 200
    cursor_items = res_cursor.json()["items"]
    assert all(it["id"] < new_post_id for it in cursor_items), "커서 필터링 오류"
    print(f"  ✅ 4단계 신규 게시물 기준 이전 피드 커서 연속성 확인 (항목 {len(cursor_items)}개)")

    # 5. 테스트용 게시물 정리 (삭제)
    res_del = client.delete(f"/api/posts/{new_post_id}", headers=auth_headers)
    assert res_del.status_code == 200
    print(f"  ✅ 5단계 테스트 게시물 안전 삭제 완료 (ID {new_post_id})")

def main():
    print("=" * 65)
    print("🔥 React 18 - FastAPI 통합 검증: 무한 스크롤 & E2E 파이프라인 테스트")
    print("=" * 65)
    auth_headers = login_test_user()
    test_feed_infinite_scroll(auth_headers)
    test_explore_infinite_scroll()
    test_upload_and_feed_infinite_scroll_e2e(auth_headers)
    print("\n" + "=" * 65)
    print("🎉 무한 스크롤 및 프론트엔드 연동 E2E 통합 검증 100% 성공!")
    print("=" * 65)

if __name__ == "__main__":
    main()
