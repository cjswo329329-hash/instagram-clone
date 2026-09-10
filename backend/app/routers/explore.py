from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.post import Post
from app.models.reel import Reel
from app.models.user import User
from app.schemas.explore import ExploreItemResponse
from app.schemas.user import UserSimple

router = APIRouter(prefix="/explore", tags=["Explore"])

@router.get("", response_model=List[ExploreItemResponse])
def get_explore(
    q: Optional[str] = Query(None, description="검색 키워드"),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    results: List[ExploreItemResponse] = []

    post_query = db.query(Post).join(User, Post.user_id == User.id).filter(User.is_private == False).order_by(Post.id.desc())
    reel_query = db.query(Reel).join(User, Reel.user_id == User.id).filter(User.is_private == False).order_by(Reel.id.desc())

    if q and q.strip():
        keyword = f"%{q.strip()}%"
        post_query = post_query.filter(or_(Post.caption.ilike(keyword), Post.location.ilike(keyword)))
        reel_query = reel_query.filter(or_(Reel.caption.ilike(keyword), Reel.tagged_user.ilike(keyword), Reel.audio_title.ilike(keyword)))

    posts = post_query.offset(offset).limit(limit).all()
    reels = reel_query.offset(offset).limit(limit).all()

    for p in posts:
        media_url = p.media[0].media_url if p.media else "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800"
        title = p.caption.split("\n")[0] if p.caption else None
        results.append(
            ExploreItemResponse(
                id=p.id,
                title=title,
                media_url=media_url,
                is_video=False,
                likes_count=len(p.likes),
                comments_count=len(p.comments),
                author=UserSimple.from_orm(p.author),
                caption=p.caption
            )
        )

    for r in reels:
        media_url = r.poster_url or r.video_url
        title = r.caption.split("\n")[0] if r.caption else r.audio_title
        results.append(
            ExploreItemResponse(
                id=r.id,
                title=title,
                media_url=media_url,
                is_video=True,
                likes_count=len(r.likes),
                comments_count=len(r.comments),
                author=UserSimple.from_orm(r.author),
                caption=r.caption
            )
        )

    # 포스트와 릴스를 적절히 섞어 limit 개수만큼 반환
    return results[:limit]
