from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.story import Story, StoryView
from app.models.user import User
from app.schemas.story import UserStoryTrayItem, StoryItemResponse
from app.schemas.user import UserSimple
from app.core.deps import get_current_user, get_optional_current_user

router = APIRouter(tags=["Stories"])

@router.get("/stories/feed", response_model=List[UserStoryTrayItem])
def get_stories_tray(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    now = datetime.utcnow()
    # 24시간 내 활성 스토리 목록 조회
    active_stories = db.query(Story).filter(Story.expires_at > now).order_by(Story.created_at.desc()).all()

    # 유저별 그룹화
    user_stories_map = {}
    for s in active_stories:
        if s.user_id not in user_stories_map:
            user_stories_map[s.user_id] = {
                "user": s.user,
                "stories": [],
                "latest_time": s.created_at
            }
        is_viewed = False
        if current_user:
            is_viewed = any(v.user_id == current_user.id for v in s.views)
        user_stories_map[s.user_id]["stories"].append(
            StoryItemResponse(
                id=s.id,
                media_url=s.media_url,
                media_type=s.media_type,
                expires_at=s.expires_at,
                created_at=s.created_at,
                is_viewed=is_viewed
            )
        )

    tray_items = []
    for uid, data in user_stories_map.items():
        has_unseen = any(not st.is_viewed for st in data["stories"])
        tray_items.append(
            UserStoryTrayItem(
                user=UserSimple.from_orm(data["user"]),
                has_unseen=has_unseen,
                stories_count=len(data["stories"]),
                latest_story_time=data["latest_time"],
                stories=data["stories"]
            )
        )
    return tray_items

@router.post("/stories")
def create_story(
    media_url: str,
    media_type: str = "image",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expires = datetime.utcnow() + timedelta(hours=24)
    story = Story(
        user_id=current_user.id,
        media_url=media_url,
        media_type=media_type,
        expires_at=expires
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return {"message": "스토리가 성공적으로 등록되었습니다.", "id": story.id}

@router.post("/stories/{story_id}/view")
def view_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="스토리를 찾을 수 없습니다.")

    existing_view = db.query(StoryView).filter(
        StoryView.story_id == story_id,
        StoryView.user_id == current_user.id
    ).first()

    if not existing_view:
        view = StoryView(story_id=story_id, user_id=current_user.id)
        db.add(view)
        db.commit()

    return {"message": "스토리 시청이 기록되었습니다."}

@router.get("/users/{username}/highlights")
def get_user_highlights(
    username: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # 스토리 기반 하이라이트 목록 (예: 최근 만료된 스토리들로 그룹화)
    stories = db.query(Story).filter(Story.user_id == user.id).order_by(Story.created_at.desc()).limit(10).all()
    highlights = []
    if stories:
        highlights.append({
            "id": 1,
            "title": "일상 ✨",
            "cover_image": stories[0].media_url,
            "stories_count": len(stories)
        })
    return highlights
