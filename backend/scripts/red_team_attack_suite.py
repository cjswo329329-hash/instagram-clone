"""
Instagram Clone Red Team Penetration Testing & Attack Simulation Suite
실제 모의 침투(Penetration Testing) 및 공격 시나리오를 수행하여 취약점을 색출하고 검증합니다.
"""

import sys
import os
import io
import json
import time
from datetime import datetime, timedelta

# backend 경로 sys.path 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from jose import jwt
from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.post import Post, PostMedia
from app.models.comment import Comment
from app.models.direct import Conversation, Message
from app.models.follow import Follow
from app.models.notification import Notification

client = TestClient(app)

class RedTeamLogger:
    def __init__(self):
        self.findings = []
        self.passes = 0
        self.fails = 0

    def record(self, category, test_name, status, detail=""):
        if status == "BLOCKED" or status == "PASSED":
            self.passes += 1
            icon = "🛡️ [방어성공]"
        elif status == "VULNERABLE":
            self.fails += 1
            icon = "🚨 [취약점발견]"
            self.findings.append({"category": category, "test": test_name, "detail": detail})
        else:
            icon = "⚠️ [경고/확인]"
        print(f"  {icon} [{category}] {test_name}: {detail}")

logger = RedTeamLogger()

def setup_test_actors():
    """테스트를 위한 공격자(Attacker User B) 및 피해자(Victim User A, User C) 세팅"""
    # 1. Victim User A: alex_creator (ID: 1)
    res_a = client.post("/api/auth/login", json={"username_or_email": "alex_creator", "password": "aaaa1234"})
    assert res_a.status_code == 200, f"Victim A 로그인 실패: {res_a.text}"
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Attacker User B: cafe_vibes (ID: 2)
    res_b = client.post("/api/auth/login", json={"username_or_email": "cafe_vibes", "password": "aaaa1234"})
    assert res_b.status_code == 200, f"Attacker B 로그인 실패: {res_b.text}"
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Private Victim User C: red_victim_private
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        p_user = db.query(User).filter(User.username == "red_victim_private").first()
        if not p_user:
            p_user = User(
                username="red_victim_private",
                email="victim_private@example.com",
                hashed_password=get_password_hash("aaaa1234"),
                full_name="비공개 피해자",
                is_private=True,
                is_verified=False
            )
            db.add(p_user)
            db.commit()
            db.refresh(p_user)

            # 비공개 유저의 비밀 게시물 생성
            priv_post = Post(user_id=p_user.id, caption="비공개 비밀 일기장 (외부 노출 금지)", location="비밀장소")
            db.add(priv_post)
            db.commit()
            db.refresh(priv_post)
            media = PostMedia(post_id=priv_post.id, media_url="https://example.com/secret.jpg", media_type="image", order_index=0)
            db.add(media)
            db.commit()
        else:
            priv_post = db.query(Post).filter(Post.user_id == p_user.id).first()

        priv_user_id = p_user.id
        priv_post_id = priv_post.id
    finally:
        db.close()

    return {
        "headers_a": headers_a,
        "headers_b": headers_b,
        "token_a": token_a,
        "token_b": token_b,
        "priv_username": "red_victim_private",
        "priv_user_id": priv_user_id,
        "priv_post_id": priv_post_id
    }

