from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserSimple

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentReplyResponse(BaseModel):
    id: int
    post_id: Optional[int] = None
    reel_id: Optional[int] = None
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author: UserSimple
    likes_count: int = 0
    is_liked: bool = False

    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    post_id: Optional[int] = None
    reel_id: Optional[int] = None
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author: UserSimple
    likes_count: int = 0
    is_liked: bool = False
    replies: List[CommentReplyResponse] = []
    replies_count: int = 0

    class Config:
        from_attributes = True
