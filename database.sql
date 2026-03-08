-- Supabase setup for FAST (Fuel Aware Smart Travel)
-- Run this in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_uid uuid UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  vehicle_type text,
  mileage_km_per_litre numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  source_lat double precision,
  source_lon double precision,
  dest_lat double precision,
  dest_lon double precision,
  distance_km numeric,
  duration_min numeric,
  predicted_fuel_l numeric,
  chosen boolean DEFAULT true,
  osrm_geometry text,
  created_at timestamptz DEFAULT now()
);
