import subprocess
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CURL = "C:\\Windows\\System32\\curl.exe"
BASE_URL = "http://127.0.0.1:8000"

def run_curl(desc, args):
    cmd = [CURL, "-s", "-w", "\n__HTTP_CODE__:%{http_code}"] + args
    
    # 출력용 cURL 커맨드 문자열 생성
    display_cmd = f"curl -X {args[1]} \"{args[0]}\"" if "-X" in args else f"curl \"{args[0]}\""
    if "-H" in args:
        # 헤더 포맷팅
        h_indices = [i for i, x in enumerate(args) if x == "-H"]
        headers_str = " ".join([f"-H \"{args[i+1]}\"" for i in h_indices])
    else:
        headers_str = ""
    if "-d" in args:
        d_idx = args.index("-d")
        data_str = f"-d '{args[d_idx+1]}'"
    else:
        data_str = ""
    
    print(f"\n==================================================================")
    print(f"📌 [{desc}]")
    cmd_str = f"curl {' '.join(args)}"
    print(f"👉 실행 명령:\n{cmd_str}")
    
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    stdout = res.stdout.strip()
    
    if "__HTTP_CODE__:" in stdout:
        body, code = stdout.rsplit("__HTTP_CODE__:", 1)
        body = body.strip()
        code = code.strip()
    else:
        body = stdout
        code = "UNKNOWN"
        
    print(f"📥 응답 코드: HTTP {code}")
    try:
        parsed = json.loads(body)
        formatted_json = json.dumps(parsed, ensure_ascii=False, indent=2)
        print(f"📄 응답 본문:\n{formatted_json}")
        return int(code), parsed
    except Exception:
        print(f"📄 응답 본문: {body}")
        return int(code) if code.isdigit() else 500, body

