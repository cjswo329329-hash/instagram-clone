import os
import sys
import platform
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, desc, asc, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_admin_user
from app.models.user import User
from app.models.post import Post, PostMedia
from app.models.reel import Reel
from app.models.comment import Comment
from app.models.like import Like
from app.models.follow import Follow
from app.models.notification import Notification
from app.models.direct import Conversation, Message
from app.models.audit_log import AdminAuditLog
from app.models.report import Report
from app.config import settings

from app.schemas.admin import (
    AdminStatsResponse,
    AdminSummaryStats,
    DateCount,
    TopUserItem,
    AdminUsersResponse,
    AdminUserItem,
    UserBanRequest,
    AdminPostsResponse,
    AdminPostItem,
    AdminPostAuthor,
    AdminReelsResponse,
    AdminReelItem,
    AdminReelAuthor,
    AdminAuditLogsResponse,
    AdminAuditLogItem,
    AdminReportsResponse,
    AdminReportItem,
    ReportActionRequest,
    SystemHealthResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin_user)])

START_TIME = time.time()

# -----------------------------------------------------------------------------
# 감사 로그 기록 유틸리티
# -----------------------------------------------------------------------------
def record_audit_log(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    target_identifier: Optional[str] = None,
    reason: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    try:
        log = AdminAuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_identifier=target_identifier,
            reason=reason,
            details=details,
            ip_address=ip_address,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to record admin audit log: {e}")

# -----------------------------------------------------------------------------
# 1. 어드민 통계 대시보드 (N+1 최적화 & 단일 DB 집계 쿼리)
# -----------------------------------------------------------------------------
@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    어드민 통계 대시보드 데이터 조회
    - 고성능 최적화: N+1 개별 루프 쿼리를 전면 제거하고 단일 SQL 집계 쿼리로 처리
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    fourteen_days_ago = today_start - timedelta(days=13)

    # 1. 요약 통계
    total_users = db.query(func.count(User.id)).scalar() or 0
    new_users_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_users_this_week = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    banned_users = db.query(func.count(User.id)).filter(User.is_banned == True).scalar() or 0

    total_posts = db.query(func.count(Post.id)).scalar() or 0
    new_posts_today = db.query(func.count(Post.id)).filter(Post.created_at >= today_start).scalar() or 0
    total_reels = db.query(func.count(Reel.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    total_likes = db.query(func.count(Like.id)).scalar() or 0
    pending_reports = db.query(func.count(Report.id)).filter(Report.status == "pending").scalar() or 0

    summary = AdminSummaryStats(
        total_users=total_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week,
        total_posts=total_posts,
        new_posts_today=new_posts_today,
        total_reels=total_reels,
        total_comments=total_comments,
        total_likes=total_likes,
        banned_users=banned_users,
        pending_reports=pending_reports,
    )

    # 2. 최근 14일 일별 가입 추이 및 게시물 작성 추이 (GROUP BY 단일 쿼리화)
    user_counts_raw = dict(
        db.query(
            func.strftime("%m-%d", User.created_at),
            func.count(User.id)
        )
        .filter(User.created_at >= fourteen_days_ago)
        .group_by(func.strftime("%m-%d", User.created_at))
        .all()
    )

    post_counts_raw = dict(
        db.query(
            func.strftime("%m-%d", Post.created_at),
            func.count(Post.id)
        )
        .filter(Post.created_at >= fourteen_days_ago)
        .group_by(func.strftime("%m-%d", Post.created_at))
        .all()
    )

    user_trend: List[DateCount] = []
    post_trend: List[DateCount] = []
    for i in range(13, -1, -1):
        target_day = today_start - timedelta(days=i)
        date_str = target_day.strftime("%m-%d")
        user_trend.append(DateCount(date=date_str, count=user_counts_raw.get(date_str, 0)))
        post_trend.append(DateCount(date=date_str, count=post_counts_raw.get(date_str, 0)))

    # 3. 우수 활동 회원 상위 5명 (DB 레벨 집계 및 LIMIT 5)
    top_posters = (
        db.query(
            User,
            func.count(Post.id).label("posts_count")
        )
        .outerjoin(Post, Post.user_id == User.id)
        .filter(User.is_admin == False)
        .group_by(User.id)
        .order_by(desc("posts_count"))
        .limit(5)
        .all()
    )

    top_user_ids = [u.id for u, _ in top_posters]
    followers_map = {}
    if top_user_ids:
        follower_counts = (
            db.query(Follow.following_id, func.count(Follow.id))
            .filter(Follow.following_id.in_(top_user_ids), Follow.status == "accepted")
            .group_by(Follow.following_id)
            .all()
        )
        followers_map = dict(follower_counts)

    top_users = [
        TopUserItem(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            profile_image_url=u.profile_image_url,
            posts_count=p_cnt,
            followers_count=followers_map.get(u.id, 0),
        )
        for u, p_cnt in top_posters
    ]

    return AdminStatsResponse(
        summary=summary,
        user_registration_trend=user_trend,
        post_creation_trend=post_trend,
        top_users=top_users
    )

# -----------------------------------------------------------------------------
# 2. 회원 관리 (DB 페이징 & 정렬 최적화, 정지/해제, 보안)
# -----------------------------------------------------------------------------
@router.get("/users", response_model=AdminUsersResponse)
def get_admin_users(
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    page_size: int = Query(15, ge=1, le=100, description="페이지당 건수"),
    q: Optional[str] = Query(None, max_length=100, description="검색어 (아이디, 이메일, 성명)"),
    status_filter: Optional[str] = Query(None, pattern="^(active|banned|admin)$", description="계정 상태 필터"),
    sort_by: str = Query("created_at_desc", pattern="^(created_at_desc|created_at_asc|posts_desc|followers_desc)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 관리 목록 조회 (DB 레벨 서브쿼리 조인 및 페이징 완벽 최적화)
    """
    # 1. 서브쿼리로 포스트 수, 팔로워 수, 팔로잉 수 계산
    posts_subq = (
        db.query(Post.user_id, func.count(Post.id).label("post_count"))
        .group_by(Post.user_id)
        .subquery()
    )
    followers_subq = (
        db.query(Follow.following_id, func.count(Follow.id).label("follower_count"))
        .filter(Follow.status == "accepted")
        .group_by(Follow.following_id)
        .subquery()
    )
    following_subq = (
        db.query(Follow.follower_id, func.count(Follow.id).label("following_count"))
        .filter(Follow.status == "accepted")
        .group_by(Follow.follower_id)
        .subquery()
    )

    query = db.query(
        User,
        func.coalesce(posts_subq.c.post_count, 0).label("posts_count"),
        func.coalesce(followers_subq.c.follower_count, 0).label("followers_count"),
        func.coalesce(following_subq.c.following_count, 0).label("following_count"),
    ).outerjoin(posts_subq, User.id == posts_subq.c.user_id) \
     .outerjoin(followers_subq, User.id == followers_subq.c.following_id) \
     .outerjoin(following_subq, User.id == following_subq.c.follower_id)

    # 검색 필터
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )

    # 상태 필터
    if status_filter == "banned":
        query = query.filter(User.is_banned == True)
    elif status_filter == "active":
        query = query.filter(User.is_banned == False)
    elif status_filter == "admin":
        query = query.filter(User.is_admin == True)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # DB 레벨 정렬
    if sort_by == "created_at_asc":
        query = query.order_by(asc(User.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(User.created_at))
    elif sort_by == "posts_desc":
        query = query.order_by(desc("posts_count"), desc(User.created_at))
    elif sort_by == "followers_desc":
        query = query.order_by(desc("followers_count"), desc(User.created_at))

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = [
        AdminUserItem(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            profile_image_url=u.profile_image_url,
            is_admin=u.is_admin,
            is_verified=u.is_verified,
            is_private=u.is_private,
            is_banned=u.is_banned,
            ban_reason=u.ban_reason,
            banned_at=u.banned_at,
            created_at=u.created_at,
            posts_count=p_cnt,
            followers_count=f_cnt,
            following_count=fg_cnt,
        )
        for u, p_cnt, f_cnt, fg_cnt in records
    ]

    return AdminUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    req: UserBanRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 계정 정지 (Suspension/Ban)
    - 본인 계정 및 타 관리자 계정 정지 방어
    - 감사 로그 영구 기록
    """
    if user_id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="관리자 본인 계정은 정지할 수 없습니다.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대상 회원을 찾을 수 없습니다.")

    if target_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 계정은 정지할 수 없습니다.")

    target_user.is_banned = True
    target_user.ban_reason = req.reason.strip()
    target_user.banned_at = datetime.now()
    db.commit()

    # 감사 로그 기록
    client_ip = request.client.host if request.client else None
    record_audit_log(
        db=db,
        admin_id=admin_user.id,
        action="USER_BAN",
        target_type="user",
        target_id=target_user.id,
        target_identifier=target_user.username,
        reason=req.reason.strip(),
        details=f"회원 '{target_user.username}'(ID: {target_user.id}) 계정이 정지 처리되었습니다.",
        ip_address=client_ip
    )

    return {"message": f"회원 '{target_user.username}' 계정이 정지되었습니다. 사유: {target_user.ban_reason}"}

@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 계정 정지 해제 (Unban)
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대상 회원을 찾을 수 없습니다.")

    if not target_user.is_banned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="정지 상태가 아닌 회원입니다.")

    prev_reason = target_user.ban_reason
    target_user.is_banned = False
    target_user.ban_reason = None
    target_user.banned_at = None
    db.commit()

    # 감사 로그 기록
    client_ip = request.client.host if request.client else None
    record_audit_log(
        db=db,
        admin_id=admin_user.id,
        action="USER_UNBAN",
        target_type="user",
        target_id=target_user.id,
        target_identifier=target_user.username,
        reason="관리자 수동 정지 해제",
        details=f"회원 '{target_user.username}' 계정 정지 해제 (이전 정지 사유: {prev_reason})",
        ip_address=client_ip
    )

    return {"message": f"회원 '{target_user.username}' 계정의 정지가 해제되었습니다."}

@router.delete("/users/{user_id}")
def delete_user_by_admin(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 영구 탈퇴 / 계정 삭제 (관리자 권한)
    - 보안: 관리자 본인 계정 및 타 관리자 계정 삭제 방어
    - 감사 로그 기록
    """
    if user_id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="관리자 본인 계정은 탈퇴/삭제할 수 없습니다.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대상 회원을 찾을 수 없습니다.")

    if target_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="다른 관리자 계정은 삭제할 수 없습니다.")

    username_cached = target_user.username

    try:
        # 연관 알림 삭제
        db.query(Notification).filter(
            (Notification.recipient_id == user_id) | (Notification.sender_id == user_id)
        ).delete(synchronize_session=False)

        # 연관 메시지 및 대화방 삭제
        db.query(Message).filter(Message.sender_id == user_id).delete(synchronize_session=False)
        db.query(Conversation).filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).delete(synchronize_session=False)

        # 연관 신고 레코드 처리
        db.query(Report).filter(
            (Report.reporter_id == user_id) | ((Report.target_type == "user") & (Report.target_id == user_id))
        ).delete(synchronize_session=False)

        db.delete(target_user)
        db.commit()

        # 감사 로그 기록
        client_ip = request.client.host if request.client else None
        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="USER_DELETE",
            target_type="user",
            target_id=user_id,
            target_identifier=username_cached,
            reason="관리자 영구 계정 삭제",
            details=f"회원 '{username_cached}'(ID: {user_id}) 데이터 및 관계 일괄 영구 삭제",
            ip_address=client_ip
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 탈퇴 처리 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"회원 '{username_cached}' 계정이 안전하게 탈퇴 처리되었습니다."}

# -----------------------------------------------------------------------------
# 3. 게시물 관리 (DB 페이징 최적화, 강제 삭제 및 감사 로그)
# -----------------------------------------------------------------------------
@router.get("/posts", response_model=AdminPostsResponse)
def get_admin_posts(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(15, ge=1, le=100, description="페이지당 건수"),
    q: Optional[str] = Query(None, max_length=100, description="검색어 (본문, 작성자)"),
    sort_by: str = Query("created_at_desc", pattern="^(created_at_desc|created_at_asc|likes_desc|comments_desc)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    게시물 관리 목록 조회 (DB 레벨 조인 집계 및 페이징)
    """
    likes_subq = (
        db.query(Like.target_id, func.count(Like.id).label("likes_count"))
        .filter(Like.target_type == "post")
        .group_by(Like.target_id)
        .subquery()
    )
    comments_subq = (
        db.query(Comment.post_id, func.count(Comment.id).label("comments_count"))
        .group_by(Comment.post_id)
        .subquery()
    )

    query = db.query(
        Post,
        func.coalesce(likes_subq.c.likes_count, 0).label("likes_count"),
        func.coalesce(comments_subq.c.comments_count, 0).label("comments_count")
    ).join(User, Post.user_id == User.id) \
     .outerjoin(likes_subq, Post.id == likes_subq.c.target_id) \
     .outerjoin(comments_subq, Post.id == comments_subq.c.post_id)

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (Post.caption.ilike(search_term)) |
            (User.username.ilike(search_term))
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if sort_by == "created_at_asc":
        query = query.order_by(asc(Post.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(Post.created_at))
    elif sort_by == "likes_desc":
        query = query.order_by(desc("likes_count"), desc(Post.created_at))
    elif sort_by == "comments_desc":
        query = query.order_by(desc("comments_count"), desc(Post.created_at))

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = [
        AdminPostItem(
            id=p.id,
            user_id=p.user_id,
            author=AdminPostAuthor(
                id=p.author.id,
                username=p.author.username,
                full_name=p.author.full_name,
                profile_image_url=p.author.profile_image_url
            ) if p.author else AdminPostAuthor(id=0, username="unknown"),
            caption=p.caption,
            location=p.location,
            media_urls=[m.media_url for m in p.media],
            media_type=p.media[0].media_type if p.media else "image",
            likes_count=l_cnt,
            comments_count=c_cnt,
            created_at=p.created_at
        )
        for p, l_cnt, c_cnt in records
    ]

    return AdminPostsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.delete("/posts/{post_id}")
def delete_post_by_admin(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    게시물 강제 삭제 (관리자 권한 & 감사 로그 기록)
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 게시물을 찾을 수 없습니다.")

    author_username = post.author.username if post.author else "unknown"
    caption_summary = (post.caption[:50] + "...") if post.caption and len(post.caption) > 50 else (post.caption or "")

    try:
        # 연관 알림 정리
        db.query(Notification).filter(
            (Notification.target_id == post_id) &
            (Notification.type.in_(["like_post", "comment"]))
        ).delete(synchronize_session=False)

        # 연관 신고 레코드 처리
        db.query(Report).filter(Report.target_type == "post", Report.target_id == post_id).update({
            "status": "resolved",
            "resolution_action": "content_deleted",
            "resolved_by": admin_user.id,
            "resolved_at": datetime.now(),
            "resolution_notes": "게시물 관리자에 의해 직접 삭제됨"
        })

        db.delete(post)
        db.commit()

        # 감사 로그 기록
        client_ip = request.client.host if request.client else None
        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="POST_DELETE",
            target_type="post",
            target_id=post_id,
            target_identifier=f"@{author_username}",
            reason="관리자 강제 삭제",
            details=f"작성자: @{author_username} / 본문: {caption_summary}",
            ip_address=client_ip
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시물 삭제 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"게시물 (ID: {post_id})이 관리자 권한으로 삭제되었습니다."}

# -----------------------------------------------------------------------------
# 4. 릴스 관리 (DB 페이징 최적화, 강제 삭제 및 감사 로그)
# -----------------------------------------------------------------------------
@router.get("/reels", response_model=AdminReelsResponse)
def get_admin_reels(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(15, ge=1, le=100, description="페이지당 건수"),
    q: Optional[str] = Query(None, max_length=100, description="검색어 (캡션, 작성자, 오디오 제목)"),
    sort_by: str = Query("created_at_desc", pattern="^(created_at_desc|created_at_asc|likes_desc|comments_desc|shares_desc)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    릴스 관리 목록 조회 (DB 레벨 조인 집계 및 페이징)
    """
    likes_subq = (
        db.query(Like.target_id, func.count(Like.id).label("likes_count"))
        .filter(Like.target_type == "reel")
        .group_by(Like.target_id)
        .subquery()
    )
    comments_subq = (
        db.query(Comment.post_id, func.count(Comment.id).label("comments_count"))
        .group_by(Comment.post_id)
        .subquery()
    )

    query = db.query(
        Reel,
        func.coalesce(likes_subq.c.likes_count, 0).label("likes_count"),
        func.coalesce(comments_subq.c.comments_count, 0).label("comments_count")
    ).join(User, Reel.user_id == User.id) \
     .outerjoin(likes_subq, Reel.id == likes_subq.c.target_id) \
     .outerjoin(comments_subq, Reel.id == comments_subq.c.post_id)

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (Reel.caption.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (Reel.audio_title.ilike(search_term))
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if sort_by == "created_at_asc":
        query = query.order_by(asc(Reel.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(Reel.created_at))
    elif sort_by == "shares_desc":
        query = query.order_by(desc(Reel.shares_count), desc(Reel.created_at))
    elif sort_by == "likes_desc":
        query = query.order_by(desc("likes_count"), desc(Reel.created_at))
    elif sort_by == "comments_desc":
        query = query.order_by(desc("comments_count"), desc(Reel.created_at))

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = [
        AdminReelItem(
            id=r.id,
            user_id=r.user_id,
            author=AdminReelAuthor(
                id=r.author.id,
                username=r.author.username,
                full_name=r.author.full_name,
                profile_image_url=r.author.profile_image_url
            ) if r.author else AdminReelAuthor(id=0, username="unknown"),
            video_url=r.video_url,
            poster_url=r.poster_url,
            caption=r.caption,
            audio_title=r.audio_title,
            likes_count=l_cnt,
            comments_count=c_cnt,
            shares_count=r.shares_count,
            created_at=r.created_at
        )
        for r, l_cnt, c_cnt in records
    ]

    return AdminReelsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.delete("/reels/{reel_id}")
def delete_reel_by_admin(
    reel_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    릴스 동영상 강제 삭제 (관리자 권한 & 감사 로그)
    """
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 릴스를 찾을 수 없습니다.")

    author_username = reel.author.username if reel.author else "unknown"

    try:
        # 연관 알림 정리
        db.query(Notification).filter(
            (Notification.target_id == reel_id) &
            (Notification.type.in_(["like_reel", "comment_reel"]))
        ).delete(synchronize_session=False)

        # 연관 신고 레코드 처리
        db.query(Report).filter(Report.target_type == "reel", Report.target_id == reel_id).update({
            "status": "resolved",
            "resolution_action": "content_deleted",
            "resolved_by": admin_user.id,
            "resolved_at": datetime.now(),
            "resolution_notes": "릴스 관리자에 의해 직접 삭제됨"
        })

        db.delete(reel)
        db.commit()

        # 감사 로그 기록
        client_ip = request.client.host if request.client else None
        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="REEL_DELETE",
            target_type="reel",
            target_id=reel_id,
            target_identifier=f"@{author_username}",
            reason="관리자 강제 삭제",
            details=f"작성자: @{author_username} / 캡션: {reel.caption or ''}",
            ip_address=client_ip
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"릴스 삭제 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"릴스 (ID: {reel_id})이 관리자 권한으로 삭제되었습니다."}

# -----------------------------------------------------------------------------
# 5. 신고 및 모더레이션 센터 (Report Moderation Queue)
# -----------------------------------------------------------------------------
@router.get("/reports", response_model=AdminReportsResponse)
def get_admin_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    status_filter: Optional[str] = Query(None, pattern="^(pending|resolved|dismissed)$"),
    target_type: Optional[str] = Query(None, pattern="^(post|reel|user|comment)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    신고 접수 목록 조회 (필터링 및 페이징)
    """
    query = db.query(Report)

    if status_filter:
        query = query.filter(Report.status == status_filter)
    if target_type:
        query = query.filter(Report.target_type == target_type)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = query.order_by(desc(Report.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for r in records:
        # 대상 요약 및 작성자 조회
        target_summary = None
        target_author = None
        if r.target_type == "post":
            p = db.query(Post).filter(Post.id == r.target_id).first()
            if p:
                target_summary = (p.caption[:40] + "...") if p.caption and len(p.caption) > 40 else (p.caption or "피드 이미지")
                target_author = p.author.username if p.author else None
            else:
                target_summary = "[삭제된 게시물]"
        elif r.target_type == "reel":
            re = db.query(Reel).filter(Reel.id == r.target_id).first()
            if re:
                target_summary = f"오디오: {re.audio_title} / {re.caption or ''}"[:40]
                target_author = re.author.username if re.author else None
            else:
                target_summary = "[삭제된 릴스]"
        elif r.target_type == "user":
            u = db.query(User).filter(User.id == r.target_id).first()
            if u:
                target_summary = f"계정: @{u.username} ({u.full_name or ''})"
                target_author = u.username
            else:
                target_summary = "[탈퇴한 회원]"
        elif r.target_type == "comment":
            c = db.query(Comment).filter(Comment.id == r.target_id).first()
            if c:
                target_summary = c.content[:40]
                target_author = c.author.username if c.author else None
            else:
                target_summary = "[삭제된 댓글]"

        items.append(
            AdminReportItem(
                id=r.id,
                reporter_id=r.reporter_id,
                reporter_username=r.reporter.username if r.reporter else "unknown",
                target_type=r.target_type,
                target_id=r.target_id,
                target_summary=target_summary,
                target_author_username=target_author,
                reason_category=r.reason_category,
                description=r.description,
                status=r.status,
                resolution_action=r.resolution_action,
                resolution_notes=r.resolution_notes,
                resolved_by_username=r.resolver.username if r.resolver else None,
                created_at=r.created_at,
                resolved_at=r.resolved_at,
            )
        )

    return AdminReportsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/reports/{report_id}/action")
def take_report_action(
    report_id: int,
    req: ReportActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    신고 심사 처리 (콘텐츠 강제 삭제 / 계정 정지 / 기각)
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 신고를 찾을 수 없습니다.")

    client_ip = request.client.host if request.client else None

    # 1. 콘텐츠 삭제 조치
    if req.action == "content_deleted":
        if report.target_type == "post":
            p = db.query(Post).filter(Post.id == report.target_id).first()
            if p:
                db.delete(p)
        elif report.target_type == "reel":
            re = db.query(Reel).filter(Reel.id == report.target_id).first()
            if re:
                db.delete(re)
        elif report.target_type == "comment":
            c = db.query(Comment).filter(Comment.id == report.target_id).first()
            if c:
                db.delete(c)

        report.status = "resolved"
        report.resolution_action = "content_deleted"
        report.resolution_notes = req.notes or "신고 승인 및 유해 콘텐츠 삭제 처리"
        report.resolved_by = admin_user.id
        report.resolved_at = datetime.now()
        db.commit()

        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="REPORT_RESOLVE",
            target_type=report.target_type,
            target_id=report.target_id,
            target_identifier=f"Report #{report.id}",
            reason=report.reason_category,
            details=f"신고 승인에 따른 콘텐츠 삭제 완료 (메모: {req.notes or '없음'})",
            ip_address=client_ip
        )
        return {"message": "신고가 승인되어 대상 콘텐츠가 삭제 처리되었습니다."}

    # 2. 회원 계정 정지 조치
    elif req.action == "user_banned":
        target_uid = None
        if report.target_type == "user":
            target_uid = report.target_id
        elif report.target_type == "post":
            p = db.query(Post).filter(Post.id == report.target_id).first()
            if p:
                target_uid = p.user_id
        elif report.target_type == "reel":
            re = db.query(Reel).filter(Reel.id == report.target_id).first()
            if re:
                target_uid = re.user_id

        if target_uid:
            u = db.query(User).filter(User.id == target_uid).first()
            if u and not u.is_admin:
                u.is_banned = True
                u.ban_reason = req.ban_reason or f"신고 접수 제재: {report.reason_category}"
                u.banned_at = datetime.now()

        report.status = "resolved"
        report.resolution_action = "user_banned"
        report.resolution_notes = req.notes or f"신고 승인 및 작성자 계정 정지 (사유: {req.ban_reason})"
        report.resolved_by = admin_user.id
        report.resolved_at = datetime.now()
        db.commit()

        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="REPORT_RESOLVE",
            target_type="user",
            target_id=target_uid,
            target_identifier=f"Report #{report.id}",
            reason=req.ban_reason or report.reason_category,
            details=f"신고 승인에 따른 회원 계정 정지 (메모: {req.notes or '없음'})",
            ip_address=client_ip
        )
        return {"message": "신고가 승인되어 대상 회원이 정지 처리되었습니다."}

    # 3. 허위/정상 신고 기각 (Dismiss)
    elif req.action == "dismissed":
        report.status = "dismissed"
        report.resolution_action = "dismissed"
        report.resolution_notes = req.notes or "운영원칙 위반 미해당으로 기각"
        report.resolved_by = admin_user.id
        report.resolved_at = datetime.now()
        db.commit()

        record_audit_log(
            db=db,
            admin_id=admin_user.id,
            action="REPORT_DISMISS",
            target_type=report.target_type,
            target_id=report.target_id,
            target_identifier=f"Report #{report.id}",
            reason="위반 미해당 기각",
            details=req.notes or "신고 반려 및 기각 처리",
            ip_address=client_ip
        )
        return {"message": "해당 신고가 기각(반려) 처리되었습니다."}

# -----------------------------------------------------------------------------
# 6. 관리자 감사 로그 조회 (Audit Logs)
# -----------------------------------------------------------------------------
@router.get("/audit-logs", response_model=AdminAuditLogsResponse)
def get_admin_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None, description="액션 필터 (USER_BAN, USER_DELETE, POST_DELETE 등)"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    관리자 감사 로그 조회 (작업자, 대상, 일시, IP, 사유)
    """
    query = db.query(AdminAuditLog)
    if action:
        query = query.filter(AdminAuditLog.action == action)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = query.order_by(desc(AdminAuditLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    items = [
        AdminAuditLogItem(
            id=l.id,
            admin_id=l.admin_id,
            admin_username=l.admin.username if l.admin else "System",
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            target_identifier=l.target_identifier,
            reason=l.reason,
            details=l.details,
            ip_address=l.ip_address,
            created_at=l.created_at,
        )
        for l in records
    ]

    return AdminAuditLogsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

# -----------------------------------------------------------------------------
# 7. 시스템 인프라 및 리소스 헬스체크 모니터링
# -----------------------------------------------------------------------------
def get_directory_stats(dir_path: str):
    total_size = 0
    file_count = 0
    if not os.path.exists(dir_path):
        return {"size_bytes": 0, "file_count": 0}
    for root, dirs, files in os.walk(dir_path):
        for f in files:
            fp = os.path.join(root, f)
            try:
                total_size += os.path.getsize(fp)
                file_count += 1
            except OSError:
                pass
    return {"size_bytes": total_size, "file_count": file_count}

def format_bytes(bytes_val: int) -> str:
    if bytes_val < 1024:
        return f"{bytes_val} B"
    elif bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.2f} KB"
    elif bytes_val < 1024 * 1024 * 1024:
        return f"{bytes_val / (1024 * 1024):.2f} MB"
    else:
        return f"{bytes_val / (1024 * 1024 * 1024):.2f} GB"

@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    실시간 시스템 인프라, DB 상태, 스토리지 용량 진단
    """
    uptime = time.time() - START_TIME

    # 1. DB 파일 크기 및 상태
    db_file = "instagram.db"
    db_size = os.path.getsize(db_file) if os.path.exists(db_file) else 0

    # 2. 업로드 스토리지 용량 및 파일 수
    upload_dir = settings.UPLOAD_DIR
    categories = ["posts", "reels", "profiles", "stories", "direct"]
    breakdown = {}
    total_upload_size = 0
    total_upload_files = 0

    for cat in categories:
        cat_path = os.path.join(upload_dir, cat)
        stat = get_directory_stats(cat_path)
        stat["size_formatted"] = format_bytes(stat["size_bytes"])
        breakdown[cat] = stat
        total_upload_size += stat["size_bytes"]
        total_upload_files += stat["file_count"]

    # 3. 데이터베이스 레코드 카운트
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    total_reels = db.query(func.count(Reel.id)).scalar() or 0
    banned_users = db.query(func.count(User.id)).filter(User.is_banned == True).scalar() or 0
    pending_reports = db.query(func.count(Report.id)).filter(Report.status == "pending").scalar() or 0

    return SystemHealthResponse(
        database_status="healthy",
        database_engine="SQLite (WAL Mode Enabled)",
        database_size_bytes=db_size,
        database_size_formatted=format_bytes(db_size),
        uploads_total_size_bytes=total_upload_size,
        uploads_total_size_formatted=format_bytes(total_upload_size),
        uploads_file_count=total_upload_files,
        uploads_breakdown=breakdown,
        server_uptime_seconds=round(uptime, 1),
        python_version=platform.python_version(),
        os_platform=f"{platform.system()} {platform.release()}",
        total_users=total_users,
        total_posts=total_posts,
        total_reels=total_reels,
        banned_users=banned_users,
        pending_reports=pending_reports,
    )
