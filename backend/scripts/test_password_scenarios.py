import os
import sys

# Set console encoding to UTF-8
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
    print("비밀번호 변경 로직 시나리오 종합 검증 테스트")
    print("==================================================")

    # 1. 초기 로그인 (alex_creator / aaaa1234)
    login_res = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "aaaa1234"}
    )
    assert login_res.status_code == 200, f"초기 로그인 실패: {login_res.text}"
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[성공] 0. 초기 로그인 성공 (alex_creator)")

    # 시나리오 1: 프론트엔드 포맷 (current_password 필드) 변경 테스트
    print("\n[시나리오 1] 프론트엔드 포맷 (current_password) 비밀번호 변경")
    r1 = client.put(
        "/api/auth/password",
        json={"current_password": "aaaa1234", "new_password": "tempPassword99!"},
        headers=auth_headers
    )
    print(f"  응답: status={r1.status_code}, body={r1.text}")
    assert r1.status_code == 200, f"시나리오 1 실패: {r1.text}"
    print("  -> PASS: current_password 필드로 200 정상 변경 성공")

    # 시나리오 2: 변경된 새 비밀번호로 로그인 검증
    print("\n[시나리오 2] 변경된 비밀번호(tempPassword99!)로 로그인 검증")
    r2 = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "tempPassword99!"}
    )
    print(f"  응답: status={r2.status_code}")
    assert r2.status_code == 200, f"시나리오 2 실패: {r2.text}"
    token2 = r2.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token2}"}
    print("  -> PASS: 변경된 비밀번호로 정상 로그인 성공")

    # 시나리오 3: 백엔드 표준 포맷 (old_password 필드) 변경 테스트
    print("\n[시나리오 3] 백엔드 표준 포맷 (old_password) 비밀번호 변경")
    r3 = client.put(
        "/api/auth/password",
        json={"old_password": "tempPassword99!", "new_password": "tempPassword88@"},
        headers=auth_headers
    )
    print(f"  응답: status={r3.status_code}, body={r3.text}")
    assert r3.status_code == 200, f"시나리오 3 실패: {r3.text}"
    print("  -> PASS: old_password 필드로 200 정상 변경 성공")

    # 토큰 갱신을 위해 새 비밀번호로 재로그인
    r_relogin = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "tempPassword88@"}
    )
    auth_headers = {"Authorization": f"Bearer {r_relogin.json()['access_token']}"}

    # 시나리오 4: 이전 비밀번호 불일치 에러 검증
    print("\n[시나리오 4] 잘못된 이전 비밀번호 입력 시 차단 검증")
    r4 = client.put(
        "/api/auth/password",
        json={"current_password": "wrongOldPassword123", "new_password": "someNewPassword1!"},
        headers=auth_headers
    )
    print(f"  응답: status={r4.status_code}, body={r4.text}")
    assert r4.status_code == 400, f"시나리오 4 실패: 예상 status=400, 실제 status={r4.status_code}"
    assert "일치하지 않습니다" in r4.text, f"예상 에러 문구 불일치: {r4.text}"
    print("  -> PASS: 잘못된 이전 비밀번호 시 400 Bad Request 정확히 반환")

    # 시나리오 5: 새 비밀번호가 이전 비밀번호와 동일한 경우 차단 검증
    print("\n[시나리오 5] 새 비밀번호가 이전 비밀번호와 동일한 경우 차단 검증")
    r5 = client.put(
        "/api/auth/password",
        json={"current_password": "tempPassword88@", "new_password": "tempPassword88@"},
        headers=auth_headers
    )
    print(f"  응답: status={r5.status_code}, body={r5.text}")
    assert r5.status_code == 400, f"시나리오 5 실패: 예상 status=400, 실제 status={r5.status_code}"
    assert "달라야 합니다" in r5.text, f"예상 에러 문구 불일치: {r5.text}"
    print("  -> PASS: 동일 비밀번호 입력 시 400 Bad Request 정확히 차단")

    # 시나리오 6: 새 비밀번호 6자 미만 검증
    print("\n[시나리오 6] 새 비밀번호가 6자 미만인 경우 차단 검증")
    r6 = client.put(
        "/api/auth/password",
        json={"current_password": "tempPassword88@", "new_password": "123"},
        headers=auth_headers
    )
    print(f"  응답: status={r6.status_code}, body={r6.text}")
    assert r6.status_code == 400, f"시나리오 6 실패: 예상 status=400, 실제 status={r6.status_code}"
    print("  -> PASS: 6자 미만 비밀번호 400 차단 성공")

    # 시나리오 7: 공백만 포함된 새 비밀번호 검증
    print("\n[시나리오 7] 공백만 포함된 새 비밀번호 차단 검증")
    r7 = client.put(
        "/api/auth/password",
        json={"current_password": "tempPassword88@", "new_password": "      "},
        headers=auth_headers
    )
    print(f"  응답: status={r7.status_code}, body={r7.text}")
    assert r7.status_code == 400, f"시나리오 7 실패: 예상 status=400, 실제 status={r7.status_code}"
    print("  -> PASS: 공백 비밀번호 400 차단 성공")

    # 시나리오 8: 원래 비밀번호(aaaa1234)로 원복 및 최종 로그인 검증
    print("\n[시나리오 8] 원래 비밀번호(aaaa1234)로 원복 및 최종 검증")
    r8 = client.put(
        "/api/auth/password",
        json={"current_password": "tempPassword88@", "new_password": "aaaa1234"},
        headers=auth_headers
    )
    assert r8.status_code == 200, f"원복 실패: {r8.text}"
    
    # 최종 로그인 확인
    r_final = client.post(
        "/api/auth/login",
        json={"username": "alex_creator", "password": "aaaa1234"}
    )
    assert r_final.status_code == 200, f"최종 로그인 실패: {r_final.text}"
    print("  -> PASS: 원래 비밀번호(aaaa1234)로 원복 및 로그인 성공 완료")

    print("\n==================================================")
    print("모든 시나리오(8/8) 테스트가 100% 성공적으로 완료되었습니다!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