# =====================================================================
# 1. JWT & 인증 우회 공격 (Authentication Attacks)
# =====================================================================
def test_jwt_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 1] JWT 토큰 위조 및 인증 우회 공격 테스트")
    print("=" * 60)

    # 1.1 Alg: none 취약점 공격 (수동 구성)
    import base64
    payload_none = {"sub": "1", "type": "access", "exp": int(time.time()) + 3600}
    header_b64 = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_none).encode()).decode().rstrip("=")
    token_none = f"{header_b64}.{payload_b64}."
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_none}"})
    if res.status_code == 401:
        logger.record("JWT", "Alg=none 서명 미검증 공격", "BLOCKED", f"HTTP {res.status_code} 차단 성공")
    else:
        logger.record("JWT", "Alg=none 서명 미검증 공격", "VULNERABLE", f"HTTP {res.status_code} 우회 성공")

    # 1.2 위조된 시크릿 키로 서명된 토큰 공격
    forged_token = jwt.encode(payload_none, "attacker_fake_secret_key_1234", algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    if res.status_code == 401:
        logger.record("JWT", "위조 시크릿 키 서명 토큰 공격", "BLOCKED", f"HTTP {res.status_code} 서명 검증 실패 차단")
    else:
        logger.record("JWT", "위조 시크릿 키 서명 토큰 공격", "VULNERABLE", f"HTTP {res.status_code} 우회 성공")

    # 1.3 만료된 토큰(Expired Token) 재생 공격
    expired_payload = {"sub": "1", "type": "access", "exp": int(time.time()) - 3600}
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    if res.status_code == 401:
        logger.record("JWT", "만료된 토큰 재생 공격", "BLOCKED", f"HTTP {res.status_code} 만료 토큰 거절")
    else:
        logger.record("JWT", "만료된 토큰 재생 공격", "VULNERABLE", f"HTTP {res.status_code} 만료 토큰 통과됨")

    # 1.4 토큰 타입 혼동 공격 (Refresh 토큰으로 API 접근 시도)
    refresh_token = jwt.encode({"sub": "1", "type": "refresh", "exp": int(time.time()) + 3600}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {refresh_token}"})
    if res.status_code == 401:
        logger.record("JWT", "토큰 타입 혼동 공격(Refresh->Access)", "BLOCKED", f"HTTP {res.status_code} 타입 검증 차단")
    else:
        logger.record("JWT", "토큰 타입 혼동 공격(Refresh->Access)", "VULNERABLE", f"HTTP {res.status_code} 허용됨")

    # 1.5 비정상 sub 값 퍼징 (sub: 문자열 "admin" 등)
    fuzz_payload = {"sub": "admin_hacker", "type": "access", "exp": int(time.time()) + 3600}
    fuzz_token = jwt.encode(fuzz_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {fuzz_token}"})
    if res.status_code == 401:
        logger.record("JWT", "비정상 sub 퍼징 공격", "BLOCKED", f"HTTP {res.status_code} 처리")
    elif res.status_code == 500:
        logger.record("JWT", "비정상 sub 퍼징 공격", "VULNERABLE", "서버 500 내부 에러 발생 (예외 미처리)")
    else:
        logger.record("JWT", "비정상 sub 퍼징 공격", "VULNERABLE", f"HTTP {res.status_code} 발생")

    # 1.6 무작위 쓰레기 토큰 문자열 공격
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer this.is.garbage.jwt.payload"})
    if res.status_code == 401:
        logger.record("JWT", "변조된 Base64 쓰레기 토큰 공격", "BLOCKED", f"HTTP {res.status_code} 차단")
    else:
        logger.record("JWT", "변조된 Base64 쓰레기 토큰 공격", "VULNERABLE", f"HTTP {res.status_code} 통과")

# =====================================================================
# 2. IDOR 및 수평적 권한 상승 공격 (IDOR / BOLA Attacks)
# =====================================================================
def test_idor_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 2] IDOR(Insecure Direct Object Reference) 수평적 권한 상승 공격")
    print("=" * 60)

    # 2.1 공격자 User B가 피해자 User A의 게시물 삭제 시도
    # 먼저 User A의 게시물 하나 확인 또는 생성
    res_create = client.post("/api/posts", json={
        "caption": "User A의 중요 게시물",
        "media_urls": ["https://example.com/a.jpg"]
    }, headers=actors["headers_a"])
    post_a_id = res_create.json()["id"]

    # User B가 삭제 시도
    res_del = client.delete(f"/api/posts/{post_a_id}", headers=actors["headers_b"])
    if res_del.status_code == 403:
        logger.record("IDOR", "타인 게시물 임의 삭제 공격", "BLOCKED", "HTTP 403 차단 성공 (작성자 권한 검증)")
    else:
        logger.record("IDOR", "타인 게시물 임의 삭제 공격", "VULNERABLE", f"HTTP {res_del.status_code} 삭제 성공 또는 허용됨")

    # 2.2 공격자 User B가 User A의 게시물에 달린 User A의 댓글 임의 삭제 시도
    res_cmt = client.post(f"/api/posts/{post_a_id}/comments", json={"content": "User A의 원본 댓글"}, headers=actors["headers_a"])
    cmt_a_id = res_cmt.json()["id"]

    res_del_cmt = client.delete(f"/api/comments/{cmt_a_id}", headers=actors["headers_b"])
    if res_del_cmt.status_code == 403:
        logger.record("IDOR", "타인 댓글 임의 삭제 공격", "BLOCKED", "HTTP 403 차단 성공 (소유자 권한 검증)")
    else:
        logger.record("IDOR", "타인 댓글 임의 삭제 공격", "VULNERABLE", f"HTTP {res_del_cmt.status_code} 타인 댓글 삭제됨")

    # 2.3 공격자 User B(ID: 2)가 User A(ID: 1)와 User C(ID: 3) 간의 비공개 DM 대화방 메시지 엿보기 시도
    # User 1과 User 3 간의 전용 대화방 생성 및 비밀 메시지 전송
    res_conv_init = client.post("/api/direct/conversations", json={"target_user_id": 3}, headers=actors["headers_a"])
    assert res_conv_init.status_code == 200
    target_conv_id = res_conv_init.json()["id"]

    res_secret_msg = client.post(f"/api/direct/conversations/{target_conv_id}/messages", json={"text": "User 1과 3의 일급비밀 대화"}, headers=actors["headers_a"])
    assert res_secret_msg.status_code == 200
    secret_msg_id = res_secret_msg.json()["id"]

    # User B(ID: 2)가 도청 시도
    res_spy = client.get(f"/api/direct/conversations/{target_conv_id}/messages", headers=actors["headers_b"])
    if res_spy.status_code == 403:
        logger.record("IDOR", "타인 비공개 DM 대화 도청/조회 공격", "BLOCKED", "HTTP 403 대화방 참가자 검증 차단")
    else:
        logger.record("IDOR", "타인 비공개 DM 대화 도청/조회 공격", "VULNERABLE", f"HTTP {res_spy.status_code} 타인 메시지 열람됨")

    # 2.4 공격자 User B가 타인 대화방에 메시지 위조 주입(Injection) 시도
    res_inject = client.post(f"/api/direct/conversations/{target_conv_id}/messages", json={"text": "악의적인 주입 메시지"}, headers=actors["headers_b"])
    if res_inject.status_code == 403:
        logger.record("IDOR", "타인 대화방 메시지 위조 주입 공격", "BLOCKED", "HTTP 403 차단")
    else:
        logger.record("IDOR", "타인 대화방 메시지 위조 주입 공격", "VULNERABLE", f"HTTP {res_inject.status_code} 주입 성공")

    # 2.5 공격자 User B가 타인 대화방 메시지에 반응(Reaction) 조작 시도
    res_react = client.post(f"/api/direct/messages/{secret_msg_id}/reactions", json={"reaction": "🔥"}, headers=actors["headers_b"])
    if res_react.status_code == 403:
        logger.record("IDOR", "타인 비공개 DM 메시지 리액션 조작 공격", "BLOCKED", "HTTP 403 대화방 참여자 검증 차단")
    elif res_react.status_code == 200:
        logger.record("IDOR", "타인 비공개 DM 메시지 리액션 조작 공격", "VULNERABLE", "HTTP 200 타인 대화 메시지 리액션 임의 조작 성공!")
    else:
        logger.record("IDOR", "타인 비공개 DM 메시지 리액션 조작 공격", "WARNING", f"HTTP {res_react.status_code}")

    # 2.6 공격자 User B가 피해자 User A의 알림을 강제 읽음 처리 시도
    res_notifs = client.get("/api/notifications", headers=actors["headers_a"])
    notifs = res_notifs.json()
    if notifs:
        target_notif_id = notifs[0]["id"]
        res_notif_tamper = client.put(f"/api/notifications/{target_notif_id}/read", headers=actors["headers_b"])
        if res_notif_tamper.status_code == 403:
            logger.record("IDOR", "타인 알림 상태 위변조 공격", "BLOCKED", "HTTP 403 수신자 권한 검증 차단")
        else:
            logger.record("IDOR", "타인 알림 상태 위변조 공격", "VULNERABLE", f"HTTP {res_notif_tamper.status_code} 조작 허용됨")

    # 정리: 생성한 테스트 게시물 A 삭제
    client.delete(f"/api/posts/{post_a_id}", headers=actors["headers_a"])

# =====================================================================
# 3. 비공개 계정 프라이버시 침해 공격 (Private Account Privacy Bypass)
# =====================================================================
def test_privacy_bypass_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 3] 비공개 계정 프라이버시 침해 및 권한 우회(BOLA) 공격")
    print("=" * 60)
    priv_username = actors["priv_username"]
    priv_post_id = actors["priv_post_id"]

    # 3.1 비인가 사용자/비팔로워(User B)가 비공개 계정의 게시물 탭 조회 시도
    res_posts = client.get(f"/api/users/{priv_username}/posts", headers=actors["headers_b"])
    if res_posts.status_code == 403 or (res_posts.status_code == 200 and len(res_posts.json()) == 0):
        logger.record("Privacy", "비공개 계정 게시물 탭 목록 비인가 조회", "BLOCKED", f"차단 또는 빈 목록 반환 ({len(res_posts.json()) if res_posts.status_code == 200 else res_posts.status_code})")
    else:
        logger.record("Privacy", "비공개 계정 게시물 탭 목록 비인가 조회", "VULNERABLE", f"HTTP {res_posts.status_code} 비공개 게시물 {len(res_posts.json())}개 누출!")

    # 3.2 비인가 사용자가 비공개 계정의 릴스 탭 조회 시도
    res_reels = client.get(f"/api/users/{priv_username}/reels", headers=actors["headers_b"])
    if res_reels.status_code == 403 or (res_reels.status_code == 200 and len(res_reels.json()) == 0):
        logger.record("Privacy", "비공개 계정 릴스 탭 목록 비인가 조회", "BLOCKED", f"차단 또는 빈 목록 반환")
    else:
        logger.record("Privacy", "비공개 계정 릴스 탭 목록 비인가 조회", "VULNERABLE", f"HTTP {res_reels.status_code} 비공개 릴스 누출!")

    # 3.3 비인가 사용자가 ID를 직접 지정하여 비공개 게시물 상세 조회 시도 (/api/posts/{id})
    res_detail = client.get(f"/api/posts/{priv_post_id}", headers=actors["headers_b"])
    if res_detail.status_code in [403, 404]:
        logger.record("Privacy", "비공개 게시물 단건 직접 조회(IDOR)", "BLOCKED", f"HTTP {res_detail.status_code} 접근 차단")
    else:
        logger.record("Privacy", "비공개 게시물 단건 직접 조회(IDOR)", "VULNERABLE", f"HTTP {res_detail.status_code} 비공개 상세 본문 누출: '{res_detail.json().get('caption')}'")

    # 3.4 공개 탐색(Explore) 피드에 비공개 계정 게시물 노출 여부 확인
    res_explore = client.get("/api/explore?limit=50")
    explore_items = res_explore.json()
    leaked = any(it["id"] == priv_post_id for it in explore_items)
    if not leaked:
        logger.record("Privacy", "공개 탐색(Explore) 피드 비공개 게시물 누출 검사", "BLOCKED", "탐색 피드에 비공개 게시물 노출 없음")
    else:
        logger.record("Privacy", "공개 탐색(Explore) 피드 비공개 게시물 누출 검사", "VULNERABLE", "공개 탐색 그리드에 비공개 게시물이 노출됨!")

# =====================================================================
# 4. SQL 인젝션 공격 (SQL Injection Attacks)
# =====================================================================
def test_sql_injection_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 4] SQL 인젝션(SQLi) 취약점 모의 공격")
    print("=" * 60)

    sqli_payloads = [
        "' OR '1'='1",
        "admin' --",
        "'; DROP TABLE users; --",
        "1' UNION SELECT 1, 'hacked', 'hacked', 'hacked', 1, 1, 1, 1 --",
        "' OR 1=1 LIMIT 1; --"
    ]

    for p in sqli_payloads:
        # 사용자 검색 파라미터 공격
        res_search = client.get("/api/users/search", params={"q": p})
        if res_search.status_code in [200, 422]:
            # SQL 문법 오류 500이 나지 않고 정상 매칭 0건 또는 안전 조회인지 확인
            logger.record("SQLi", f"유저 검색 쿼리 SQLi 공격 ({p[:20]})", "BLOCKED", f"HTTP {res_search.status_code} 안전 처리")
        else:
            logger.record("SQLi", f"유저 검색 쿼리 SQLi 공격 ({p[:20]})", "VULNERABLE", f"HTTP {res_search.status_code} 에러 누출")

    # 탐색 키워드 검색 SQLi 공격
    res_exp_sqli = client.get("/api/explore", params={"q": "'; SELECT * FROM users; --"})
    if res_exp_sqli.status_code == 200:
        logger.record("SQLi", "탐색(Explore) 키워드 SQLi 공격", "BLOCKED", "SQL 파라미터 바인딩 방어 성공")
    else:
        logger.record("SQLi", "탐색(Explore) 키워드 SQLi 공격", "VULNERABLE", f"HTTP {res_exp_sqli.status_code}")

    # 로그인 폼 SQLi 인증 우회 공격
    res_login_sqli = client.post("/api/auth/login", json={
        "username_or_email": "' OR '1'='1' --",
        "password": "whatever_password"
    })
    if res_login_sqli.status_code == 401:
        logger.record("SQLi", "로그인 입력창 SQLi 인증 우회 공격", "BLOCKED", "HTTP 401 안전 거절")
    else:
        logger.record("SQLi", "로그인 입력창 SQLi 인증 우회 공격", "VULNERABLE", f"HTTP {res_login_sqli.status_code} 로그인 우회 성공!")

