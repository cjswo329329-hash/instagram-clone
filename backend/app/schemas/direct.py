from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, computed_field

class PartnerProfile(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_verified: bool = False
    is_online: bool = False
    last_active: str = "최근 활동"
    is_muted: bool = False
    has_story: bool = False

    @computed_field
    @property
    def fullName(self) -> Optional[str]:
        return self.full_name

    @computed_field
    @property
    def profileImageUrl(self) -> Optional[str]:
        return self.profile_image_url

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: int
    text: Optional[str] = None
    media_url: Optional[str] = Field(None, serialization_alias="mediaUrl")
    is_read: bool = False
    reactions: List[str] = []
    created_at: datetime
    time_ago: str = Field("방금 전", serialization_alias="timeAgo")

    class Config:
        from_attributes = True
        populate_by_name = True

class MessageCreate(BaseModel):
    text: Optional[str] = None
    media_url: Optional[str] = None

class ReactionToggleRequest(BaseModel):
    reaction: str = "❤️"

class ConversationResponse(BaseModel):
    id: str
    partner: PartnerProfile
    unread_count: int = 0
    time_ago: str = "방금 전"
    messages: List[MessageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    target_user_id: int
