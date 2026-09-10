from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, computed_field

T = TypeVar("T")

class ErrorResponse(BaseModel):
    status_code: int
    error: str
    message: str
    detail: Optional[str] = None

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    next_cursor: Optional[int] = None
    has_more: bool

    @computed_field
    @property
    def nextCursor(self) -> Optional[int]:
        return self.next_cursor

    @computed_field
    @property
    def hasMore(self) -> bool:
        return self.has_more
