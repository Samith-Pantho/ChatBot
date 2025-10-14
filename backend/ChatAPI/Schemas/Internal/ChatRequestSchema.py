from pydantic import BaseModel

class ChatRequestSchema(BaseModel):
    message: str
