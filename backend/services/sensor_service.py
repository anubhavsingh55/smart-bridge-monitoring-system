from sqlalchemy.orm import Session

from models.sensor_reading import SensorReading
from schemas.sensor import SensorReadingCreate


def create_sensor_reading(db: Session, payload: SensorReadingCreate) -> SensorReading:
    reading = SensorReading(**payload.model_dump())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def get_latest_sensor_readings(db: Session) -> list[SensorReading]:
    return (
        db.query(SensorReading)
        .order_by(SensorReading.id.desc())
        .limit(20)
        .all()
    )
