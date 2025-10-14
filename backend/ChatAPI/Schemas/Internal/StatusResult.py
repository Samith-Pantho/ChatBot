from pydantic import BaseModel
from typing import Optional, Generic, TypeVar

T = TypeVar('T')

class StatusResult(BaseModel, Generic[T]):
    Status: Optional[str] = "FAILED"
    Message: Optional[str] = None
    Result: Optional[T] = None