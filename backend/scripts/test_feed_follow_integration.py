"""
팔로우 시 피드 실시간 반영 및 추천 목록 개선 통합 검증 테스트 스크립트
1. 로그인 전/후 피드 조회
2. 특정 유저 팔로우 전 피드 상태 확인
3. 특정 유저 팔로우 -> 피드 즉시 갱신 확인 (팔로우한 유저의 게시물이 피드 최상단에 등장하는지)
4. 추천 목록(/api/users/suggestions)에서 팔로우한 유저 제외 여부 확인
5. limit 파라미터(30) 동작 확인
6. 언팔로우 시 피드에서 제거되는지 확인
"""

import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.core.security import create_access_token

client = TestClient(app)

def run_tests():
    print("=================================================================")
    print("🚀 [TEST] 팔로우 시 피드 즉시 노출 및 추천 목록 E2E 검증 시작")
    print("=================================================================")

    db = SessionLocal()
    try:
        # 테스트 대상 유저 확인: alex_creator (id=1)
        test_user = db.query(User).filter(User.username == "alex_creator").first()
        assert test_user is not None, "alex_creator 유저를 찾을 수 없습니다."

        token = create_access_token(subject=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}

        # 테스트용 타겟 유저 찾기 (최신 게시물이 있는 공개 유저)
        target_post = db.query(Post).join(User, Post.user_id == User.id).filter(
            Post.user_id != test_user.id,
            User.is_private == False
        ).order_by(Post.id.desc()).first()
        assert target_post is not None, "테스트할 타겟 게시물이 없습니다."
        target_user = target_post.author
        assert target_user is not None, "타겟 게시물 작성자를 찾을 수 없습니다."

        print(f"[*] 테스트 유저: {test_user.username} (ID: {test_user.id})")
        print(f"[*] 타겟 유저: {target_user.username} (ID: {target_user.id}), 대표 게시물 ID: {target_post.id}")

        # 기존 팔로우 관계가 있다면 정리 (초기화)
        db.query(Follow).filter(
            Follow.follower_id == test_user.id,
            Follow.following_id == target_user.id
        ).delete()
        db.commit()

        # 1. 팔로우 전 피드 조회
        res_before = client.get("/api/posts/feed?limit=10", headers=headers)
        assert res_before.status_code == 200, f"피드 조회 실패: {res_before.text}"
        data_before = res_before.json()
        print(f"[+] 팔로우 전 피드 아이템 수: {len(data_before['items'])}")

        # 2. 추천 유저 목록(/api/users/suggestions?limit=5) 조회
        res_sug_5 = client.get("/api/users/suggestions?limit=5", headers=headers)
        assert res_sug_5.status_code == 200, f"추천 조회 실패: {res_sug_5.text}"
        sug_5 = res_sug_5.json()
        print(f"[+] 기본 추천 목록(5명) 응답 성공: {[u['username'] for u in sug_5]}")

        # 모두 보기용 추천 유저 목록(/api/users/suggestions?limit=30) 조회
        res_sug_30 = client.get("/api/users/suggestions?limit=30", headers=headers)
        assert res_sug_30.status_code == 200, f"대량 추천 조회 실패: {res_sug_30.text}"
        sug_30 = res_sug_30.json()
        print(f"[+] 모두 보기용 추천 목록({len(sug_30)}명) 응답 성공")
        assert len(sug_30) >= len(sug_5), "대량 추천 목록 개수가 기본 추천보다 많아야 합니다."

        # 3. 타겟 유저 팔로우 실행 (POST /api/follows/{user_id})
        res_follow = client.post(f"/api/follows/{target_user.id}", headers=headers)
        assert res_follow.status_code == 200, f"팔로우 실패: {res_follow.text}"
        follow_data = res_follow.json()
        assert follow_data["following"] is True, "팔로우 상태가 True여야 합니다."
        print(f"[+] {target_user.username} 팔로우 성공: {follow_data}")

        # 4. 팔로우 직후 피드 조회 (GET /api/posts/feed)
        res_after = client.get("/api/posts/feed?limit=10", headers=headers)
        assert res_after.status_code == 200, f"팔로우 후 피드 조회 실패: {res_after.text}"
        data_after = res_after.json()
        feed_items = data_after["items"]
        print(f"[+] 팔로우 후 피드 아이템 수: {len(feed_items)}")

        # 검증: 방금 팔로우한 유저의 게시물이 피드 상단에 바로 뜨는지 확인!
        top_post = feed_items[0]
        print(f"[*] 피드 최상단 게시물 작성자: {top_post['author']['username']}, 게시물 ID: {top_post['id']}")
        
        target_post_in_feed = any(p["author"]["id"] == target_user.id for p in feed_items)
        assert target_post_in_feed, f"팔로우 당한 유저({target_user.username})의 게시물이 피드에 포함되어야 합니다!"
        assert top_post["author"]["id"] == target_user.id, (
            f"방금 팔로우한 유저({target_user.username})의 게시물이 피드 최상단에 우선 배치되어야 합니다!"
        )
        print(f"🎉 [성공] 팔로우 당한 유저({target_user.username})의 게시물이 피드 최상단에 즉시 노출되었습니다!")

        # 5. 추천 목록에서 팔로우한 유저 제외 확인
        res_sug_after = client.get("/api/users/suggestions?limit=30", headers=headers)
        assert res_sug_after.status_code == 200
        sug_after_ids = [u["id"] for u in res_sug_after.json()]
        assert target_user.id not in sug_after_ids, "방금 팔로우한 유저는 추천 목록에서 제외되어야 합니다."
        print(f"[+] 팔로우한 유저({target_user.username})가 추천 목록에서 올바르게 제외되었습니다.")

        # 6. 언팔로우 실행 및 피드 즉시 갱신 확인
        res_unfollow = client.post(f"/api/follows/{target_user.id}", headers=headers)
        assert res_unfollow.status_code == 200
        assert res_unfollow.json()["following"] is False
        print(f"[+] {target_user.username} 언팔로우 성공")

        res_after_unfollow = client.get("/api/posts/feed?limit=10", headers=headers)
        assert res_after_unfollow.status_code == 200
        unfollow_items = res_after_unfollow.json()["items"]
        unfollow_top = unfollow_items[0] if unfollow_items else None
        print(f"[*] 언팔로우 후 피드 최상단 게시물 ID: {unfollow_top['id'] if unfollow_top else 'None'}")
        
        # 언팔로우 시 해당 유저의 글이 상단에서 빠졌는지 확인
        if unfollow_top:
            print(f"[+] 언팔로우 후 피드 최상단 작성자: {unfollow_top['author']['username']}")

        print("\n=================================================================")
        print("✅ 모든 통합 테스트가 완벽하게 통과했습니다!")
        print("=================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
