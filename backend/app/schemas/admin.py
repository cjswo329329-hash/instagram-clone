from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AdminSummaryStats(BaseModel):
    total_users: int
    new_users_today: int
    new_users_this_week: int
    total_posts: int
    new_posts_today: int
    total_reels: int
    total_comments: int
    total_likes: int

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

