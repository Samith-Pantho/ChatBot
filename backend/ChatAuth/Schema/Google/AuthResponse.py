from pydantic import BaseModel
from .UserInfo import UserInfo


class AuthResponse(BaseModel):
    token: str
    user: UserInfo