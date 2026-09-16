from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.reel import Reel
from app.models.comment import Comment
from app.models.report import Report
from app.schemas.admin import ReportCreateRequest

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_report(
    req: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물, 릴스, 사용자, 댓글에 대한 유해 콘텐츠 신고 접수
    """
    # 1. 대상 콘텐츠 존재 여부 검증
    target_author_id = None
    if req.target_type == "post":
        post = db.query(Post).filter(Post.id == req.target_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="신고 대상 게시물을 찾을 수 없습니다.")
        target_author_id = post.user_id
    elif req.target_type == "reel":
        reel = db.query(Reel).filter(Reel.id == req.target_id).first()
        if not reel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="신고 대상 릴스를 찾을 수 없습니다.")
        target_author_id = reel.user_id
    elif req.target_type == "user":
        target_u = db.query(User).filter(User.id == req.target_id).first()
        if not target_u:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="신고 대상 사용자를 찾을 수 없습니다.")
        if target_u.id == current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="본인 계정은 신고할 수 없습니다.")
        target_author_id = target_u.id
    elif req.target_type == "comment":
        comment = db.query(Comment).filter(Comment.id == req.target_id).first()
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="신고 대상 댓글을 찾을 수 없습니다.")
        target_author_id = comment.user_id

    # 2. 동일 대상에 대해 본인이 이미 접수한 미처리(pending) 신고가 있는지 확인 (중복 방지)
    existing = db.query(Report).filter(
        Report.reporter_id == current_user.id,
        Report.target_type == req.target_type,
        Report.target_id == req.target_id,
        Report.status == "pending"
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 동일한 대상에 대해 접수된 신고가 처리 대기 중입니다."
        )

    # 3. 신고 등록
    report = Report(
        reporter_id=current_user.id,
        target_type=req.target_type,
        target_id=req.target_id,
        reason_category=req.reason_category,
        description=req.description.strip() if req.description else None,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "신고가 정상적으로 접수되었습니다. 운영팀 검토 후 조치됩니다.",
        "report_id": report.id
    }
