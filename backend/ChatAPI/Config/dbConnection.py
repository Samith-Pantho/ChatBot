from typing import Dict
from fastapi import WebSocket
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from contextlib import asynccontextmanager
from sqlalchemy import MetaData

meta = MetaData()

# WebSocket connections dictionary
ws_connections: Dict[str, WebSocket] = {}

CHATBOT_DB_URL = (
    f"mysql+asyncmy://{os.getenv('DB_CHATBOT_USER', 'chatbot_user')}:"
    f"{os.getenv('DB_CHATBOT_PASSWORD', 'chatbot_password')}@"
    f"{os.getenv('DB_CHATBOT_HOST', 'mysql-chatbot')}:"
    f"{os.getenv('DB_CHATBOT_PORT', '3306')}/"
    f"{os.getenv('DB_CHATBOT_NAME', 'chatbot_db')}"
    "?charset=utf8mb4"
)

async_engine_chatbot = create_async_engine(
    CHATBOT_DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)

sync_engine_chatbot = create_engine(
    CHATBOT_DB_URL.replace("+asyncmy", "+pymysql"),
    pool_pre_ping=True,
    pool_recycle=3600
)
engine = sync_engine_chatbot

# Async session makers
AsyncSessionLocalChatBot = sessionmaker(
    bind=async_engine_chatbot,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency for FastAPI routes
@asynccontextmanager
async def get_chatbot_db():
    async with AsyncSessionLocalChatBot() as session:
        try:
            yield session
        finally:
            await session.close()