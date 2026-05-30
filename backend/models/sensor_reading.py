from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from ..database.base import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    bridge_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    strain = Column(Float, nullable=False)
    tilt = Column(Float, nullable=False)
    battery_level = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
