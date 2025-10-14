from typing import Optional
from pydantic import BaseModel

from .UserInfo import UserInfo


class VerifyResponse(BaseModel):
    valid: bool
    user: Optional[UserInfo] = None