"""
대댓글(답글 달기) 기능 통합 검증 테스트 스크립트
1. 게시물에 최상위 댓글 작성
2. 해당 댓글에 대댓글 작성 (parent_id 지정)
3. 댓글 목록 조회 시 최상위 댓글 아래 replies 리스트로 대댓글이 정상 포함되는지 검증
4. 대댓글 좋아요 토글 검증
5. 릴스 댓글 및 대댓글 작성/조회 검증
6. 부모 댓글 삭제 시 자식 대댓글도 정상 삭제되는지 확인
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
from app.models.reel import Reel
from app.models.comment import Comment
from app.core.security import create_access_token

client = TestClient(app)

def test_replies():
    print("=================================================================")
    print("🚀 [TEST] 대댓글(답글 달기) E2E 통합 검증 시작")
    print("=================================================================")

    db = SessionLocal()
    try:
        # 1. 테스트 사용자 조회 및 토큰 발급 (alex_creator)
        user = db.query(User).filter(User.username == "alex_creator").first()
        assert user is not None, "alex_creator 유저를 찾을 수 없습니다."
        token = create_access_token(subject=str(user.id))
        headers = {"Authorization": f"Bearer {token}"}

        # 2. 테스트용 게시물 조회
        post = db.query(Post).first()
        assert post is not None, "테스트용 게시물이 없습니다."
        print(f"[*] 테스트 대상 게시물 ID: {post.id}")

        # 3. 최상위 부모 댓글 작성 (POST /api/posts/{post_id}/comments)
        parent_content = "부모 댓글 테스트입니다! #parent"
        res_parent = client.post(
            f"/api/posts/{post.id}/comments",
            json={"content": parent_content},
            headers=headers
        )
        assert res_parent.status_code == 200, f"부모 댓글 작성 실패: {res_parent.text}"
        parent_data = res_parent.json()
        parent_id = parent_data["id"]
        assert parent_data["parent_id"] is None
        print(f"[+] 1. 부모 댓글 생성 성공: ID {parent_id}, 내용: '{parent_content}'")

        # 4. 자식 대댓글 작성 (POST /api/posts/{post_id}/comments with parent_id)
        reply_content = "@alex_creator 첫 번째 대댓글(답글)입니다! #reply1"
        res_reply = client.post(
            f"/api/posts/{post.id}/comments",
            json={"content": reply_content, "parent_id": parent_id},
            headers=headers
        )
        assert res_reply.status_code == 200, f"대댓글 작성 실패: {res_reply.text}"
        reply_data = res_reply.json()
        reply_id = reply_data["id"]
        assert reply_data["parent_id"] == parent_id
        print(f"[+] 2. 자식 대댓글 생성 성공: ID {reply_id}, parent_id: {reply_data['parent_id']}")

        # 5. 두 번째 대댓글 작성
        reply_content_2 = "@alex_creator 두 번째 대댓글(답글)입니다! #reply2"
        res_reply_2 = client.post(
            f"/api/posts/{post.id}/comments",
            json={"content": reply_content_2, "parent_id": parent_id},
            headers=headers
        )
        assert res_reply_2.status_code == 200
        reply_2_data = res_reply_2.json()
        reply_2_id = reply_2_data["id"]
        print(f"[+] 3. 두 번째 대댓글 생성 성공: ID {reply_2_id}")

        # 6. 댓글 목록 조회 (GET /api/posts/{post_id}/comments) -> 계층 구조 검증
        res_comments = client.get(f"/api/posts/{post.id}/comments", headers=headers)
        assert res_comments.status_code == 200
        comments_list = res_comments.json()

        # 부모 댓글 찾기
        target_parent = next((c for c in comments_list if c["id"] == parent_id), None)
        assert target_parent is not None, "부모 댓글이 목록에 존재해야 합니다."
        assert "replies" in target_parent, "부모 댓글에 replies 필드가 존재해야 합니다."
        assert target_parent["replies_count"] == 2, f"대댓글 개수는 2개여야 합니다. (실제: {target_parent['replies_count']})"
        assert len(target_parent["replies"]) == 2, "replies 목록 길이가 2여야 합니다."

        reply_ids = [r["id"] for r in target_parent["replies"]]
        assert reply_id in reply_ids and reply_2_id in reply_ids, "생성된 두 대댓글이 모두 포함되어야 합니다."
        print(f"[+] 4. 계층형 댓글 조회 검증 성공: 부모(ID {parent_id}) 아래 대댓글 2개 정상 반환!")

        # 7. 대댓글 좋아요 토글 (POST /api/comments/{reply_id}/likes)
        res_like = client.post(f"/api/comments/{reply_id}/likes", headers=headers)
        assert res_like.status_code == 200
        like_data = res_like.json()
        assert like_data["liked"] is True
        assert like_data["likes_count"] == 1
        print(f"[+] 5. 대댓글 좋아요 토글 성공: {like_data}")

        # 8. 릴스 대댓글 검증
        reel = db.query(Reel).first()
        if reel:
            print(f"[*] 릴스 대댓글 테스트 (Reel ID: {reel.id})")
            res_r_parent = client.post(
                f"/api/reels/{reel.id}/comments",
                json={"content": "릴스 부모 댓글입니다."},
                headers=headers
            )
            assert res_r_parent.status_code == 200
            r_parent_id = res_r_parent.json()["id"]

            res_r_reply = client.post(
                f"/api/reels/{reel.id}/comments",
                json={"content": "릴스 대댓글입니다!", "parent_id": r_parent_id},
                headers=headers
            )
            assert res_r_reply.status_code == 200
            assert res_r_reply.json()["parent_id"] == r_parent_id

            res_r_get = client.get(f"/api/reels/{reel.id}/comments", headers=headers)
            assert res_r_get.status_code == 200
            r_comments = res_r_get.json()
            r_target = next((c for c in r_comments if c["id"] == r_parent_id), None)
            assert r_target is not None
            assert len(r_target["replies"]) >= 1
            print(f"[+] 6. 릴스 대댓글 작성 및 계층 조회 성공!")

            # 정리
            client.delete(f"/api/comments/{r_parent_id}", headers=headers)

        # 9. 부모 댓글 삭제 시 대댓글 CASCADE 삭제 검증
        res_del = client.delete(f"/api/comments/{parent_id}", headers=headers)
        assert res_del.status_code == 200
        print(f"[+] 7. 부모 댓글 삭제 성공: ID {parent_id}")

        # 대댓글이 DB에서 함께 삭제되었는지 확인
        deleted_reply = db.query(Comment).filter(Comment.id == reply_id).first()
        assert deleted_reply is None, "부모 댓글 삭제 시 자식 대댓글도 CASCADE 삭제되어야 합니다."
        print(f"[+] 8. 자식 대댓글 CASCADE 삭제 확인 완료!")

        print("\n=================================================================")
        print("🎉 대댓글(답글 달기) 모든 기능이 100% 정상 작동합니다!")
        print("=================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_replies()
