from pydantic import BaseModel
from typing import Optional

class CreateMetrics(BaseModel):
    tenant_id:int
    name:str
    code:str 
    description:str
    unit:str 
    category:str 

class UpdateMetrics(BaseModel):
    tenant_id:Optional[int] = None
    name:Optional[str] = None
    code:Optional[str] = None
    description:Optional[str] = None
    unit:Optional[str] = None 
    category:Optional[str] = None 
    is_active:Optional[bool] = None