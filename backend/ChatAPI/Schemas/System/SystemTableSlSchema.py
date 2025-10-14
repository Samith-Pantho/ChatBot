from pydantic import BaseModel, Field
from typing import Optional

class SystemTableSlSchema(BaseModel):
    table_nm: str = Field(..., alias="TABLE_NM")
    table_sl: int = Field(1, alias="TABLE_SL")

    class Config:
        populate_by_name = True
