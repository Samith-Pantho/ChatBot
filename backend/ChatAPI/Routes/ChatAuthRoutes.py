from datetime import datetime
import traceback
from fastapi import APIRouter, HTTPException, Request
import httpx
from Schemas.shared import SystemLogErrorSchema, StatusResult, GoogleAuthRequest
from Services.CommonServices import GetErrorMessage
from Services.LogServices import AddLogOrError

CHAT_AUTH_URL = "http://chatauth:1001"

ChatAuthRoutes = APIRouter(prefix="/Auth")

@ChatAuthRoutes.post("/login")
async def login(request: GoogleAuthRequest):
    status = StatusResult()
    try:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{CHAT_AUTH_URL}/GoogleAuth/Login",
                    json={"token": request.token}
                )
                if response.status_code == 200:
                    result = response.json()
                    status.Status = "OK"
                    status.Message = None
                    status.Result = result
                else:
                    raise ValueError("Authentication failed")
            except httpx.RequestError:
                raise ValueError("Authentication service unavailable")
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="ChatAuthRoutes/login",
            CreatedBy=""
        ))
        status.Status = "FAILED"
        status.Message = await GetErrorMessage(ex)
    return status

@ChatAuthRoutes.post("/logout")
async def logout(request:Request):
    status = StatusResult()
    try:
        async with httpx.AsyncClient() as client:
            try:
                token = request.headers.get("Authorization")
                if token:
                    response = await client.post(
                        f"{CHAT_AUTH_URL}/GoogleAuth/Logout",
                        headers={"Authorization": token}
                    )
                    result = response.json()
                status.Status = "OK"
                status.Message = None
                status.Result = None
            except httpx.RequestError:
                raise ValueError("Authentication service unavailable")
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="ChatAuthRoutes/logout",
            CreatedBy=""
        ))
        status.Status = "FAILED"
        status.Message = await GetErrorMessage(ex)
    return status
            