# =====================================================================
# 5. 저장형 XSS 및 스크립트 주입 공격 (Stored XSS Attacks)
# =====================================================================
def test_xss_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 5] Stored XSS 및 스크립트 인젝션 공격")
    print("=" * 60)

    xss_payload = "<script>alert('XSS_ATTACK')</script><img src=x onerror=alert(document.cookie)>"

    # 5.1 게시물 본문에 악성 스크립트 삽입
    res_post_xss = client.post("/api/posts", json={
        "caption": xss_payload,
        "media_urls": ["https://example.com/xss.jpg"]
    }, headers=actors["headers_b"])
    if res_post_xss.status_code == 200:
        post_id = res_post_xss.json()["id"]
        # 저장 후 조회 시 서버가 죽지 않고 안전한 JSON 문자열로 인코딩되어 반환되는지 확인
        res_get = client.get(f"/api/posts/{post_id}", headers=actors["headers_b"])
        # JSON 직렬화에 의해 이스케이프 또는 안전한 string 데이터 타입으로 유지됨 (React는 기본 자동 이스케이프)
        assert res_get.headers.get("content-type", "").startswith("application/json")
        logger.record("XSS", "게시물 본문 Stored XSS 주입", "BLOCKED", "JSON Content-Type 응답 유지 및 브라우저 실행 무해화")
        client.delete(f"/api/posts/{post_id}", headers=actors["headers_b"])
    else:
        logger.record("XSS", "게시물 본문 Stored XSS 주입", "VULNERABLE", f"HTTP {res_post_xss.status_code}")

    # 5.2 프로필 바이오(Bio) XSS 주입
    res_bio = client.put("/api/users/profile", json={"bio": "\"><svg onload=alert(1)>"}, headers=actors["headers_b"])
    if res_bio.status_code == 200:
        logger.record("XSS", "프로필 Bio HTML/SVG 주입", "BLOCKED", "안전한 JSON 텍스트로 처리됨")
    else:
        logger.record("XSS", "프로필 Bio HTML/SVG 주입", "VULNERABLE", f"HTTP {res_bio.status_code}")

