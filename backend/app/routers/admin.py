from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc, asc
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
from app.schemas.admin import (
    AdminStatsResponse,
    AdminSummaryStats,
    DateCount,
    TopUserItem,
    AdminUsersResponse,
    AdminUserItem,
    AdminPostsResponse,
    AdminPostItem,
    AdminPostAuthor,
    AdminReelsResponse,
    AdminReelItem,
    AdminReelAuthor,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin_user)])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_statistics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    어드민 통계 대시보드 데이터 조회
    - 보안: 관리자 권한(get_current_admin_user) 필수 검증
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)

    # 1. 요약 통계
    total_users = db.query(func.count(User.id)).scalar() or 0
    new_users_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_users_this_week = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0

    total_posts = db.query(func.count(Post.id)).scalar() or 0
    new_posts_today = db.query(func.count(Post.id)).filter(Post.created_at >= today_start).scalar() or 0
    total_reels = db.query(func.count(Reel.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    total_likes = db.query(func.count(Like.id)).scalar() or 0

    summary = AdminSummaryStats(
        total_users=total_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week,
        total_posts=total_posts,
        new_posts_today=new_posts_today,
        total_reels=total_reels,
        total_comments=total_comments,
        total_likes=total_likes,
    )

    # 2. 최근 14일 일별 가입 추이 및 게시물 작성 추이
    user_trend: List[DateCount] = []
    post_trend: List[DateCount] = []

    # 최근 14일 날짜 생성
    for i in range(13, -1, -1):
        target_day = today_start - timedelta(days=i)
        next_day = target_day + timedelta(days=1)
        date_str = target_day.strftime("%m-%d")

        u_count = db.query(func.count(User.id)).filter(
            User.created_at >= target_day,
            User.created_at < next_day
        ).scalar() or 0

        p_count = db.query(func.count(Post.id)).filter(
            Post.created_at >= target_day,
            Post.created_at < next_day
        ).scalar() or 0

        user_trend.append(DateCount(date=date_str, count=u_count))
        post_trend.append(DateCount(date=date_str, count=p_count))

    # 3. 우수 활동 회원 상위 5명 (게시물 수 기준)
    top_user_records = db.query(User).all()
    user_stats = []
    for u in top_user_records:
        if u.is_admin:
            continue
        p_count = len(u.posts)
        f_count = db.query(func.count(Follow.id)).filter(Follow.following_id == u.id, Follow.status == "accepted").scalar() or 0
        user_stats.append(TopUserItem(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            profile_image_url=u.profile_image_url,
            posts_count=p_count,
            followers_count=f_count
        ))

    user_stats.sort(key=lambda x: (x.posts_count, x.followers_count), reverse=True)
    top_users = user_stats[:5]

    return AdminStatsResponse(
        summary=summary,
        user_registration_trend=user_trend,
        post_creation_trend=post_trend,
        top_users=top_users
    )

@router.get("/users", response_model=AdminUsersResponse)
def get_admin_users(
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    page_size: int = Query(15, ge=1, le=100, description="페이지당 건수 (최대 100건)"),
    q: Optional[str] = Query(None, max_length=100, description="검색어 (아이디, 이메일, 성명)"),
    sort_by: str = Query("created_at_desc", pattern="^(created_at_desc|created_at_asc|posts_desc|followers_desc)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 관리 목록 조회 (가입날짜 포함, 검색, 정렬, 페이징)
    """
    query = db.query(User)

    # 검색어 필터링 (파라미터 바인딩으로 SQL Injection 방지)
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )

    # 정렬
    if sort_by == "created_at_asc":
        query = query.order_by(asc(User.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(User.created_at))
    else:
        # posts_desc or followers_desc: 전체 가져와 정렬 처리
        pass

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if sort_by in ["posts_desc", "followers_desc"]:
        all_matched = query.all()
        user_items = []
        for u in all_matched:
            p_count = len(u.posts)
            f_count = db.query(func.count(Follow.id)).filter(Follow.following_id == u.id, Follow.status == "accepted").scalar() or 0
            fg_count = db.query(func.count(Follow.id)).filter(Follow.follower_id == u.id, Follow.status == "accepted").scalar() or 0
            user_items.append((u, p_count, f_count, fg_count))

        if sort_by == "posts_desc":
            user_items.sort(key=lambda x: x[1], reverse=True)
        else:
            user_items.sort(key=lambda x: x[2], reverse=True)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = user_items[start_idx:end_idx]

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
                created_at=u.created_at,
                posts_count=p_cnt,
                followers_count=f_cnt,
                following_count=fg_cnt,
            )
            for u, p_cnt, f_cnt, fg_cnt in paged_items
        ]
    else:
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        items = []
        for u in users:
            p_count = len(u.posts)
            f_count = db.query(func.count(Follow.id)).filter(Follow.following_id == u.id, Follow.status == "accepted").scalar() or 0
            fg_count = db.query(func.count(Follow.id)).filter(Follow.follower_id == u.id, Follow.status == "accepted").scalar() or 0
            items.append(
                AdminUserItem(
                    id=u.id,
                    username=u.username,
                    email=u.email,
                    full_name=u.full_name,
                    profile_image_url=u.profile_image_url,
                    is_admin=u.is_admin,
                    is_verified=u.is_verified,
                    is_private=u.is_private,
                    created_at=u.created_at,
                    posts_count=p_count,
                    followers_count=f_count,
                    following_count=fg_count,
                )
            )

    return AdminUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.delete("/users/{user_id}")
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    회원 탈퇴 / 계정 삭제 (관리자 권한)
    - 보안: 관리자 본인 계정 삭제 불가
    - 데이터 무결성: 연관 알림, 메시지, 관계 안전 삭제 처리
    """
    # 1. 본인 계정 탈퇴 시도 차단
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="관리자 본인 계정은 탈퇴/삭제할 수 없습니다."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="대상 회원을 찾을 수 없습니다."
        )

    username_cached = target_user.username

    try:
        # 연관 알림 삭제
        db.query(Notification).filter(
            (Notification.recipient_id == user_id) | (Notification.sender_id == user_id)
        ).delete(synchronize_session=False)

        # 연관 메시지 삭제
        db.query(Message).filter(Message.sender_id == user_id).delete(synchronize_session=False)

        # 연관 대화방 삭제
        db.query(Conversation).filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).delete(synchronize_session=False)

        # 사용자 레코드 삭제 (SQLAlchemy relationships의 cascade="all, delete-orphan"으로 게시물, 댓글, 좋아요 등 삭제)
        db.delete(target_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 탈퇴 처리 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"회원 '{username_cached}' 계정이 안전하게 탈퇴 처리되었습니다."}

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
    게시물 관리 목록 조회 (검색, 정렬, 페이징)
    """
    query = db.query(Post).join(User, Post.user_id == User.id)

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (Post.caption.ilike(search_term)) |
            (User.username.ilike(search_term))
        )

    if sort_by == "created_at_asc":
        query = query.order_by(asc(Post.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(Post.created_at))
    else:
        pass

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if sort_by in ["likes_desc", "comments_desc"]:
        all_posts = query.all()
        post_items = []
        for p in all_posts:
            l_cnt = len(p.likes)
            c_cnt = len(p.comments)
            post_items.append((p, l_cnt, c_cnt))

        if sort_by == "likes_desc":
            post_items.sort(key=lambda x: x[1], reverse=True)
        else:
            post_items.sort(key=lambda x: x[2], reverse=True)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = post_items[start_idx:end_idx]

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
            for p, l_cnt, c_cnt in paged_items
        ]
    else:
        offset = (page - 1) * page_size
        posts = query.offset(offset).limit(page_size).all()
        items = []
        for p in posts:
            items.append(
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
                    likes_count=len(p.likes),
                    comments_count=len(p.comments),
                    created_at=p.created_at
                )
            )

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
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    게시물 강제 삭제 (관리자 권한)
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="삭제할 게시물을 찾을 수 없습니다."
        )

    try:
        # 연관 알림 정리
        db.query(Notification).filter(
            (Notification.target_id == post_id) &
            (Notification.type.in_(["like_post", "comment"]))
        ).delete(synchronize_session=False)

        db.delete(post)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시물 삭제 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"게시물 (ID: {post_id})이 관리자 권한으로 삭제되었습니다."}

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
    릴스 관리 목록 조회 (검색, 정렬, 페이징)
    """
    query = db.query(Reel).join(User, Reel.user_id == User.id)

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (Reel.caption.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (Reel.audio_title.ilike(search_term))
        )

    if sort_by == "created_at_asc":
        query = query.order_by(asc(Reel.created_at))
    elif sort_by == "created_at_desc":
        query = query.order_by(desc(Reel.created_at))
    elif sort_by == "shares_desc":
        query = query.order_by(desc(Reel.shares_count))
    else:
        pass

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if sort_by in ["likes_desc", "comments_desc"]:
        all_reels = query.all()
        reel_items = []
        for r in all_reels:
            l_cnt = len(r.likes)
            c_cnt = len(r.comments)
            reel_items.append((r, l_cnt, c_cnt))

        if sort_by == "likes_desc":
            reel_items.sort(key=lambda x: x[1], reverse=True)
        else:
            reel_items.sort(key=lambda x: x[2], reverse=True)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = reel_items[start_idx:end_idx]

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
            for r, l_cnt, c_cnt in paged_items
        ]
    else:
        offset = (page - 1) * page_size
        reels = query.offset(offset).limit(page_size).all()
        items = []
        for r in reels:
            items.append(
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
                    likes_count=len(r.likes),
                    comments_count=len(r.comments),
                    shares_count=r.shares_count,
                    created_at=r.created_at
                )
            )

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
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    릴스 동영상 강제 삭제 (관리자 권한)
    """
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="삭제할 릴스를 찾을 수 없습니다."
        )

    try:
        # 연관 알림 정리
        db.query(Notification).filter(
            (Notification.target_id == reel_id) &
            (Notification.type.in_(["like_reel", "comment_reel"]))
        ).delete(synchronize_session=False)

        db.delete(reel)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"릴스 삭제 중 오류가 발생했습니다: {str(e)}"
        )

    return {"message": f"릴스 (ID: {reel_id})이 관리자 권한으로 삭제되었습니다."}

