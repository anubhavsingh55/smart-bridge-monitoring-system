from datetime import datetime

from pydantic import BaseModel


class SensorReadingCreate(BaseModel):
    bridge_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    vibration: float
    strain: float
    tilt: float
    battery_level: float


class SensorReadingOut(SensorReadingCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
