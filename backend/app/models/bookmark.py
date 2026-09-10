from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Bookmark(Base):
    """
    북마크(저장됨) 테이블 - 게시물, 릴스 북마크 통합 관리.

    ⚠️ SQLite UNIQUE + NULL 주의:
    SQLite에서 UNIQUE(user_id, NULL)는 여러 행을 허용합니다.
    이를 방지하기 위해 CheckConstraint로 정확히 하나의 대상만 지정되도록 강제합니다.
    """
    __tablename__ = "bookmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    reel_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("reels.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # 관계 정의
    user = relationship("User", back_populates="bookmarks")
    post = relationship("Post", back_populates="bookmarks")
    reel = relationship("Reel", back_populates="bookmarks")

    __table_args__ = (
        # 정확히 하나의 대상만 지정되도록 강제 (NULL UNIQUE 버그 방어)
        CheckConstraint(
            "(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END + "
            " CASE WHEN reel_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="check_bookmark_single_target"
        ),
        # 중복 북마크 방지 (각 대상별)
        UniqueConstraint("user_id", "post_id", name="uq_user_post_bookmark"),
        UniqueConstraint("user_id", "reel_id", name="uq_user_reel_bookmark"),
        Index("idx_bookmarks_user", "user_id", "created_at"),
    )
