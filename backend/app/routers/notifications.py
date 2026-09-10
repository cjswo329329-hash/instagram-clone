from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.models.follow import Follow
from app.schemas.notification import NotificationResponse
from app.schemas.user import UserSimple
from app.core.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def format_notification_preview(notif: Notification) -> str:
    sender_name = notif.sender.username if notif.sender else "누군가"
    if notif.type == "like_post":
        return f"{sender_name}님이 회원님의 게시물을 좋아합니다."
    elif notif.type == "like_reel":
        return f"{sender_name}님이 회원님의 릴스를 좋아합니다."
    elif notif.type == "comment":
        return f"{sender_name}님이 회원님의 게시물에 댓글을 남겼습니다."
    elif notif.type == "follow":
        return f"{sender_name}님이 회원님을 팔로우하기 시작했습니다."
    elif notif.type == "follow_request":
        return f"{sender_name}님이 회원님에게 팔로우를 요청했습니다."
    elif notif.type == "follow_accept":
        return f"{sender_name}님이 회원님의 팔로우 요청을 수락했습니다."
    return f"{sender_name}님의 새로운 알림이 있습니다."

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    # 내가 팔로우하고 있는 사람 목록
    my_following_ids = {
        f[0] for f in db.query(Follow.following_id).filter(
            Follow.follower_id == current_user.id,
            Follow.status == "accepted"
        ).all()
    }

    # 나에게 온 팔로우 요청 상태 파악
    pending_sender_ids = {
        f.follower_id for f in db.query(Follow.follower_id).filter(
            Follow.following_id == current_user.id,
            Follow.status == "pending"
        ).all()
    }
    accepted_sender_ids = {
        f.follower_id for f in db.query(Follow.follower_id).filter(
            Follow.following_id == current_user.id,
            Follow.status == "accepted"
        ).all()
    }

    results = []
    for n in notifs:
        follow_req_status = None
        if n.type == "follow_request":
            if n.sender_id in pending_sender_ids:
                follow_req_status = "pending"
            elif n.sender_id in accepted_sender_ids:
                follow_req_status = "accepted"
            else:
                follow_req_status = "rejected"

        sender_simple = UserSimple(
            id=n.sender.id,
            username=n.sender.username,
            full_name=n.sender.full_name,
            profile_image_url=n.sender.profile_image_url,
            is_verified=n.sender.is_verified,
            is_admin=n.sender.is_admin,
            is_following=(n.sender_id in my_following_ids)
        ) if n.sender else None

        results.append(
            NotificationResponse(
                id=n.id,
                recipient_id=n.recipient_id,
                sender_id=n.sender_id,
                sender=sender_simple,
                type=n.type,
                target_id=n.target_id,
                is_read=n.is_read,
                created_at=n.created_at,
                text_preview=format_notification_preview(n),
                follow_request_status=follow_req_status
            )
        )
    return results

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    if notif.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    notif.is_read = True
    db.commit()
    return {"message": "알림을 읽음 처리했습니다."}

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})

    db.commit()
    return {"message": "모든 알림을 읽음 처리했습니다."}
