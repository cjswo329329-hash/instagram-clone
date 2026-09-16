from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class AdminSummaryStats(BaseModel):
    total_users: int
    new_users_today: int
    new_users_this_week: int
    total_posts: int
    new_posts_today: int
    total_reels: int
    total_comments: int
    total_likes: int
    banned_users: int = 0
    pending_reports: int = 0

class DateCount(BaseModel):
    date: str
    count: int

class TopUserItem(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    posts_count: int
    followers_count: int

class AdminStatsResponse(BaseModel):
    summary: AdminSummaryStats
    user_registration_trend: List[DateCount]
    post_creation_trend: List[DateCount]
    top_users: List[TopUserItem]

class AdminUserItem(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_admin: bool = False
    is_verified: bool = False
    is_private: bool = False
    is_banned: bool = False
    ban_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    created_at: datetime
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class AdminUsersResponse(BaseModel):
    items: List[AdminUserItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class UserBanRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=255, description="정지 사유")

class AdminPostAuthor(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AdminPostItem(BaseModel):
    id: int
    user_id: int
    author: AdminPostAuthor
    caption: Optional[str] = None
    location: Optional[str] = None
    media_urls: List[str] = []
    media_type: str = "image"
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminPostsResponse(BaseModel):
    items: List[AdminPostItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class AdminReelAuthor(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AdminReelItem(BaseModel):
    id: int
    user_id: int
    author: AdminReelAuthor
    video_url: str
    poster_url: Optional[str] = None
    caption: Optional[str] = None
    audio_title: str
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminReelsResponse(BaseModel):
    items: List[AdminReelItem]
    total: int
    page: int
    page_size: int
    total_pages: int

# 감사 로그 스키마
class AdminAuditLogItem(BaseModel):
    id: int
    admin_id: int
    admin_username: str
    action: str
    target_type: str
    target_id: Optional[int] = None
    target_identifier: Optional[str] = None
    reason: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminAuditLogsResponse(BaseModel):
    items: List[AdminAuditLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int

# 신고 스키마
class ReportCreateRequest(BaseModel):
    target_type: str = Field(..., pattern="^(post|reel|user|comment)$", description="신고 대상 유형")
    target_id: int = Field(..., ge=1, description="신고 대상 고유 ID")
    reason_category: str = Field(..., description="신고 카테고리 (spam, harassment, explicit, violence, hate, copyright, other)")
    description: Optional[str] = Field(None, max_length=1000, description="상세 신고 내용")

class ReportActionRequest(BaseModel):
    action: str = Field(..., pattern="^(content_deleted|user_banned|dismissed)$", description="조치 내용")
    notes: Optional[str] = Field(None, max_length=500, description="관리자 처리 메모")
    ban_reason: Optional[str] = Field(None, max_length=255, description="회원 정지 시 정지 사유")

class AdminReportItem(BaseModel):
    id: int
    reporter_id: int
    reporter_username: str
    target_type: str
    target_id: int
    target_summary: Optional[str] = None
    target_author_username: Optional[str] = None
    reason_category: str
    description: Optional[str] = None
    status: str
    resolution_action: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by_username: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AdminReportsResponse(BaseModel):
    items: List[AdminReportItem]
    total: int
    page: int
    page_size: int
    total_pages: int

# 시스템 헬스 모니터링 스키마
class SystemHealthResponse(BaseModel):
    database_status: str
    database_engine: str
    database_size_bytes: int
    database_size_formatted: str
    uploads_total_size_bytes: int
    uploads_total_size_formatted: str
    uploads_file_count: int
    uploads_breakdown: Dict[str, Any]
    server_uptime_seconds: float
    python_version: str
    os_platform: str
    total_users: int
    total_posts: int
    total_reels: int
    banned_users: int
    pending_reports: int
