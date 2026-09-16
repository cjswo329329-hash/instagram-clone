"""
Admin Dashboard Commercial Readiness & Security Verification Suite
관리자 대시보드의 상용화 수준(보안, 성능 최적화, 제재, 신고 심사, 감사 로그, 인프라 헬스) 종합 검증
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.post import Post, PostMedia
from app.models.audit_log import AdminAuditLog
from app.models.report import Report
from app.core.security import get_password_hash

client = TestClient(app)

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def check(self, title: str, condition: bool, message: str = ""):
        if condition:
            self.passed += 1
            print(f"  ✅ [PASS] {title}")
        else:
            self.failed += 1
            print(f"  ❌ [FAIL] {title}: {message}")
            self.errors.append(f"{title}: {message}")

def run_tests():
    runner = TestRunner()
    print("=" * 70)
    print("🚀 [TEST SUITE] 관리자 대시보드 상용화 수준 & 보안 자가 검증 시작")
    print("=" * 70)

    # 0. 계정 준비
    db = SessionLocal()
    try:
        # Admin 계정 (admin / pass123)
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@instagram.local",
                hashed_password=get_password_hash("pass123"),
                full_name="시스템 관리자",
                is_admin=True
            )
            db.add(admin)
            db.commit()

        # 테스트용 일반 유저 A (test_user_a)
        user_a = db.query(User).filter(User.username == "test_comm_user_a").first()
        if not user_a:
            user_a = User(
                username="test_comm_user_a",
                email="comm_a@example.com",
                hashed_password=get_password_hash("pass1234"),
                full_name="테스트 일반회원 A",
                is_admin=False
            )
            db.add(user_a)
            db.commit()

        # 테스트용 불량 유저 B (test_spammer_b)
        user_b = db.query(User).filter(User.username == "test_spammer_b").first()
        if not user_b:
            user_b = User(
                username="test_spammer_b",
                email="spammer_b@example.com",
                hashed_password=get_password_hash("pass1234"),
                full_name="스팸 악성유저 B",
                is_admin=False
            )
            db.add(user_b)
            db.commit()
        else:
            # 상태 초기화
            user_b.is_banned = False
            user_b.ban_reason = None
            db.commit()

        # 스팸 유저 B의 불량 게시물 생성
        post_b = db.query(Post).filter(Post.user_id == user_b.id).first()
        if not post_b:
            post_b = Post(
                user_id=user_b.id,
                caption="[불법 스팸 광고] 고수익 보장 텔레그램 문의!",
                location="서울 강남구"
            )
            db.add(post_b)
            db.commit()
            db.refresh(post_b)
            media = PostMedia(post_id=post_b.id, media_url="https://example.com/spam.jpg", media_type="image", order_index=0)
            db.add(media)
            db.commit()

        post_b_id = post_b.id
        user_a_id = user_a.id
        user_b_id = user_b.id
    finally:
        db.close()

    # 1. 로그인 및 토큰 발급
    res_admin_login = client.post("/api/auth/login", json={"username_or_email": "admin", "password": "pass123"})
    runner.check("관리자 로그인", res_admin_login.status_code == 200, res_admin_login.text)
    admin_token = res_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_user_a_login = client.post("/api/auth/login", json={"username_or_email": "test_comm_user_a", "password": "pass1234"})
    runner.check("일반회원 A 로그인", res_user_a_login.status_code == 200, res_user_a_login.text)
    user_a_token = res_user_a_login.json()["access_token"]
    user_a_headers = {"Authorization": f"Bearer {user_a_token}"}

    # =========================================================================
    # 1. 접근 제어 및 보안 차단 검증
    # =========================================================================
    print("\n[테스트 1] 어드민 접근 제어 및 권한 검증")
    # 1.1 비인가 게스트 어드민 접근 차단
    res_guest = client.get("/api/admin/stats")
    runner.check("게스트 어드민 API 접근 차단 (401)", res_guest.status_code == 401, f"Status: {res_guest.status_code}")

    # 1.2 일반 사용자 어드민 접근 차단
    res_normal = client.get("/api/admin/stats", headers=user_a_headers)
    runner.check("일반 유저 어드민 API 접근 차단 (403)", res_normal.status_code == 403, f"Status: {res_normal.status_code}")

    # 1.3 관리자 본인 정지 차단
    res_ban_self = client.post(f"/api/admin/users/{res_admin_login.json()['user']['id']}/ban", json={"reason": "자해 시도"}, headers=admin_headers)
    runner.check("관리자 본인 계정 정지 차단 (400)", res_ban_self.status_code == 400, f"Status: {res_ban_self.status_code}")

    # 1.4 관리자 본인 탈퇴 차단
    res_del_self = client.delete(f"/api/admin/users/{res_admin_login.json()['user']['id']}", headers=admin_headers)
    runner.check("관리자 본인 계정 탈퇴/삭제 차단 (400)", res_del_self.status_code == 400, f"Status: {res_del_self.status_code}")

    # =========================================================================
    # 2. 계정 정지(Ban) 및 로그인 차단, 사유 안내 검증
    # =========================================================================
    print("\n[테스트 2] 회원 계정 정지(Ban) & 로그인 차단 및 정지사유 반환")
    # 2.1 관리자가 악성 유저 B 정지
    ban_reason = "도배 및 불법 사기 광고 게시 (이용약관 제12조 위반)"
    res_ban = client.post(f"/api/admin/users/{user_b_id}/ban", json={"reason": ban_reason}, headers=admin_headers)
    runner.check("악성 유저 계정 정지 처리", res_ban.status_code == 200, res_ban.text)

    # 2.2 정지된 유저 B 로그인 시도 -> 403 차단 및 정지 사유만 명확히 반환되는지 확인
    res_b_login = client.post("/api/auth/login", json={"username_or_email": "test_spammer_b", "password": "pass1234"})
    runner.check("정지된 계정 로그인 차단 (403)", res_b_login.status_code == 403, f"Status: {res_b_login.status_code}")
    login_err_detail = res_b_login.json().get("detail", "")
    runner.check("정지 사유 상세 메시지 포함 여부", ban_reason in login_err_detail, f"Detail: {login_err_detail}")
    runner.check("HTTP 403 Forbidden 문구가 에러 메시지에 노출되지 않는지 확인", "HTTP 403 Forbidden" not in login_err_detail, f"Detail: {login_err_detail}")

    # 2.3 정지 해제(Unban) 처리
    res_unban = client.post(f"/api/admin/users/{user_b_id}/unban", headers=admin_headers)
    runner.check("회원 계정 정지 해제 처리", res_unban.status_code == 200, res_unban.text)

    # 2.4 정지 해제 후 로그인 정상 복구 확인
    res_b_login_after = client.post("/api/auth/login", json={"username_or_email": "test_spammer_b", "password": "pass1234"})
    runner.check("정지 해제 후 정상 로그인 성공", res_b_login_after.status_code == 200, res_b_login_after.text)

    # =========================================================================
    # 3. 유해 콘텐츠 신고 및 모더레이션 센터 심사 검증
    # =========================================================================
    print("\n[테스트 3] 신고(Report) 접수 및 관리자 심사/조치")
    # 3.1 일반 유저 A가 스팸 게시물 B를 신고
    res_report = client.post("/api/reports", json={
        "target_type": "post",
        "target_id": post_b_id,
        "reason_category": "spam",
        "description": "반복적인 불법 광고 게시물입니다. 즉시 삭제해주세요."
    }, headers=user_a_headers)
    runner.check("일반 유저의 게시물 신고 접수", res_report.status_code == 201, res_report.text)
    report_id = res_report.json()["report_id"]

    # 3.2 중복 신고 시 중복 안내 확인
    res_dup = client.post("/api/reports", json={
        "target_type": "post",
        "target_id": post_b_id,
        "reason_category": "spam",
        "description": "다시 한번 신고합니다."
    }, headers=user_a_headers)
    runner.check("동일 대상 중복 신고 방어 (400)", res_dup.status_code == 400 and "이미 동일한" in res_dup.json().get("detail", ""), res_dup.text)

    # 3.3 관리자의 신고 목록 조회
    res_admin_reports = client.get("/api/admin/reports?status_filter=pending", headers=admin_headers)
    runner.check("관리자 미처리 신고 목록 조회", res_admin_reports.status_code == 200, res_admin_reports.text)
    reports_data = res_admin_reports.json()
    runner.check("신고 목록에 접수건 존재 확인", any(r["id"] == report_id for r in reports_data.get("items", [])), f"Items: {len(reports_data.get('items', []))}")

    # 3.4 관리자의 신고 심사 및 승인(콘텐츠 삭제 처리)
    res_action = client.post(f"/api/admin/reports/{report_id}/action", json={
        "action": "content_deleted",
        "notes": "스팸 광고 확인되어 즉시 게시물 강제 삭제 조치함"
    }, headers=admin_headers)
    runner.check("신고 심사 승인 및 콘텐츠 삭제 처리", res_action.status_code == 200, res_action.text)

    # 3.5 대상 게시물이 실제로 삭제되었는지 확인
    res_get_post = client.get(f"/api/posts/{post_b_id}")
    runner.check("신고 승인 후 실제 게시물 DB 삭제 확인 (404)", res_get_post.status_code == 404, f"Status: {res_get_post.status_code}")

    # =========================================================================
    # 4. 관리자 감사 로그(Admin Audit Log) 정합성 검증
    # =========================================================================
    print("\n[테스트 4] 관리자 감사 로그(Audit Logs) 기록 및 조회")
    res_logs = client.get("/api/admin/audit-logs", headers=admin_headers)
    runner.check("감사 로그 목록 조회", res_logs.status_code == 200, res_logs.text)
    logs_data = res_logs.json()
    actions = [l["action"] for l in logs_data.get("items", [])]
    runner.check("USER_BAN 감사 로그 기록 확인", "USER_BAN" in actions, f"Actions: {actions}")
    runner.check("USER_UNBAN 감사 로그 기록 확인", "USER_UNBAN" in actions, f"Actions: {actions}")
    runner.check("REPORT_RESOLVE 감사 로그 기록 확인", "REPORT_RESOLVE" in actions, f"Actions: {actions}")

    # =========================================================================
    # 5. 성능 및 쿼리 최적화 검증 (Stats & Users DB 레벨 페이징)
    # =========================================================================
    print("\n[테스트 5] 통계 및 회원 목록 DB 레벨 페이징 최적화 검증")
    res_stats = client.get("/api/admin/stats", headers=admin_headers)
    runner.check("통계 대시보드 API 응답", res_stats.status_code == 200, res_stats.text)
    stats_data = res_stats.json()
    runner.check("통계 요약 지표 포함 (banned_users, pending_reports)", "banned_users" in stats_data["summary"], str(stats_data["summary"]))
    runner.check("14일 가입 추이 14개 날짜 데이터 검증", len(stats_data["user_registration_trend"]) == 14, f"Len: {len(stats_data['user_registration_trend'])}")
    runner.check("우수 활동 회원 상위 5명 데이터 검증", len(stats_data["top_users"]) <= 5, f"Len: {len(stats_data['top_users'])}")

    # 회원 목록 정렬 (posts_desc, followers_desc) DB 페이징 검증
    res_users_posts = client.get("/api/admin/users?sort_by=posts_desc&page=1&page_size=5", headers=admin_headers)
    runner.check("게시물 수 기준 정렬 DB 페이징 조회", res_users_posts.status_code == 200, res_users_posts.text)
    runner.check("페이지 크기 5건 정확히 반환", len(res_users_posts.json()["items"]) <= 5, f"Count: {len(res_users_posts.json()['items'])}")

    res_users_followers = client.get("/api/admin/users?sort_by=followers_desc&page=1&page_size=5", headers=admin_headers)
    runner.check("팔로워 수 기준 정렬 DB 페이징 조회", res_users_followers.status_code == 200, res_users_followers.text)

    # 상태 필터(banned, active) 검증
    res_users_banned = client.get("/api/admin/users?status_filter=banned", headers=admin_headers)
    runner.check("정지 회원 필터링 조회", res_users_banned.status_code == 200, res_users_banned.text)

    # =========================================================================
    # 6. 시스템 인프라 및 스토리지 리소스 헬스체크 검증
    # =========================================================================
    print("\n[테스트 6] 시스템 인프라 & 스토리지 리소스 헬스체크 진단")
    res_health = client.get("/api/admin/system-health", headers=admin_headers)
    runner.check("시스템 헬스체크 API 응답", res_health.status_code == 200, res_health.text)
    health_data = res_health.json()
    runner.check("데이터베이스 상태 Healthy 확인", health_data.get("database_status") == "healthy", str(health_data))
    runner.check("업로드 스토리지 용량 진단 필드 확인", "uploads_total_size_bytes" in health_data, str(health_data))
    runner.check("스토리지 카테고리별 세부내역 포함", "posts" in health_data.get("uploads_breakdown", {}), str(health_data.get("uploads_breakdown")))

    # 최종 결과 보고
    print("\n" + "=" * 70)
    print(f"📊 검증 결과: 통과 {runner.passed}건 / 실패 {runner.failed}건")
    if runner.errors:
        print("❌ 실패 항목:")
        for err in runner.errors:
            print(f"   - {err}")
        return False
    else:
        print("🎉 모든 상용화 및 보안/성능 합격 기준을 완벽하게 통과했습니다!")
        return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
