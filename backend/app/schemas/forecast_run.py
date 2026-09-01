from typing import Optional

from pydantic import BaseModel

class ForecastRunCompareRequest(BaseModel):
    metric_id:int
    entity_type:str
    entity_id:int
    horizon:str
    frequency:str
    model_types:Optional[list[str]] = None
    config:Optional[dict] = None