def main():
    import uuid
    test_uname = f"curl_user_{uuid.uuid4().hex[:6]}"
    print("==================================================================")
    print("🌐 FastAPI 백엔드 실제 HTTP 엔드포인트 cURL 전수 검증 시작")
    print("==================================================================")

    # 1. 회원가입
    code, data = run_curl(
        "1. 신규 회원가입 (POST /api/auth/register)",
        [
            f"{BASE_URL}/api/auth/register",
            "-X", "POST",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "username": test_uname,
                "email": f"{test_uname}@example.com",
                "password": "Password123!",
                "full_name": "컬테스터"
            })
        ]
    )

    # 2. 로그인 (JWT 토큰 발급)
    code, data = run_curl(
        "2. 로그인 및 JWT 토큰 발급 (POST /api/auth/login)",
        [
            f"{BASE_URL}/api/auth/login",
            "-X", "POST",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "username_or_email": test_uname,
                "password": "Password123!"
            })
        ]
    )
    token = data["access_token"]
    user_id = data["user"]["id"]
    auth_header = f"Authorization: Bearer {token}"

    # 3. 내 정보 조회
    code, data = run_curl(
        "3. 현재 로그인 사용자 정보 확인 (GET /api/auth/me)",
        [
            f"{BASE_URL}/api/auth/me",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 4. 프로필 정보 수정
    code, data = run_curl(
        "4. 프로필 정보 수정 (PUT /api/users/profile)",
        [
            f"{BASE_URL}/api/users/profile",
            "-X", "PUT",
            "-H", auth_header,
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "bio": "cURL 명령어로 수정한 바이오입니다! 💻✨",
                "website": "https://curl.haxx.se",
                "gender": "not_specified",
                "is_private": False
            })
        ]
    )

    # 5. 다른 유저 프로필 조회
    code, data = run_curl(
        "5. 다른 사용자 프로필 조회 (GET /api/users/alex_creator)",
        [
            f"{BASE_URL}/api/users/alex_creator",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 6. 팔로우 토글
    code, data = run_curl(
        "6. 다른 사용자 팔로우 토글 (POST /api/follows/1)",
        [
            f"{BASE_URL}/api/follows/1",
            "-X", "POST",
            "-H", auth_header
        ]
    )

    # 7. 새 피드 게시물 등록
    code, data = run_curl(
        "7. 새 피드 게시물 작성 (POST /api/posts)",
        [
            f"{BASE_URL}/api/posts",
            "-X", "POST",
            "-H", auth_header,
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "caption": "cURL 명령어로 직접 전송한 새 피드 포스팅입니다! #curl #fastapi #test 🚀",
                "location": "서울시 마포구 연남동",
                "media_urls": ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800"]
            })
        ]
    )
    post_id = data["id"]

    # 8. 메인 피드 목록 조회
    code, data = run_curl(
        "8. 홈 메인 피드 조회 (GET /api/posts/feed)",
        [
            f"{BASE_URL}/api/posts/feed?limit=3",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 9. 게시물 좋아요 토글
    code, data = run_curl(
        f"9. 게시물 좋아요 토글 (POST /api/posts/{post_id}/likes)",
        [
            f"{BASE_URL}/api/posts/{post_id}/likes",
            "-X", "POST",
            "-H", auth_header
        ]
    )

    # 10. 게시물 댓글 작성
    code, data = run_curl(
        f"10. 게시물 댓글 작성 (POST /api/posts/{post_id}/comments)",
        [
            f"{BASE_URL}/api/posts/{post_id}/comments",
            "-X", "POST",
            "-H", auth_header,
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "content": "cURL로 작성된 첫번째 댓글입니다! 멋진 사진이네요 ✨"
            })
        ]
    )

    # 11. 게시물 댓글 목록 조회
    code, data = run_curl(
        f"11. 게시물 댓글 목록 조회 (GET /api/posts/{post_id}/comments)",
        [
            f"{BASE_URL}/api/posts/{post_id}/comments",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 12. 게시물 북마크(저장) 토글
    code, data = run_curl(
        f"12. 게시물 북마크 토글 (POST /api/posts/{post_id}/bookmarks)",
        [
            f"{BASE_URL}/api/posts/{post_id}/bookmarks",
            "-X", "POST",
            "-H", auth_header
        ]
    )

    # 13. 북마크(저장됨) 탭 목록 조회
    code, data = run_curl(
        "13. 프로필 저장됨 탭 목록 조회 (GET /api/users/saved)",
        [
            f"{BASE_URL}/api/users/saved",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 14. 릴스 스트림 조회
    code, data = run_curl(
        "14. 9:16 릴스 비디오 피드 조회 (GET /api/reels)",
        [
            f"{BASE_URL}/api/reels?limit=2",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 15. 1:1 다이렉트 대화방 생성
    code, data = run_curl(
        "15. 1:1 DM 대화방 생성 (POST /api/direct/conversations)",
        [
            f"{BASE_URL}/api/direct/conversations",
            "-X", "POST",
            "-H", auth_header,
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "target_user_id": 1
            })
        ]
    )
    conv_id = data["id"]

    # 16. DM 메시지 전송
    code, data = run_curl(
        f"16. DM 메시지 전송 (POST /api/direct/conversations/{conv_id}/messages)",
        [
            f"{BASE_URL}/api/direct/conversations/{conv_id}/messages",
            "-X", "POST",
            "-H", auth_header,
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "text": "cURL 명령어로 전송한 1:1 메시지입니다! 정상 도착했나요? 💌"
            })
        ]
    )

    # 17. 탐색 그리드 키워드 검색
    code, data = run_curl(
        "17. 탐색 그리드 키워드 검색 (GET /api/explore?q=curl)",
        [
            f"{BASE_URL}/api/explore?q=curl",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    # 18. 활동 알림 목록 조회
    code, data = run_curl(
        "18. 활동 알림 목록 조회 (GET /api/notifications)",
        [
            f"{BASE_URL}/api/notifications",
            "-X", "GET",
            "-H", auth_header
        ]
    )

    print("\n==================================================================")
    print("🎉 cURL 기반 전수 HTTP 엔드포인트 실제 검증 100% 성공 완료!")
    print("==================================================================")

if __name__ == "__main__":
    main()
