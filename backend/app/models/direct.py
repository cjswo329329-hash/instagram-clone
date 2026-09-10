from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # "conv-1" or UUID
    user1_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # 관계 정의
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="uq_conv_users"),
        Index("idx_conv_users", "user1_id", "user2_id"),
    )

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # "msg-101" or UUID
    conversation_id: Mapped[str] = mapped_column(String(50), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reactions: Mapped[str] = mapped_column(Text, default="[]", nullable=False) # JSON 배열 e.g. ["❤️"]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # 관계 정의
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

    __table_args__ = (
        Index("idx_messages_conv", "conversation_id", "created_at"),
    )
