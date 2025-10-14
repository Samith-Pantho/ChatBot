from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routes.GoogleAuthRoutes import GoogleAuthRoutes

app = FastAPI()

# Include all routers
app.include_router(GoogleAuthRoutes)


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
        "status": "API is running"
    }