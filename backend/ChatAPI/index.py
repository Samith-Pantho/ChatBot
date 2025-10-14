import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routes.ChatRoutes import ChatRoutes
from Routes.ChatAuthRoutes import ChatAuthRoutes

from Routes.WebSocketRoutes import WebSocketRoutes

from Workers.KafkaMessageConsumer import ConsumeResponse

from Config.dbConnection import (
    async_engine_chatbot,
    sync_engine_chatbot,
    AsyncSessionLocalChatBot
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with async_engine_chatbot.connect():
        print("ChatBot database connection established")
    
    # Start background Kafka consumer
    asyncio.create_task(ConsumeResponse())
    yield

    # Shutdown
    await async_engine_chatbot.dispose()
    print("Database connections closed")

app = FastAPI(
    title="ChatBot API",
    description="Chat Bot API",
    version="1.0.0",
    lifespan=lifespan
)

# Include all routers
app.include_router(ChatAuthRoutes)
app.include_router(ChatRoutes)

app.include_router(WebSocketRoutes)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "API is running",
        "database_status": {
            "chatbot": "connected"
        }
    }