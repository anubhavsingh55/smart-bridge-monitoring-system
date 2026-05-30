from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database.config import get_db
from ..schemas.sensor import SensorReadingCreate, SensorReadingOut
from ..services.sensor_service import create_sensor_reading, get_latest_sensor_readings

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


@router.post("/readings", response_model=SensorReadingOut, status_code=status.HTTP_201_CREATED)
def create_reading(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    return create_sensor_reading(db, payload)


@router.get("/readings/latest", response_model=list[SensorReadingOut])
def get_latest_readings(db: Session = Depends(get_db)):
    return get_latest_sensor_readings(db)
