from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.models.like import Like
from app.models.notification import Notification
from app.schemas.comment import CommentResponse, CommentReplyResponse, CommentCreate
from app.core.deps import get_current_user, get_optional_current_user

router = APIRouter(tags=["Comments"])

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    # 1. 최상위 댓글 목록 조회 (parent_id가 NULL)
    root_comments = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.parent_id.is_(None)
    ).order_by(Comment.created_at.asc()).all()

    # 2. 해당 게시물의 모든 대댓글 조회
    replies_all = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.parent_id.isnot(None)
    ).order_by(Comment.created_at.asc()).all()

    # parent_id 별 대댓글 매핑
    replies_map = {}
    for r in replies_all:
        if r.parent_id not in replies_map:
            replies_map[r.parent_id] = []
        is_liked = False
        if current_user:
            is_liked = any(like.user_id == current_user.id for like in r.likes)
        replies_map[r.parent_id].append(
            CommentReplyResponse(
                id=r.id,
                post_id=r.post_id,
                reel_id=r.reel_id,
                parent_id=r.parent_id,
                content=r.content,
                created_at=r.created_at,
                author=r.author,
                likes_count=len(r.likes),
                is_liked=is_liked
            )
        )

    results = []
    for c in root_comments:
        is_liked = False
        if current_user:
            is_liked = any(like.user_id == current_user.id for like in c.likes)
        
        c_replies = replies_map.get(c.id, [])
        results.append(
            CommentResponse(
                id=c.id,
                post_id=c.post_id,
                reel_id=c.reel_id,
                parent_id=c.parent_id,
                content=c.content,
                created_at=c.created_at,
                author=c.author,
                likes_count=len(c.likes),
                is_liked=is_liked,
                replies=c_replies,
                replies_count=len(c_replies)
            )
        )
    return results

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")

    parent_comment = None
    if comment_in.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_in.parent_id,
            Comment.post_id == post_id
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="부모 댓글을 찾을 수 없습니다.")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_in.content,
        parent_id=comment_in.parent_id
    )
    db.add(comment)

    # 상대방 게시물 또는 부모 댓글 작성자에게 알림 생성
    recipient_id = parent_comment.user_id if parent_comment else post.user_id
    if recipient_id != current_user.id:
        notif = Notification(
            recipient_id=recipient_id,
            sender_id=current_user.id,
            type="comment",
            target_id=post_id
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        reel_id=comment.reel_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at,
        author=current_user,
        likes_count=0,
        is_liked=False,
        replies=[],
        replies_count=0
    )

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    # 댓글 작성자 또는 게시물/릴스 소유자만 삭제 가능
    is_owner = (comment.user_id == current_user.id)
    if not is_owner and comment.post and comment.post.user_id == current_user.id:
        is_owner = True
    if not is_owner and comment.reel and comment.reel.user_id == current_user.id:
        is_owner = True

    if not is_owner:
        raise HTTPException(status_code=403, detail="댓글 작성자 또는 게시물 작성자만 삭제할 수 있습니다.")
    
    db.delete(comment)
    db.commit()
    return {"message": "댓글이 삭제되었습니다."}

@router.post("/comments/{comment_id}/likes")
def toggle_comment_like(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

    existing_like = db.query(Like).filter(Like.comment_id == comment_id, Like.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        db.refresh(comment)
        return {"liked": False, "likes_count": len(comment.likes)}
    else:
        new_like = Like(comment_id=comment_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        db.refresh(comment)
        return {"liked": True, "likes_count": len(comment.likes)}
