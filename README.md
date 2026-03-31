# FAST (Fuel Aware Smart Travel)

FAST is a web application that helps users find the most fuel-efficient route between a source and a destination using open-source tools.

## Stack Overview
- **Database & Auth:** Supabase (PostgreSQL)
- **Routing Engine:** OSRM (Open Source Routing Machine) running via Docker using OpenStreetMap data
- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (React, TypeScript)

## Local Setup Instructions

### 1. Database (Supabase)
1. Create a [Supabase](https://supabase.com) project.
2. Go to the SQL Editor and run the contents of `database.sql`.
3. Go to Project Settings -> API and note down your `Project URL` and `anon public key`. They will be needed for the backend.

### 2. Run OSRM Locally
You need Docker installed to run OSRM. 
1. Download an OpenStreetMap `.pbf` extract for your region (e.g. `india-latest.osm.pbf`) from [Geofabrik](https://download.geofabrik.de/). Place it in an `osrm_data` directory.
2. CD into that directory and run the following commands to process the data and start OSRM:

```bash
# Extract routing graph
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf

# Partition + customize (MLD)
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/india-latest.osrm
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/india-latest.osrm

# Run OSRM HTTP server on port 5000
docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/india-latest.osrm
```

OSRM should now be running locally at `http://localhost:5000`. Test it with:
```bash
curl "http://127.0.0.1:5000/route/v1/driving/76.9553,8.5241;76.9366,8.5010?steps=true&alternatives=true"
```

### 3. Backend (FastAPI)
1. Open a terminal and navigate to `backend`.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows: .\venv\Scripts\activate
   # Mac/Linux: source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   OSRM_BASE_URL=http://localhost:5000
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000/api/plan-trip` and docs at `http://localhost:8000/docs`.

### 4. Frontend (Next.js)
1. Open a terminal and navigate to `frontend`.
2. Install frontend dependencies (if not already done via create-next-app):
   ```bash
   npm install
   ```
3. Create a `.env.local` file in `frontend` if you want to configure the API URL explicitly (default assumes backend is at `http://localhost:8000`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
