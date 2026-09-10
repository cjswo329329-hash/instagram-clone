from typing import Optional
from datetime import datetime
from pydantic import BaseModel, computed_field
from app.schemas.user import UserSimple

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    sender_id: int
    sender: UserSimple
    type: str  # 'like_post', 'like_reel', 'comment', 'follow'
    target_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime
    text_preview: Optional[str] = None
    follow_request_status: Optional[str] = None

    @computed_field
    @property
    def isRead(self) -> bool:
        return self.is_read

    @computed_field
    @property
    def textPreview(self) -> Optional[str]:
        return self.text_preview

    @computed_field
    @property
    def followRequestStatus(self) -> Optional[str]:
        return self.follow_request_status

    class Config:
        from_attributes = True