# =====================================================================
# 6. 파일 업로드 악용 및 경로 조작 공격 (File Upload Vulnerabilities)
# =====================================================================
def test_upload_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 6] 파일 업로드 악용 및 경로 순회(Path Traversal) 공격")
    print("=" * 60)

    # 6.1 Path Traversal 파일명 주입 공격 (../../evil.php)
    evil_filename = "../../../etc/cron.daily/malicious.jpg"
    fake_content = b"\xff\xd8\xff\xe0" + b"A" * 50
    files = {"file": (evil_filename, io.BytesIO(fake_content), "image/jpeg")}
    res_traversal = client.post("/api/uploads/media", files=files, data={"category": "posts"}, headers=actors["headers_b"])
    if res_traversal.status_code == 200:
        ret_filename = res_traversal.json()["filename"]
        # 반환된 파일명이 UUID로 난수화되어 상대경로 ../ 가 완전히 무력화되었는지 검증
        if ".." not in ret_filename and "/" not in ret_filename and "\\" not in ret_filename:
            logger.record("Upload", "Path Traversal 파일명 조작 공격", "BLOCKED", f"UUID 난수화로 경로 조작 완전 차단 ({ret_filename})")
        else:
            logger.record("Upload", "Path Traversal 파일명 조작 공격", "VULNERABLE", f"경로 조작 취약점 노출 ({ret_filename})")
    else:
        logger.record("Upload", "Path Traversal 파일명 조작 공격", "BLOCKED", f"HTTP {res_traversal.status_code} 거부")

    # 6.2 악성 실행 파일 확장자 업로드 공격 (.exe, .php, .sh)
    malicious_files = [
        ("web_shell.php", b"<?php system($_GET['cmd']); ?>", "application/x-php"),
        ("ransomware.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-dosexec"),
        ("evil_script.sh", b"#!/bin/bash\nrm -rf /", "application/x-sh")
    ]
    for m_fname, m_bytes, m_mime in malicious_files:
        files = {"file": (m_fname, io.BytesIO(m_bytes), m_mime)}
        res_mal = client.post("/api/uploads/media", files=files, data={"category": "posts"}, headers=actors["headers_b"])
        if res_mal.status_code == 200:
            ret = res_mal.json()
            # 파일이 실행 확장자로 저장되지 않고 강제 변환되었는지 검증
            if ret["filename"].endswith(".exe") or ret["filename"].endswith(".php") or ret["filename"].endswith(".sh"):
                logger.record("Upload", f"위험 확장자({m_fname}) 업로드 공격", "VULNERABLE", f"실행 확장자 그대로 저장됨: {ret['filename']}")
            else:
                logger.record("Upload", f"위험 확장자({m_fname}) 업로드 공격", "BLOCKED", f"위험 확장자 무력화 -> {ret['filename']}")
        else:
            logger.record("Upload", f"위험 확장자({m_fname}) 업로드 공격", "BLOCKED", f"HTTP {res_mal.status_code} 차단")

    # 6.3 비인가 게스트 파일 업로드 시도 (인증 누락 검증)
    files = {"file": ("test.jpg", io.BytesIO(fake_content), "image/jpeg")}
    res_unauth = client.post("/api/uploads/media", files=files, data={"category": "posts"})
    if res_unauth.status_code == 401:
        logger.record("Upload", "비인가 게스트 파일 업로드 공격", "BLOCKED", "HTTP 401 인증 필수 차단")
    else:
        logger.record("Upload", "비인가 게스트 파일 업로드 공격", "VULNERABLE", f"HTTP {res_unauth.status_code} 게스트 업로드 허용됨")

    # 6.4 0바이트 빈 파일 업로드 공격
    files = {"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")}
    res_empty = client.post("/api/uploads/media", files=files, data={"category": "posts"}, headers=actors["headers_b"])
    if res_empty.status_code in [400, 422]:
        logger.record("Upload", "0바이트 빈 파일 업로드 공격", "BLOCKED", f"HTTP {res_empty.status_code} 빈 파일 차단")
    elif res_empty.status_code == 200:
        logger.record("Upload", "0바이트 빈 파일 업로드 공격", "VULNERABLE", "0바이트 빈 파일이 정상 저장됨 (용량 낭비/유효성 미흡)")
    else:
        logger.record("Upload", "0바이트 빈 파일 업로드 공격", "WARNING", f"HTTP {res_empty.status_code}")

