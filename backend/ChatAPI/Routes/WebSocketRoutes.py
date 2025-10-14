from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict
from Config.dbConnection import ws_connections
from Services.CommonServices import GetSha1Hash

WebSocketRoutes = APIRouter()

@WebSocketRoutes.websocket("/initialize/{user}")
async def websocket_initialization(websocket: WebSocket, user: str):
    await websocket.accept()
    ws_connections[await GetSha1Hash(user)] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_connections.pop(await GetSha1Hash(user), None)
