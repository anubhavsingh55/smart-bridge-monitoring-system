from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.config import get_db
from schemas.sensor import SensorReadingCreate, SensorReadingOut
from services.sensor_service import create_sensor_reading, get_latest_sensor_readings
from websocket.connection_manager import manager

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


@router.post(
    "/readings",
    response_model=SensorReadingOut,
    status_code=status.HTTP_201_CREATED
)
async def create_reading(
    payload: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    reading = create_sensor_reading(db, payload)

    await manager.broadcast({
        "bridge_id": reading.bridge_id,
        "timestamp": str(reading.timestamp),
        "temperature": reading.temperature,
        "humidity": reading.humidity,
        "vibration": reading.vibration,
        "strain": reading.strain,
        "tilt": reading.tilt,
        "battery_level": reading.battery_level
    })

    return reading


@router.get("/readings/latest", response_model=list[SensorReadingOut])
def get_latest_readings(db: Session = Depends(get_db)):
    return get_latest_sensor_readings(db)