# =====================================================================
# 7. 경계값 파라미터 퍼징 및 DoS 공격 (Boundary Fuzzing & DoS)
# =====================================================================
def test_boundary_and_fuzzing_attacks(actors):
    print("\n" + "=" * 60)
    print("⚔️ [벡터 7] 경계값 파라미터 퍼징 및 DoS 방어력 테스트")
    print("=" * 60)

    # 7.1 음수 페이지 limit/offset 공격
    res_neg = client.get("/api/posts/feed?limit=-1", headers=actors["headers_b"])
    if res_neg.status_code == 422:
        logger.record("Fuzzing", "음수 페이징 파라미터(limit=-1) 공격", "BLOCKED", "FastAPI Query(ge=1) 유효성 검사 422 차단")
    else:
        logger.record("Fuzzing", "음수 페이징 파라미터(limit=-1) 공격", "VULNERABLE", f"HTTP {res_neg.status_code} 허용됨")

    # 7.2 극단적인 초대용량 limit(limit=9999999) DoS 공격
    res_huge = client.get("/api/posts/feed?limit=9999999", headers=actors["headers_b"])
    if res_huge.status_code == 422:
        logger.record("Fuzzing", "초대용량 limit(9999999) 메모리 고갈 DoS 공격", "BLOCKED", "Query(le=50) 최대값 제한 422 차단")
    else:
        logger.record("Fuzzing", "초대용량 limit(9999999) 메모리 고갈 DoS 공격", "VULNERABLE", f"HTTP {res_huge.status_code} 메모리 고갈 위험")

    # 7.3 특수 제어문자 및 Null Byte(\\0) 주입
    res_null = client.get("/api/users/search?q=%00%00%00")
    if res_null.status_code in [200, 422]:
        logger.record("Fuzzing", "Null Byte(%00) 인젝션 공격", "BLOCKED", "서버 크래시 없이 정상 처리")
    else:
        logger.record("Fuzzing", "Null Byte(%00) 인젝션 공격", "VULNERABLE", f"HTTP {res_null.status_code} 비정상 응답")

def main():
    print("*" * 65)
    print("🛡️ [RED TEAM PENETRATION TEST] 인스타그램 클론 시스템 모의 침투 시작")
    print("*" * 65)

    actors = setup_test_actors()
    test_jwt_attacks(actors)
    test_idor_attacks(actors)
    test_privacy_bypass_attacks(actors)
    test_sql_injection_attacks(actors)
    test_xss_attacks(actors)
    test_upload_attacks(actors)
    test_boundary_and_fuzzing_attacks(actors)

    print("\n" + "=" * 65)
    print(f"📊 모의 침투 결과 요약: 방어 성공 {logger.passes}건 / 취약점 발견 {logger.fails}건")
    if logger.findings:
        print("🚨 발견된 주요 보안 취약점 목록:")
        for idx, f in enumerate(logger.findings, 1):
            print(f"  [{idx}] [{f['category']}] {f['test']}: {f['detail']}")
    else:
        print("🎉 모든 공격 벡터에 대해 견고한 보안 방어선이 유지되고 있습니다!")
    print("=" * 65)

if __name__ == "__main__":
    main()
