import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()

CHAT_AUTH_URL = "http://chatauth:1001"

async def _VerifyTokenWithAuthService(token: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{CHAT_AUTH_URL}/GoogleAuth/VerifyToken",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except httpx.RequestError:
            return None

async def GetCurrentUser(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user_data = await _VerifyTokenWithAuthService(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user_data["valid"] == True:
        return user_data["user"]
    else:
        return None