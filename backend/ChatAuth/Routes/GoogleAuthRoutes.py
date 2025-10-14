import os
import traceback
from fastapi import APIRouter, Depends, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx
from Helper.Common import AddLogOrErrorInFile, CreateJwtToken, VerifyJwtToken, Logout
from Schema.shared import AuthResponse, GoogleAuthRequest, UserInfo, VerifyResponse
from dotenv import load_dotenv

load_dotenv() 

GoogleAuthRoutes = APIRouter(prefix="/GoogleAuth")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


async def _ExchangeCodeForTokens(auth_code: str):
    try:
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": auth_code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": f'{REDIRECT_URI}/Login',
            "grant_type": "authorization_code"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=payload)
            if response.status_code != 200:
                raise ValueError("Failed to exchange code for tokens")
            return response.json()
    
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        await AddLogOrErrorInFile(error_msg, "ERROR")
        raise HTTPException(status_code=401, detail=error_msg)

@GoogleAuthRoutes.post("/Login", response_model=AuthResponse)
async def Login(request: GoogleAuthRequest):
    try:
        tokens = await _ExchangeCodeForTokens(request.token)
        id_jwt_token = tokens["id_token"]

        # Verify ID token
        id_info = id_token.verify_oauth2_token(
            id_jwt_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=30
        )
        
        # Create user data
        user_data = {
            "sub": id_info["sub"],
            "email": id_info["email"],
            "name": id_info.get("name", ""),
            "picture": id_info.get("picture", "")
        }
        
        # Create JWT token
        jwt_token = await CreateJwtToken(user_data)
        return AuthResponse(
            token=jwt_token,
            user=UserInfo(
                id=id_info["sub"],
                email=id_info["email"],
                name=id_info.get("name", ""),
                picture=id_info.get("picture", "")
            )
        )
        
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        await AddLogOrErrorInFile(error_msg, "ERROR")
        raise HTTPException(status_code=401, detail="Invalid Google token")

@GoogleAuthRoutes.get("/VerifyToken", response_model=VerifyResponse)
async def VerifyToken(user: dict = Depends(VerifyJwtToken)):
    try:
        user_info = UserInfo(
            id=user.get("sub", user.get("user_id", "")),
            email=user.get("email", ""),
            name=user.get("name", user.get("given_name", "")),
            picture=user.get("picture", "")
        )
        
        return VerifyResponse(
            valid=True,
            user=user_info
        )
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        await AddLogOrErrorInFile(error_msg, "ERROR")
        raise HTTPException(status_code=401, detail="Invalid token")

@GoogleAuthRoutes.post("/Logout")
async def Logout(is_logout: bool = Depends(Logout)):
    return {"message": "Logged out successfully"}