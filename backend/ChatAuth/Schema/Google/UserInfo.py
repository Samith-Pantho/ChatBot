from typing import Optional
from pydantic import BaseModel


class UserInfo(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None