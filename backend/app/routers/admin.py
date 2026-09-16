import os
import sys
import platform
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, desc, asc, text
from sqlalchemy.orm import Session, joinedload, selectinload

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
    search: Optional[str] = Query(None, max_length=100, description="검색어 alias"),
    status_filter: Optional[str] = Query(None, description="계정 상태 필터 (active|banned|admin)"),
    status: Optional[str] = Query(None, description="계정 상태 필터 alias"),
    sort_by: str = Query("created_at_desc", description="정렬 기준"),
    sortBy: Optional[str] = Query(None, description="정렬 기준 alias"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 관리 목록 조회 (DB 레벨 인덱스 기반 페이징 및 배치 최적화)
    - 성능 최적화: 전체 테이블 풀스캔 서브쿼리 조인 제거
    - 페이지네이션 대상 15명만 배치 쿼리로 팔로워/포스트 집계 (N+1 제거)
    - status / status_filter, q / search, sort_by / sortBy 상호 호환 지원
    """
    eff_q = q if q is not None else search
    eff_status = status_filter if status_filter is not None else status
    eff_sort = sortBy if sortBy is not None else sort_by

    base_query = db.query(User)

    # 검색 필터
    if eff_q and eff_q.strip():
        search_term = f"%{eff_q.strip()}%"
        base_query = base_query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )

    # 상태 필터
    if eff_status == "banned":
        base_query = base_query.filter(User.is_banned == True)
    elif eff_status == "active":
        base_query = base_query.filter(User.is_banned == False)
    elif eff_status == "admin":
        base_query = base_query.filter(User.is_admin == True)

    total = base_query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # DB 레벨 정렬
    if eff_sort == "posts_desc":
        posts_subq = (
            db.query(Post.user_id, func.count(Post.id).label("post_count"))
            .group_by(Post.user_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(posts_subq, User.id == posts_subq.c.user_id).order_by(
            desc(func.coalesce(posts_subq.c.post_count, 0)), desc(User.created_at)
        )
    elif eff_sort == "followers_desc":
        followers_subq = (
            db.query(Follow.following_id, func.count(Follow.id).label("follower_count"))
            .filter(Follow.status == "accepted")
            .group_by(Follow.following_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(followers_subq, User.id == followers_subq.c.following_id).order_by(
            desc(func.coalesce(followers_subq.c.follower_count, 0)), desc(User.created_at)
        )
    elif eff_sort == "created_at_asc":
        sorted_query = base_query.order_by(asc(User.created_at))
    else:
        sorted_query = base_query.order_by(desc(User.created_at))

    offset = (page - 1) * page_size
    users = sorted_query.offset(offset).limit(page_size).all()

    # 현재 페이지 유저들에 대해서만 O(1) 배치 집계 쿼리 실행
    user_ids = [u.id for u in users]
    posts_map = {}
    followers_map = {}
    following_map = {}

    if user_ids:
        post_counts = (
            db.query(Post.user_id, func.count(Post.id))
            .filter(Post.user_id.in_(user_ids))
            .group_by(Post.user_id)
            .all()
        )
        posts_map = dict(post_counts)

        follower_counts = (
            db.query(Follow.following_id, func.count(Follow.id))
            .filter(Follow.following_id.in_(user_ids), Follow.status == "accepted")
            .group_by(Follow.following_id)
            .all()
        )
        followers_map = dict(follower_counts)

        following_counts = (
            db.query(Follow.follower_id, func.count(Follow.id))
            .filter(Follow.follower_id.in_(user_ids), Follow.status == "accepted")
            .group_by(Follow.follower_id)
            .all()
        )
        following_map = dict(following_counts)

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
            posts_count=posts_map.get(u.id, 0),
            followers_count=followers_map.get(u.id, 0),
            following_count=following_map.get(u.id, 0),
        )
        for u in users
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
    search: Optional[str] = Query(None, max_length=100, description="검색어 alias"),
    media_type: Optional[str] = Query(None, description="미디어 유형 필터 (image|video)"),
    sort_by: str = Query("created_at_desc", description="정렬 기준"),
    sortBy: Optional[str] = Query(None, description="정렬 기준 alias"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    게시물 관리 목록 조회 (Eager loading 및 페이지 단위 배치 집계 최적화)
    - q/search 검색, media_type 필터링, 다양한 정렬 및 N+1 제거
    """
    eff_q = q if q is not None else search
    eff_sort = sortBy if sortBy is not None else sort_by

    base_query = db.query(Post).join(User, Post.user_id == User.id)

    if eff_q and eff_q.strip():
        search_term = f"%{eff_q.strip()}%"
        base_query = base_query.filter(
            (Post.caption.ilike(search_term)) |
            (User.username.ilike(search_term))
        )

    if media_type in ("image", "video"):
        base_query = base_query.filter(
            Post.media.any(PostMedia.media_type == media_type)
        )

    total = base_query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if eff_sort == "likes_desc":
        likes_subq = (
            db.query(Like.target_id, func.count(Like.id).label("likes_count"))
            .filter(Like.target_type == "post")
            .group_by(Like.target_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(likes_subq, Post.id == likes_subq.c.target_id).order_by(
            desc(func.coalesce(likes_subq.c.likes_count, 0)), desc(Post.created_at)
        )
    elif eff_sort == "comments_desc":
        comments_subq = (
            db.query(Comment.post_id, func.count(Comment.id).label("comments_count"))
            .group_by(Comment.post_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(comments_subq, Post.id == comments_subq.c.post_id).order_by(
            desc(func.coalesce(comments_subq.c.comments_count, 0)), desc(Post.created_at)
        )
    elif eff_sort == "created_at_asc":
        sorted_query = base_query.order_by(asc(Post.created_at))
    else:
        sorted_query = base_query.order_by(desc(Post.created_at))

    offset = (page - 1) * page_size
    posts = (
        sorted_query
        .options(joinedload(Post.author), selectinload(Post.media))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    post_ids = [p.id for p in posts]
    likes_map = {}
    comments_map = {}

    if post_ids:
        likes_counts = (
            db.query(Like.target_id, func.count(Like.id))
            .filter(Like.target_type == "post", Like.target_id.in_(post_ids))
            .group_by(Like.target_id)
            .all()
        )
        likes_map = dict(likes_counts)

        comment_counts = (
            db.query(Comment.post_id, func.count(Comment.id))
            .filter(Comment.post_id.in_(post_ids))
            .group_by(Comment.post_id)
            .all()
        )
        comments_map = dict(comment_counts)

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
            likes_count=likes_map.get(p.id, 0),
            comments_count=comments_map.get(p.id, 0),
            created_at=p.created_at
        )
        for p in posts
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
    search: Optional[str] = Query(None, max_length=100, description="검색어 alias"),
    sort_by: str = Query("created_at_desc", description="정렬 기준"),
    sortBy: Optional[str] = Query(None, description="정렬 기준 alias"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    릴스 관리 목록 조회 (Eager loading 및 배치 집계 최적화)
    """
    eff_q = q if q is not None else search
    eff_sort = sortBy if sortBy is not None else sort_by

    base_query = db.query(Reel).join(User, Reel.user_id == User.id)

    if eff_q and eff_q.strip():
        search_term = f"%{eff_q.strip()}%"
        base_query = base_query.filter(
            (Reel.caption.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (Reel.audio_title.ilike(search_term))
        )

    total = base_query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if eff_sort == "likes_desc":
        likes_subq = (
            db.query(Like.target_id, func.count(Like.id).label("likes_count"))
            .filter(Like.target_type == "reel")
            .group_by(Like.target_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(likes_subq, Reel.id == likes_subq.c.target_id).order_by(
            desc(func.coalesce(likes_subq.c.likes_count, 0)), desc(Reel.created_at)
        )
    elif eff_sort == "comments_desc":
        comments_subq = (
            db.query(Comment.post_id, func.count(Comment.id).label("comments_count"))
            .group_by(Comment.post_id)
            .subquery()
        )
        sorted_query = base_query.outerjoin(comments_subq, Reel.id == comments_subq.c.post_id).order_by(
            desc(func.coalesce(comments_subq.c.comments_count, 0)), desc(Reel.created_at)
        )
    elif eff_sort == "shares_desc":
        sorted_query = base_query.order_by(desc(Reel.shares_count), desc(Reel.created_at))
    elif eff_sort == "created_at_asc":
        sorted_query = base_query.order_by(asc(Reel.created_at))
    else:
        sorted_query = base_query.order_by(desc(Reel.created_at))

    offset = (page - 1) * page_size
    reels = (
        sorted_query
        .options(joinedload(Reel.author))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    reel_ids = [r.id for r in reels]
    likes_map = {}
    comments_map = {}

    if reel_ids:
        likes_counts = (
            db.query(Like.target_id, func.count(Like.id))
            .filter(Like.target_type == "reel", Like.target_id.in_(reel_ids))
            .group_by(Like.target_id)
            .all()
        )
        likes_map = dict(likes_counts)

        comment_counts = (
            db.query(Comment.post_id, func.count(Comment.id))
            .filter(Comment.post_id.in_(reel_ids))
            .group_by(Comment.post_id)
            .all()
        )
        comments_map = dict(comment_counts)

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
            likes_count=likes_map.get(r.id, 0),
            comments_count=comments_map.get(r.id, 0),
            shares_count=r.shares_count,
            created_at=r.created_at
        )
        for r in reels
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
    status: Optional[str] = Query(None, description="상태 필터"),
    status_filter: Optional[str] = Query(None, description="상태 필터 alias"),
    target_type: Optional[str] = Query(None, description="대상 유형 필터"),
    targetType: Optional[str] = Query(None, description="대상 유형 필터 alias"),
    q: Optional[str] = Query(None, max_length=100, description="검색어"),
    search: Optional[str] = Query(None, max_length=100, description="검색어 alias"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    신고 접수 목록 조회 (N+1 제거, 배치 대상 조회 및 다중 필터 최적화)
    """
    eff_status = status_filter if status_filter is not None else status
    eff_target = targetType if targetType is not None else target_type
    eff_q = q if q is not None else search

    query = db.query(Report).options(joinedload(Report.reporter), joinedload(Report.resolver))

    if eff_status and eff_status in ("pending", "resolved", "dismissed"):
        query = query.filter(Report.status == eff_status)
    if eff_target and eff_target in ("post", "reel", "user", "comment"):
        query = query.filter(Report.target_type == eff_target)
    if eff_q and eff_q.strip():
        search_term = f"%{eff_q.strip()}%"
        query = query.filter(
            (Report.reason_category.ilike(search_term)) |
            (Report.description.ilike(search_term))
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = query.order_by(desc(Report.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # N+1 문제 해결: 각 target_type 별로 ID를 모아서 일괄 배치 조회
    post_ids = [r.target_id for r in records if r.target_type == "post"]
    reel_ids = [r.target_id for r in records if r.target_type == "reel"]
    user_ids = [r.target_id for r in records if r.target_type == "user"]
    comment_ids = [r.target_id for r in records if r.target_type == "comment"]

    posts_map = (
        {p.id: p for p in db.query(Post).options(joinedload(Post.author)).filter(Post.id.in_(post_ids)).all()}
        if post_ids else {}
    )
    reels_map = (
        {r.id: r for r in db.query(Reel).options(joinedload(Reel.author)).filter(Reel.id.in_(reel_ids)).all()}
        if reel_ids else {}
    )
    users_map = (
        {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
        if user_ids else {}
    )
    comments_map = (
        {c.id: c for c in db.query(Comment).options(joinedload(Comment.author)).filter(Comment.id.in_(comment_ids)).all()}
        if comment_ids else {}
    )

    items = []
    for r in records:
        target_summary = None
        target_author = None
        if r.target_type == "post":
            p = posts_map.get(r.target_id)
            if p:
                target_summary = (p.caption[:40] + "...") if p.caption and len(p.caption) > 40 else (p.caption or "피드 이미지")
                target_author = p.author.username if p.author else None
            else:
                target_summary = "[삭제된 게시물]"
        elif r.target_type == "reel":
            re = reels_map.get(r.target_id)
            if re:
                target_summary = f"오디오: {re.audio_title} / {re.caption or ''}"[:40]
                target_author = re.author.username if re.author else None
            else:
                target_summary = "[삭제된 릴스]"
        elif r.target_type == "user":
            u = users_map.get(r.target_id)
            if u:
                target_summary = f"계정: @{u.username} ({u.full_name or ''})"
                target_author = u.username
            else:
                target_summary = "[탈퇴한 회원]"
        elif r.target_type == "comment":
            c = comments_map.get(r.target_id)
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
    action_filter: Optional[str] = Query(None, description="액션 필터 alias"),
    q: Optional[str] = Query(None, max_length=100, description="검색어 (식별자, 사유, 상세)"),
    search: Optional[str] = Query(None, max_length=100, description="검색어 alias"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    관리자 감사 로그 조회 (Eager loading 및 다중 필터 지원)
    """
    eff_action = action_filter if action_filter is not None else action
    eff_q = q if q is not None else search

    query = db.query(AdminAuditLog).options(joinedload(AdminAuditLog.admin))

    if eff_action and eff_action.strip():
        query = query.filter(AdminAuditLog.action == eff_action.strip())

    if eff_q and eff_q.strip():
        search_term = f"%{eff_q.strip()}%"
        query = query.filter(
            (AdminAuditLog.target_identifier.ilike(search_term)) |
            (AdminAuditLog.reason.ilike(search_term)) |
            (AdminAuditLog.details.ilike(search_term))
        )

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

    # 1. DB 파일 크기 및 상태 (절대경로 및 안전 조회)
    backend_dir = getattr(settings, "BACKEND_DIR", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_file = os.path.join(backend_dir, "instagram.db")
    if not os.path.exists(db_file):
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
