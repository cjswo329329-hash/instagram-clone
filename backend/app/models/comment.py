from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    reel_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("reels.id", ondelete="CASCADE"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # 관계 정의
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    reel = relationship("Reel", back_populates="comments")
    likes = relationship("Like", back_populates="comment", cascade="all, delete-orphan")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("post_id IS NOT NULL OR reel_id IS NOT NULL", name="check_comment_target"),
        Index("idx_comments_post", "post_id", "created_at"),
        Index("idx_comments_reel", "reel_id", "created_at"),
    )
