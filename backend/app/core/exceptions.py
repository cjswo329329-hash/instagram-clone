from fastapi import HTTPException, status

class CredentialsException(HTTPException):
    def __init__(self, detail: str = "자격 증명을 확인할 수 없습니다."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "요청한 리소스를 찾을 수 없습니다."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "해당 작업을 수행할 권한이 없습니다."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class BadRequestException(HTTPException):
    def __init__(self, detail: str = "잘못된 요청입니다."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
