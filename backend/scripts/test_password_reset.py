import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)

    print("==================================================")
    print("비밀번호 찾기 / 재설정 (Password Reset) 종합 검증")
    print("==================================================")

    # 1. 존재하지 않는 사용자로 재설정 요청 시 404 확인
    print("\n[시나리오 1] 존재하지 않는 계정으로 요청 시 404 반환 검증")
    r1 = client.post(
        "/api/auth/password/reset-request",
        json={"username_or_email": "non_existent_user_99999"}
    )
    print(f"  응답: status={r1.status_code}, body={r1.text}")
    assert r1.status_code == 404, f"시나리오 1 실패: {r1.text}"
    print("  -> PASS: 404 Not Found 정상 반환")

    # 2. 유효한 사용자 이름(alex_creator)으로 재설정 요청
    print("\n[시나리오 2] 유효한 계정(alex_creator)으로 인증코드 요청")
    r2 = client.post(
        "/api/auth/password/reset-request",
        json={"username_or_email": "alex_creator"}
    )
    print(f"  응답: status={r2.status_code}, body={r2.text}")
    assert r2.status_code == 200, f"시나리오 2 실패: {r2.text}"
    data2 = r2.json()
    assert "dev_code" in data2, "dev_code 필드 부재"
    assert len(data2["dev_code"]) == 6, f"코드 길이 불일치: {data2['dev_code']}"
    assert "masked_email" in data2, "masked_email 필드 부재"
    code = data2["dev_code"]
    print(f"  -> PASS: 6자리 인증코드 발급 성공 (code={code}, email={data2['masked_email']})")

    # 3. 유효한 이메일(alex@example.com)으로도 재설정 요청 가능 검증
    print("\n[시나리오 3] 이메일(alex@example.com)로 재설정 요청")
    r3 = client.post(
        "/api/auth/password/reset-request",
        json={"username_or_email": "alex@example.com"}
    )
    assert r3.status_code == 200, f"시나리오 3 실패: {r3.text}"
    data3 = r3.json()
    code = data3["dev_code"]
    print(f"  -> PASS: 이메일로도 정상 발급 성공 (code={code})")

    # 4. 잘못된 인증코드 입력 시 400 반환 검증
    print("\n[시나리오 4] 잘못된 인증코드 입력 시 400 차단 검증")
    r4 = client.post(
        "/api/auth/password/reset-confirm",
        json={
            "username_or_email": "alex_creator",
            "code": "999999",
            "new_password": "newPassword123!"
        }
    )
    print(f"  응답: status={r4.status_code}, body={r4.text}")
    assert r4.status_code == 400, f"시나리오 4 실패: {r4.text}"
    print("  -> PASS: 잘못된 인증코드 400 차단 성공")

    # 5. 새 비밀번호 6자 미만 검증
    print("\n[시나리오 5] 새 비밀번호 6자 미만 시 400 차단 검증")
    r5 = client.post(
        "/api/auth/password/reset-confirm",
        json={
            "username_or_email": "alex_creator",
            "code": code,
            "new_password": "123"
        }
    )
    assert r5.status_code == 400, f"시나리오 5 실패: {r5.text}"
    print("  -> PASS: 6자 미만 비밀번호 400 차단 성공")

    # 6. 올바른 인증코드로 새 비밀번호(ResetPass123!) 변경 성공 검증
    print("\n[시나리오 6] 올바른 인증코드로 새 비밀번호 변경")
    r6 = client.post(
        "/api/auth/password/reset-confirm",
        json={
            "username_or_email": "alex_creator",
            "code": code,
            "new_password": "ResetPass123!"
        }
    )
    print(f"  응답: status={r6.status_code}, body={r6.text}")
    assert r6.status_code == 200, f"시나리오 6 실패: {r6.text}"
    print("  -> PASS: 비밀번호 성공적 재설정 완료")

    # 7. 변경된 새 비밀번호로 실제 로그인 검증
    print("\n[시나리오 7] 변경된 비밀번호로 로그인 검증")
    r7 = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "ResetPass123!"}
    )
    assert r7.status_code == 200, f"새 비밀번호 로그인 실패: {r7.text}"
    print("  -> PASS: 새 비밀번호(ResetPass123!)로 정상 로그인 성공!")

    # 8. 이미 사용된 인증코드 재사용 시 차단 검증
    print("\n[시나리오 8] 사용된 인증코드 재사용 차단 검증")
    r8 = client.post(
        "/api/auth/password/reset-confirm",
        json={
            "username_or_email": "alex_creator",
            "code": code,
            "new_password": "AnotherPassword123!"
        }
    )
    assert r8.status_code == 400, f"시나리오 8 실패: {r8.text}"
    print("  -> PASS: 이미 사용된 코드 400 차단 성공")

    # 9. 원래 비밀번호(aaaa1234)로 재설정하여 테스트 환경 원복
    print("\n[시나리오 9] 기존 기본 비밀번호(aaaa1234)로 원복 및 로그인 검증")
    # 새 인증코드 발급
    req_res = client.post(
        "/api/auth/password/reset-request",
        json={"username_or_email": "alex_creator"}
    )
    restore_code = req_res.json()["dev_code"]
    conf_res = client.post(
        "/api/auth/password/reset-confirm",
        json={
            "username_or_email": "alex_creator",
            "code": restore_code,
            "new_password": "aaaa1234"
        }
    )
    assert conf_res.status_code == 200, f"원복 실패: {conf_res.text}"
    # 원래 비밀번호로 로그인 확인
    final_login = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "aaaa1234"}
    )
    assert final_login.status_code == 200, f"최종 로그인 확인 실패: {final_login.text}"
    print("  -> PASS: 원래 비밀번호(aaaa1234)로 성공적 원복 및 로그인 확인 완료")

    print("\n==================================================")
    print("비밀번호 찾기/재설정 모든 시나리오(9/9) 테스트 100% 통과!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
