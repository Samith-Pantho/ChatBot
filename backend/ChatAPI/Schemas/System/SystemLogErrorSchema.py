from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SystemLogErrorSchema(BaseModel):
    Msg: Optional[str]
    Type: Optional[str]
    ModuleName: Optional[str]
    CreatedBy: Optional[str]

    class Config:
        from_attributes = True  # Required to convert SQLAlchemy model -> Pydantic schema
