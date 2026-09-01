from pydantic import BaseModel
from app.models.forecast_model import ForcastModelStatus

class CreateForecastModel(BaseModel):
    tenant_id:int
    metric_id:int 
    name:str 
    model_type:str 
    entity_type:str  
    horizon:str 
    frequency:str 
    config:dict 
    status:ForcastModelStatus 
    version:str
