import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# 프로젝트 루트를 sys.path에 추가
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post, PostMedia
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

def run_test():
    print("🚀 === 팔로우 요청 및 수락/거절 전체 라이프사이클 E2E 검증 시작 ===")
    db = SessionLocal()
    try:
        # 1. 테스트 유저 생성 또는 준비
        # 유저 A (비공개 계정)
        user_a = db.query(User).filter(User.username == "test_private_a").first()
        if not user_a:
            user_a = User(
                username="test_private_a",
                email="test_private_a@test.com",
                hashed_password=get_password_hash("password123"),
                full_name="비공개 테스터 A",
                is_private=True
            )
            db.add(user_a)
        else:
            user_a.is_private = True
            db.commit()

        # 유저 B (요청 및 수락 테스트 대상)
        user_b = db.query(User).filter(User.username == "test_requester_b").first()
        if not user_b:
            user_b = User(
                username="test_requester_b",
                email="test_requester_b@test.com",
                hashed_password=get_password_hash("password123"),
                full_name="요청자 테스터 B",
                is_private=False
            )
            db.add(user_b)

        # 유저 C (요청 및 거절 테스트 대상)
        user_c = db.query(User).filter(User.username == "test_reject_c").first()
        if not user_c:
            user_c = User(
                username="test_reject_c",
                email="test_reject_c@test.com",
                hashed_password=get_password_hash("password123"),
                full_name="거절 테스터 C",
                is_private=False
            )
            db.add(user_c)

        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)
        db.refresh(user_c)

        # 기존 관계 및 알림 초기화 (클린 테스트 환경 조성)
        db.query(Follow).filter(Follow.following_id == user_a.id).delete()
        db.query(Follow).filter(Follow.follower_id == user_a.id).delete()
        db.query(Notification).filter(Notification.recipient_id.in_([user_a.id, user_b.id, user_c.id])).delete()
        db.commit()

        # 토큰 생성
        token_a = create_access_token(subject=str(user_a.id))
        token_b = create_access_token(subject=str(user_b.id))
        token_c = create_access_token(subject=str(user_c.id))

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}
        headers_c = {"Authorization": f"Bearer {token_c}"}

        # 초기 수치 확인
        res_profile_a = client.get(f"/api/users/{user_a.username}", headers=headers_a)
        assert res_profile_a.status_code == 200
        init_a_followers = res_profile_a.json()["followers_count"]

        res_profile_b = client.get(f"/api/users/{user_b.username}", headers=headers_b)
        assert res_profile_b.status_code == 200
        init_b_following = res_profile_b.json()["following_count"]

        print(f"📊 [초기 상태] 유저 A 팔로워: {init_a_followers}, 유저 B 팔로잉: {init_b_following}")

        # Step 1: 유저 B가 비공개 계정 유저 A 팔로우 시도 -> 'pending' 확인
        print("\n▶ 1. 유저 B가 비공개 유저 A에게 팔로우 요청 전송")
        res_follow = client.post(f"/api/follows/{user_a.id}", headers=headers_b)
        assert res_follow.status_code == 200, f"팔로우 요청 실패: {res_follow.text}"
        follow_json = res_follow.json()
        print(f"   응답: {follow_json}")
        assert follow_json["following"] == True
        assert follow_json["status"] == "pending", f"비공개 계정은 pending이어야 함. Got: {follow_json['status']}"

        # 대기 상태일 때는 정식 수치에 반영되지 않아야 함!
        res_profile_a_check = client.get(f"/api/users/{user_a.username}", headers=headers_a).json()
        assert res_profile_a_check["followers_count"] == init_a_followers, "대기 상태에서는 팔로워 수가 증가하지 않아야 함"
        print("   ✅ 대기(pending) 상태에서 유저 A 팔로워 수 미증가 검증 완료")

        # 유저 A의 알림 확인 -> type == 'follow_request' 확인
        res_notifs = client.get("/api/notifications", headers=headers_a)
        assert res_notifs.status_code == 200
        notifs = res_notifs.json()
        assert len(notifs) > 0
        req_notif = next((n for n in notifs if n["sender_id"] == user_b.id and n["type"] == "follow_request"), None)
        assert req_notif is not None, "유저 A에게 follow_request 알림이 도착해야 함"
        assert req_notif["follow_request_status"] == "pending"
        print(f"   ✅ 유저 A 알림 확인: '{req_notif['text_preview']}' (status: {req_notif['follow_request_status']})")

        # Step 2: 유저 A의 팔로우 요청 목록 조회 API 검증
        print("\n▶ 2. 유저 A의 대기 요청 목록(GET /api/follows/requests) 조회")
        res_reqs = client.get("/api/follows/requests", headers=headers_a)
        assert res_reqs.status_code == 200
        pending_list = res_reqs.json()
        assert len(pending_list) == 1
        assert pending_list[0]["id"] == user_b.id
        assert pending_list[0]["username"] == user_b.username
        print(f"   ✅ 대기 목록에 유저 B({user_b.username}) 정상 조회됨")

        # Step 3: 유저 A가 유저 B의 팔로우 요청 수락(Accept)
        print("\n▶ 3. 유저 A가 유저 B의 팔로우 요청 수락(POST /api/follows/requests/{id}/accept)")
        res_accept = client.post(f"/api/follows/requests/{user_b.id}/accept", headers=headers_a)
        assert res_accept.status_code == 200, f"수락 실패: {res_accept.text}"
        accept_json = res_accept.json()
        print(f"   수락 응답: {accept_json}")
        assert accept_json["status"] == "accepted"
        assert accept_json["my_followers_count"] == init_a_followers + 1
        assert accept_json["requester_following_count"] == init_b_following + 1

        # 프로필 API 재조회 검증
        profile_a_after = client.get(f"/api/users/{user_a.username}", headers=headers_a).json()
        profile_b_after = client.get(f"/api/users/{user_b.username}", headers=headers_b).json()
        assert profile_a_after["followers_count"] == init_a_followers + 1, "유저 A의 팔로워 수가 1 증가해야 함"
        assert profile_b_after["following_count"] == init_b_following + 1, "유저 B의 팔로잉 수가 1 증가해야 함"
        print(f"   ✅ 수치 증감 확인: 유저 A 팔로워 {init_a_followers} -> {profile_a_after['followers_count']}, 유저 B 팔로잉 {init_b_following} -> {profile_b_after['following_count']}")

        # 요청자(유저 B)에게 follow_accept 알림 도착 확인
        res_notifs_b = client.get("/api/notifications", headers=headers_b)
        assert res_notifs_b.status_code == 200
        notifs_b = res_notifs_b.json()
        accept_notif = next((n for n in notifs_b if n["sender_id"] == user_a.id and n["type"] == "follow_accept"), None)
        assert accept_notif is not None, "유저 B에게 follow_accept 알림이 도착해야 함"
        print(f"   ✅ 유저 B 수락 알림 도착 확인: '{accept_notif['text_preview']}'")

        # Step 4: 비공개 콘텐츠 접근 권한 및 피드 노출 검증
        print("\n▶ 4. 비공개 콘텐츠 권한 및 피드 노출 검증")
        # 유저 A가 비공개 게시물 작성
        post_a = Post(user_id=user_a.id, caption="비공개 비밀 게시물입니다 🔒", location="시크릿 스팟")
        db.add(post_a)
        db.commit()
        db.refresh(post_a)
        media_a = PostMedia(post_id=post_a.id, media_type="image", media_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb", order_index=0)
        db.add(media_a)
        db.commit()

        # 수락된 유저 B가 게시물 상세 조회 -> 200 OK
        res_post_b = client.get(f"/api/posts/{post_a.id}", headers=headers_b)
        assert res_post_b.status_code == 200, f"수락된 팔로워는 비공개 게시물을 볼 수 있어야 함: {res_post_b.text}"
        print("   ✅ 유저 B가 유저 A의 비공개 게시물 정상 열람(HTTP 200)")

        # 유저 B의 피드에 유저 A 게시물 포함 확인
        res_feed_b = client.get("/api/posts/feed", headers=headers_b)
        assert res_feed_b.status_code == 200
        feed_items = res_feed_b.json()["items"]
        assert any(p["id"] == post_a.id for p in feed_items), "유저 B의 피드에 유저 A의 게시물이 나타나야 함"
        print("   ✅ 유저 B의 피드에 유저 A의 최신 게시물 정상 노출 확인")

        # Step 5: 유저 C의 거절(Reject) 시나리오 검증
        print("\n▶ 5. 거절(Reject) 시나리오 검증 (유저 C)")
        # 유저 C가 유저 A 팔로우 요청
        client.post(f"/api/follows/{user_a.id}", headers=headers_c)
        # 유저 A가 유저 C의 요청 거절
        res_reject = client.post(f"/api/follows/requests/{user_c.id}/reject", headers=headers_a)
        assert res_reject.status_code == 200
        assert res_reject.json()["status"] == "rejected"
        print("   ✅ 유저 C의 팔로우 요청 거절 완료")

        # 거절된 유저 C는 비공개 게시물 열람 불가(403 Forbidden)
        res_post_c = client.get(f"/api/posts/{post_a.id}", headers=headers_c)
        assert res_post_c.status_code == 403, f"거절된 유저는 비공개 게시물 열람 불가해야 함. Got: {res_post_c.status_code}"
        print("   ✅ 거절된 유저 C의 비공개 게시물 접근 정상 차단(HTTP 403 Forbidden)")

        # 유저 A의 팔로워 수는 증가하지 않아야 함
        profile_a_final = client.get(f"/api/users/{user_a.username}", headers=headers_a).json()
        assert profile_a_final["followers_count"] == init_a_followers + 1
        print("   ✅ 유저 A의 팔로워 수 변동 없음 확인")

        print("\n🎉 === 모든 팔로우 요청 및 수락/거절 라이프사이클 E2E 검증 100% 통과! ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
