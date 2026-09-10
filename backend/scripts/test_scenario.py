import os
import sys
from fastapi.testclient import TestClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

client = TestClient(app)

def print_step(title):
    print(f"\n▶ {title}")

def print_success(msg):
    print(f"  ✅ {msg}")

def run_scenario_test():
    print("==================================================================")
    print("🌟 Instagram Clone 백엔드 핵심 사용자 시나리오 전체 정밀 테스트")
    print("==================================================================")

    # -------------------------------------------------------------
    # 1. 회원가입 (Register) & 중복 방지
    # -------------------------------------------------------------
    print_step("1. 회원가입 및 중복 방지 테스트")
    test_user_payload = {
        "username": "tester_kim_2026",
        "email": "tester_kim@test.com",
        "password": "Password123!",
        "full_name": "김테스터"
    }
    reg_res = client.post("/api/auth/register", json=test_user_payload)
    if reg_res.status_code == 409:
        print_success("기존 테스트 유저 존재 감지 -> 로그인으로 연계")
    else:
        assert reg_res.status_code == 200, reg_res.text
        reg_data = reg_res.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["username"] == "tester_kim_2026"
        print_success(f"신규 회원가입 완료 (ID: {reg_data['user']['id']}, Username: {reg_data['user']['username']})")

    # 중복 가입 시도 -> 409 Conflict 검증
    dup_res = client.post("/api/auth/register", json=test_user_payload)
    assert dup_res.status_code == 409, "중복 가입 시 409 Conflict가 반환되어야 합니다."
    print_success("중복 아이디/이메일 가입 차단(409 Conflict) 검증 성공")

    # -------------------------------------------------------------
    # 2. 로그인 (Login) & 인증 에러 처리
    # -------------------------------------------------------------
    print_step("2. 로그인 및 자격 증명 검증")
    # 틀린 비밀번호 시도 -> 401 Unauthorized
    bad_login = client.post("/api/auth/login", json={
        "username_or_email": "tester_kim_2026",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401, "잘못된 비밀번호는 401이어야 합니다."
    print_success("잘못된 비밀번호 로그인 차단(401 Unauthorized) 검증 성공")

    # 정상 로그인
    good_login = client.post("/api/auth/login", json={
        "username_or_email": "tester_kim_2026",
        "password": "Password123!"
    })
    assert good_login.status_code == 200, good_login.text
    user_token = good_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    test_user_id = good_login.json()["user"]["id"]
    print_success(f"정상 로그인 및 JWT Bearer 토큰 획득 성공 (User ID: {test_user_id})")

    # -------------------------------------------------------------
    # 3. 프로필 정보 수정 & 비공개 계정 설정
    # -------------------------------------------------------------
    print_step("3. 프로필 정보 수정 및 비공개 계정 전환")
    update_res = client.put("/api/users/profile", headers=user_headers, json={
        "bio": "안녕하세요! 클론코딩 테스트 계정입니다 📸",
        "website": "https://instagram.clone",
        "gender": "female",
        "is_private": True
    })
    assert update_res.status_code == 200, update_res.text
    print_success("프로필 정보 업데이트 성공 (bio, website, gender, is_private=True)")

    # 프로필 조회하여 비공개 여부 반영 확인
    prof_res = client.get("/api/users/tester_kim_2026", headers=user_headers)
    assert prof_res.status_code == 200, prof_res.text
    assert prof_res.json()["is_private"] is True
    print_success("프로필 헤더 조회 시 is_private: True 반영 확인 완료")

    # -------------------------------------------------------------
    # 4. 다른 유저(alex_creator)가 비공개 계정 팔로우 -> pending 및 알림 발송 검증
    # -------------------------------------------------------------
    print_step("4. 팔로우 인터랙션 및 비공개 계정 '요청됨(pending)' & 알림 검증")
    # alex_creator 로그인
    alex_login = client.post("/api/auth/login", json={
        "username_or_email": "alex_creator",
        "password": "aaaa1234"
    })
    alex_token = alex_login.json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}
    alex_id = alex_login.json()["user"]["id"]

    # alex_creator가 tester_kim_2026 팔로우 시도 전 기존 팔로우 관계가 있으면 초기화
    check_prof = client.get("/api/users/tester_kim_2026", headers=alex_headers)
    if check_prof.json().get("is_following") or check_prof.json().get("is_requested"):
        client.post(f"/api/follows/{test_user_id}", headers=alex_headers)

    # alex_creator가 비공개 계정인 tester_kim_2026 팔로우 시도
    follow_res = client.post(f"/api/follows/{test_user_id}", headers=alex_headers)
    assert follow_res.status_code == 200, follow_res.text
    follow_data = follow_res.json()
    assert follow_data["following"] is True
    assert follow_data["status"] == "pending", f"비공개 계정은 pending이어야 합니다. Got: {follow_data}"
    print_success(f"비공개 계정 대상 팔로우 시 상태값 'pending'(요청됨) 반환 확인: {follow_data}")

    # alex의 관점에서 tester의 프로필 조회 -> is_requested: True 확인
    tester_prof_by_alex = client.get("/api/users/tester_kim_2026", headers=alex_headers)
    assert tester_prof_by_alex.json()["is_requested"] is True
    assert tester_prof_by_alex.json()["is_following"] is False
    print_success("프론트엔드 '요청됨' 버튼 렌더링용 is_requested: True 검증 통과")

    # tester_kim_2026의 알림함에 alex_creator의 팔로우 알림이 도착했는지 확인
    tester_notifs = client.get("/api/notifications", headers=user_headers)
    assert tester_notifs.status_code == 200, tester_notifs.text
    notif_list = tester_notifs.json()
    follow_notif = next((n for n in notif_list if n["type"] == "follow" and n["sender_id"] == alex_id), None)
    assert follow_notif is not None, "팔로우 알림이 recipient에게 생성되어야 합니다."
    print_success(f"수신된 팔로우 알림 확인: \"{follow_notif['text_preview']}\"")

    # 5단계 이후 다른 유저와의 소셜 인터랙션(상세조회, 좋아요, 댓글) 테스트를 위해 계정을 공개로 전환
    client.put("/api/users/profile", headers=user_headers, json={"is_private": False})

    # -------------------------------------------------------------
    # 5. 미디어 파일 업로드 & 피드 게시물 생성
    # -------------------------------------------------------------
    print_step("5. 파일 업로드 및 새 게시물 등록")
    fake_img = ("feed_photo.jpg", b"mock binary image content for testing", "image/jpeg")
    up_res = client.post("/api/uploads/media", files={"file": fake_img}, data={"category": "posts"}, headers=user_headers)
    assert up_res.status_code == 200, up_res.text
    img_url = up_res.json()["url"]
    print_success(f"이미지 파일 업로드 성공: {img_url}")

    create_post_res = client.post("/api/posts", headers=user_headers, json={
        "caption": "오늘의 성수동 카페 나들이 ☕️🍰 분위기 최고! #성수카페 #일상",
        "location": "성수동 카페거리",
        "media_urls": [img_url]
    })
    assert create_post_res.status_code == 200, create_post_res.text
    new_post = create_post_res.json()
    post_id = new_post["id"]
    print_success(f"새 피드 게시물 등록 완료 (Post ID: {post_id}, Media Count: {len(new_post['media'])})")

    # -------------------------------------------------------------
    # 6. 메인 피드 조회 및 게시물 상세 확인
    # -------------------------------------------------------------
    print_step("6. 피드 및 게시물 상세 조회")
    feed_res = client.get("/api/posts/feed?limit=10", headers=alex_headers)
    assert feed_res.status_code == 200, feed_res.text
    feed_items = feed_res.json()["items"]
    # 방금 생성한 게시물이 피드에 존재하는지 확인
    found_in_feed = any(p["id"] == post_id for p in feed_items)
    assert found_in_feed, "새로 작성한 게시물이 피드에 조회되어야 합니다."
    print_success("메인 피드에서 신규 작성 게시물 노출 확인")

    detail_res = client.get(f"/api/posts/{post_id}", headers=alex_headers)
    assert detail_res.status_code == 200, detail_res.text
    assert detail_res.json()["caption"] == new_post["caption"]
    print_success("게시물 상세 단건 모달 조회 성공")

    # -------------------------------------------------------------
    # 7. 좋아요 및 댓글 상호작용 & 실시간 알림 연동 검증
    # -------------------------------------------------------------
    print_step("7. 좋아요/댓글 인터랙션 및 알림 연동 검증")
    # alex_creator가 tester의 게시물에 좋아요
    like_res = client.post(f"/api/posts/{post_id}/likes", headers=alex_headers)
    assert like_res.status_code == 200, like_res.text
    assert like_res.json()["liked"] is True
    print_success("alex_creator의 게시물 좋아요 토글(liked: True) 완료")

    # alex_creator가 tester의 게시물에 댓글 작성
    cmt_res = client.post(f"/api/posts/{post_id}/comments", headers=alex_headers, json={
        "content": "분위기 너무 좋네요! 디저트도 맛있어보여요 😋"
    })
    assert cmt_res.status_code == 200, cmt_res.text
    comment_id = cmt_res.json()["id"]
    print_success(f"댓글 작성 완료 (Comment ID: {comment_id})")

    # tester_kim_2026의 알림함 확인 (좋아요 알림 & 댓글 알림 수신 검증)
    tester_notifs_after = client.get("/api/notifications", headers=user_headers)
    t_notif_items = tester_notifs_after.json()
    like_notif = next((n for n in t_notif_items if n["type"] == "like_post" and n["target_id"] == post_id), None)
    cmt_notif = next((n for n in t_notif_items if n["type"] == "comment" and n["target_id"] == post_id), None)
    assert like_notif is not None, "좋아요 알림이 정상 수신되어야 합니다."
    assert cmt_notif is not None, "댓글 알림이 정상 수신되어야 합니다."
    print_success(f"좋아요 알림 수신 확인: \"{like_notif['text_preview']}\"")
    print_success(f"댓글 알림 수신 확인: \"{cmt_notif['text_preview']}\"")

    # -------------------------------------------------------------
    # 8. 북마크 및 '저장됨' 탭 목록 검증
    # -------------------------------------------------------------
    print_step("8. 북마크 및 프로필 '저장됨' 탭 연동 검증")
    # alex_creator가 이 게시물을 북마크(저장)
    bm_res = client.post(f"/api/posts/{post_id}/bookmarks", headers=alex_headers)
    assert bm_res.status_code == 200, bm_res.text
    assert bm_res.json()["bookmarked"] is True
    print_success("게시물 북마크(저장) 성공")

    # alex_creator의 저장됨 탭 목록 조회
    saved_res = client.get("/api/users/saved", headers=alex_headers)
    assert saved_res.status_code == 200, saved_res.text
    saved_posts = saved_res.json()
    saved_ids = [p["id"] for p in saved_posts]
    assert post_id in saved_ids, "북마크한 게시물이 저장됨 탭에 나타나야 합니다."
    print_success(f"프로필 '저장됨' 탭에서 북마크 게시물 정상 렌더링 확인 (총 {len(saved_posts)}개 저장됨)")

    # -------------------------------------------------------------
    # 9. 1:1 다이렉트 메시지(DM) 전송, 안읽음 카운트, 읽음 처리, 리액션
    # -------------------------------------------------------------
    print_step("9. 다이렉트 메시지(DM) 풀 사이클 검증")
    # alex가 tester에게 대화방 개설
    conv_res = client.post("/api/direct/conversations", headers=alex_headers, json={"target_user_id": test_user_id})
    assert conv_res.status_code == 200, conv_res.text
    conv_id = conv_res.json()["id"]
    print_success(f"1:1 대화방 생성/조회 성공: {conv_id}")

    # alex가 메시지 전송
    send_res = client.post(f"/api/direct/conversations/{conv_id}/messages", headers=alex_headers, json={
        "text": "안녕하세요! 카페 위치 정보 좀 알 수 있을까요?"
    })
    assert send_res.status_code == 200, send_res.text
    msg_id = send_res.json()["id"]
    print_success(f"메시지 전송 성공 (ID: {msg_id})")

    # tester 관점에서 대화방 목록 조회 -> unread_count >= 1 검증
    t_convs = client.get("/api/direct/conversations", headers=user_headers)
    my_conv = next((c for c in t_convs.json() if c["id"] == conv_id), None)
    assert my_conv is not None
    assert my_conv["unread_count"] >= 1, f"안읽은 메시지 수가 1 이상이어야 합니다. Got: {my_conv['unread_count']}"
    print_success(f"수신자 대화방 목록에서 안읽은 메시지 뱃지({my_conv['unread_count']}개) 확인")

    # tester가 대화방 진입 -> 읽음 처리 API 호출
    read_res = client.post(f"/api/direct/conversations/{conv_id}/read", headers=user_headers)
    assert read_res.status_code == 200, read_res.text
    # 다시 대화방 목록 조회 -> unread_count == 0 검증
    t_convs_after = client.get("/api/direct/conversations", headers=user_headers)
    my_conv_after = next((c for c in t_convs_after.json() if c["id"] == conv_id), None)
    assert my_conv_after["unread_count"] == 0, "읽음 처리 후 unread_count는 0이어야 합니다."
    print_success("대화방 읽음 처리 및 unread_count 0 초기화 검증 통과")

    # tester가 메시지에 하트(❤️) 리액션
    rx_res = client.post(f"/api/direct/messages/{msg_id}/reactions", headers=user_headers, json={"reaction": "❤️"})
    assert rx_res.status_code == 200, rx_res.text
    assert "❤️" in rx_res.json()["reactions"]
    print_success("메시지 하트(❤️) 리액션 토글 성공")

    # -------------------------------------------------------------
    # 10. 릴스 스트림 & 리포스트 카운트 검증
    # -------------------------------------------------------------
    print_step("10. 릴스 스트림 및 리포스트 검증")
    reels_res = client.get("/api/reels?limit=5", headers=user_headers)
    assert reels_res.status_code == 200, reels_res.text
    assert len(reels_res.json()) > 0
    target_reel = reels_res.json()[0]
    reel_id = target_reel["id"]
    prev_reposts = target_reel.get("repostsCount", 0)

    repost_res = client.post(f"/api/reels/{reel_id}/repost", headers=user_headers)
    assert repost_res.status_code == 200, repost_res.text
    assert repost_res.json()["reposts_count"] == prev_reposts + 1
    print_success(f"릴스 리포스트 카운트 증가 확인: {prev_reposts} -> {prev_reposts + 1}")

    # -------------------------------------------------------------
    # 11. 탐색(Explore) 통합 검색 검증
    # -------------------------------------------------------------
    print_step("11. 탐색 4열 그리드 및 키워드 검색 검증")
    exp_res = client.get("/api/explore?q=성수", headers=user_headers)
    assert exp_res.status_code == 200, exp_res.text
    assert len(exp_res.json()) >= 1
    print_success(f"키워드 '성수' 검색 결과 {len(exp_res.json())}개 아이템 반환 확인")

    # -------------------------------------------------------------
    # 12. 전체 알림 일괄 읽음 처리 검증
    # -------------------------------------------------------------
    print_step("12. 알림 일괄 읽음 처리 검증")
    read_all_res = client.put("/api/notifications/read-all", headers=user_headers)
    assert read_all_res.status_code == 200, read_all_res.text
    notifs_final = client.get("/api/notifications", headers=user_headers).json()
    all_read = all(n["is_read"] is True for n in notifs_final)
    assert all_read, "모든 알림이 is_read=True 이어야 합니다."
    print_success("모든 활동 알림 일괄 읽음(is_read=True) 검증 통과")

    print("\n==================================================================")
    print("🏆 모든 핵심 사용자 시나리오(가입~로그인~피드~좋아요~DM~알림) 100% 정상 작동 검증 완료!")
    print("==================================================================")

if __name__ == "__main__":
    run_scenario_test()
