from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.password_reset import PasswordResetCode
from app.schemas.auth import (
    TokenResponse,
    TokenRefreshRequest,
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
)
from app.schemas.user import UserCreate, UserSimple
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 등록된 아이디 또는 이메일입니다.")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        profile_image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        is_private=False,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserSimple.from_orm(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    identifier = login_data.username_or_email or login_data.username or login_data.email
    if not identifier:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="아이디 또는 이메일을 입력해주세요.")
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    if user.is_banned:
        reason = user.ban_reason or "운영원칙 위반으로 이용이 제한되었습니다."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"계정이 정지되었습니다. 사유: {reason}"
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserSimple.from_orm(user)
    )

@router.post("/refresh")
def refresh_token(req: TokenRefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 리프레시 토큰입니다.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 리프레시 토큰입니다.")
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰 형식입니다.")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    new_access_token = create_access_token(user.id)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSimple)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.old_password or not req.old_password.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이전 비밀번호를 입력해주세요.")

    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이전 비밀번호가 일치하지 않습니다.")

    new_pwd = req.new_password.strip() if req.new_password else ""
    if len(new_pwd) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="새 비밀번호는 6자 이상이어야 합니다.")

    if verify_password(new_pwd, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="새 비밀번호는 이전 비밀번호와 달라야 합니다.")

    current_user.hashed_password = get_password_hash(new_pwd)
    db.commit()
    return {"message": "비밀번호가 성공적으로 변경되었습니다.", "success": True}

def mask_email(email: str) -> str:
    if "@" not in email:
        return email
    username_part, domain = email.split("@", 1)
    if len(username_part) <= 2:
        masked_username = username_part[0] + "*"
    else:
        masked_username = username_part[:2] + "*" * (len(username_part) - 2)
    return f"{masked_username}@{domain}"

@router.post("/password/reset-request")
def request_password_reset(
    req: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    identifier = req.username_or_email
    if not identifier or not identifier.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자 이름 또는 이메일을 입력해주세요."
        )
    identifier = identifier.strip()

    user = db.query(User).filter(
        (func.lower(User.username) == identifier.lower()) |
        (func.lower(User.email) == identifier.lower())
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자 이름 또는 이메일로 가입된 계정을 찾을 수 없습니다."
        )

    code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # 기존 미사용 코드 만료 처리
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.is_used == False
    ).update({"is_used": True})

    reset_entry = PasswordResetCode(
        user_id=user.id,
        email=user.email,
        code=code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_entry)
    db.commit()

    masked = mask_email(user.email)
    print(f"[AUTH] Password reset code for {user.username} ({user.email}): {code}")

    return {
        "success": True,
        "message": f"등록된 이메일({masked})로 인증 코드가 발송되었습니다.",
        "username": user.username,
        "masked_email": masked,
        "dev_code": code  # 개발/테스트 환경에서 즉시 확인 및 자동입력 가능하도록 제공
    }

@router.post("/password/reset-confirm")
def confirm_password_reset(
    req: PasswordResetConfirmRequest,
    db: Session = Depends(get_db)
):
    identifier = req.username_or_email
    if not identifier or not identifier.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자 이름 또는 이메일을 입력해주세요."
        )
    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드를 입력해주세요."
        )
    new_pwd = req.new_password.strip() if req.new_password else ""
    if len(new_pwd) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="새 비밀번호는 6자 이상이어야 합니다."
        )

    identifier = identifier.strip()
    code = req.code.strip()

    user = db.query(User).filter(
        (func.lower(User.username) == identifier.lower()) |
        (func.lower(User.email) == identifier.lower())
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    reset_code = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.code == code,
        PasswordResetCode.is_used == False
    ).order_by(PasswordResetCode.id.desc()).first()

    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 올바르지 않거나 이미 사용되었습니다."
        )

    if datetime.utcnow() > reset_code.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드 유효시간(10분)이 만료되었습니다. 다시 요청해주세요."
        )

    user.hashed_password = get_password_hash(new_pwd)
    reset_code.is_used = True
    db.commit()

    return {
        "success": True,
        "message": "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요."
    }
