from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CustomerChatMessageSchema(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    user: Optional[str] = Field(None, alias="USER") 
    message: Optional[str] = Field(..., alias="MESSAGE")
    created_at: Optional[datetime] = Field(default_factory=datetime.now, alias="CREATED_AT")
    is_bot: Optional[bool] = Field(False, alias="IS_BOT")
    response_to: Optional[int] = Field(None, alias="RESPONSE_TO") 

    class Config:
        populate_by_name = True
        from_attributes = True
