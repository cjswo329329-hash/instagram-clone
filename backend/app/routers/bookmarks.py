from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.bookmark import Bookmark
from app.models.post import Post
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

@router.post("/{post_id}")
def toggle_bookmark(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")

    existing = db.query(Bookmark).filter(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    else:
        bm = Bookmark(post_id=post_id, user_id=current_user.id)
        db.add(bm)
        db.commit()
        return {"bookmarked": True}
