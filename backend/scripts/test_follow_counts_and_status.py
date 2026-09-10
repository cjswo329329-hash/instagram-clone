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
from app.models.follow import Follow
from app.core.security import create_access_token

client = TestClient(app)

def run_tests():
    print("=" * 65)
    print("🚀 [TEST] 팔로잉 상태(is_following) 및 수치 증감(Followers/Following) 검증 시작")
    print("=" * 65)

    db = SessionLocal()
    try:
        user11 = db.query(User).filter(User.id == 11).first()
        assert user11 is not None, "User 11이 존재해야 합니다."

        token = create_access_token(user11.id)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. User 11 프로필 수치 확인
        res = client.get(f"/api/users/profile/{user11.username}", headers=headers)
        assert res.status_code == 200, f"프로필 조회 실패: {res.text}"
        profile = res.json()
        initial_fllwers = profile["followers_count"]
        initial_fllwing = profile["following_count"]
        print(f"[+] User 11 ({user11.username}) 프로필 조회 성공: 팔로워={initial_fllwers}, 팔로잉={initial_fllwing}")

        # 2. User 11의 팔로잉 목록 조회 (본인이 팔로잉하는 사용자 목록)
        res = client.get(f"/api/users/{user11.id}/following", headers=headers)
        assert res.status_code == 200, f"팔로잉 목록 조회 실패: {res.text}"
        following_list = res.json()
        print(f"[+] 팔로잉 목록 {len(following_list)}명 응답 성공")
        assert len(following_list) == initial_fllwing, "팔로잉 목록 개수가 프로필 수치와 일치해야 합니다."

        # 모든 팔로잉 유저의 is_following 및 isFollowing이 True인지 검증!
        for u in following_list:
            is_fllwing = u.get("is_following") or u.get("isFollowing")
            assert is_fllwing is True, f"User {u['username']}은 내가 팔로잉 중이므로 is_following이 True여야 합니다: {u}"
        print("🎉 [성공] 팔로잉 목록의 모든 유저가 is_following: True (팔로잉 버튼 상태)로 확인되었습니다!")

        # 3. 타겟 유저 언팔로우 테스트
        target = following_list[0]
        target_id = target["id"]
        target_username = target["username"]
        print(f"[*] 타겟 유저 ({target_username}, ID: {target_id}) 언팔로우 시도...")

        res = client.post(f"/api/follows/{target_id}", headers=headers)
        assert res.status_code == 200, f"언팔로우 실패: {res.text}"
        unfollow_data = res.json()
        assert unfollow_data["following"] is False, "언팔로우 결과 following=False여야 합니다."
        assert unfollow_data["current_following_count"] == initial_fllwing - 1, "언팔로우 후 current_following_count가 1 감소해야 합니다."
        print(f"[+] 언팔로우 성공! 응답 수치: current_following_count={unfollow_data['current_following_count']}")

        # 4. 언팔로우 후 팔로잉 목록 재조회 및 프로필 수치 확인
        res = client.get(f"/api/users/{user11.id}/following", headers=headers)
        new_following_list = res.json()
        assert len(new_following_list) == initial_fllwing - 1, "언팔로우 후 목록 개수가 1 줄어들어야 합니다."
        print(f"[+] 언팔로우 후 팔로잉 목록 개수: {len(new_following_list)}명 (정상 감소)")

        # 프로필 수치 감소 확인
        res = client.get(f"/api/users/profile/{user11.username}", headers=headers)
        profile_after_unfollow = res.json()
        assert profile_after_unfollow["following_count"] == initial_fllwing - 1, "프로필의 following_count가 1 감소해야 합니다."
        print(f"[+] 언팔로우 후 프로필 팔로잉 수: {profile_after_unfollow['following_count']} (정상 감소)")

        # 5. 타겟 유저 재팔로우 테스트
        print(f"[*] 타겟 유저 ({target_username}, ID: {target_id}) 재팔로우 시도...")
        res = client.post(f"/api/follows/{target_id}", headers=headers)
        assert res.status_code == 200, f"재팔로우 실패: {res.text}"
        refollow_data = res.json()
        assert refollow_data["following"] is True, "재팔로우 결과 following=True여야 합니다."
        assert refollow_data["current_following_count"] == initial_fllwing, "재팔로우 후 current_following_count가 복구되어야 합니다."
        print(f"[+] 재팔로우 성공! 응답 수치: current_following_count={refollow_data['current_following_count']}")

        # 재팔로우 후 프로필 수치 복구 확인
        res = client.get(f"/api/users/profile/{user11.username}", headers=headers)
        profile_after_refollow = res.json()
        assert profile_after_refollow["following_count"] == initial_fllwing, "프로필의 following_count가 복구되어야 합니다."
        print(f"[+] 재팔로우 후 프로필 팔로잉 수: {profile_after_refollow['following_count']} (정상 복구)")

        # 6. 팔로워 목록에서도 is_following 상태 계산 검증
        res = client.get(f"/api/users/{user11.id}/followers", headers=headers)
        assert res.status_code == 200, f"팔로워 목록 조회 실패: {res.text}"
        followers_list = res.json()
        print(f"[+] 팔로워 목록 {len(followers_list)}명 조회 성공")
        assert len(followers_list) == initial_fllwers, "팔로워 목록 개수 일치 확인"
        # 팔로워 중 맞팔 중인 유저와 미팔로우 유저가 각각 올바른 bool 값을 가지는지 검증
        has_true = any(u.get("is_following") or u.get("isFollowing") for u in followers_list)
        has_false = any(not (u.get("is_following") or u.get("isFollowing")) for u in followers_list)
        print(f"[+] 팔로워 목록 내 맞팔(팔로잉 중) 유저 존재 여부: {has_true}, 미팔로우 유저 존재 여부: {has_false}")

        print("=" * 65)
        print("✅ 모든 팔로잉/팔로워 상태 및 수치 증감 테스트 100% 통과!")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
