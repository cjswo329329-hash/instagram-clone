from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Like(Base):
    """
    좋아요 테이블 - 게시물, 릴스, 댓글 좋아요 통합 관리.

    ⚠️ SQLite UNIQUE + NULL 주의:
    SQLite에서 UNIQUE(user_id, NULL)는 여러 행을 허용합니다.
    이를 방지하기 위해 CheckConstraint로 정확히 하나의 대상만 지정되도록 강제합니다.
    """
    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    reel_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("reels.id", ondelete="CASCADE"), nullable=True)
    comment_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # 관계 정의
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")
    reel = relationship("Reel", back_populates="likes")
    comment = relationship("Comment", back_populates="likes")

    __table_args__ = (
        # 정확히 하나의 대상만 지정되도록 강제 (NULL UNIQUE 버그 방어)
        CheckConstraint(
            "(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END + "
            " CASE WHEN reel_id IS NOT NULL THEN 1 ELSE 0 END + "
            " CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="check_like_single_target"
        ),
        # 중복 좋아요 방지 (각 대상별)
        UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),
        UniqueConstraint("user_id", "reel_id", name="uq_user_reel_like"),
        UniqueConstraint("user_id", "comment_id", name="uq_user_comment_like"),
        Index("idx_likes_post", "post_id"),
        Index("idx_likes_reel", "reel_id"),
        Index("idx_likes_comment", "comment_id"),
    )
