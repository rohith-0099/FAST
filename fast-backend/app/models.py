from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Numeric, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid = Column(UUID(as_uuid=True), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String)
    vehicle_type = Column(String)
    mileage_km_per_litre = Column(Numeric)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Trip(Base):
    __tablename__ = "trips"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    source_lat = Column(Float)
    source_lon = Column(Float)
    dest_lat = Column(Float)
    dest_lon = Column(Float)
    distance_km = Column(Numeric)
    duration_min = Column(Numeric)
    predicted_fuel_l = Column(Numeric)
    chosen = Column(Boolean, default=True)
    osrm_geometry = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
