# FAST Project Explanation

## 1. Project Overview

**FAST** stands for **Fuel Aware Smart Travel**.

This project is a full-stack web application that helps a user choose a better driving route by comparing:

- distance
- travel time
- expected fuel consumption
- estimated fuel cost
- route type

Instead of showing only the shortest or fastest path, FAST tries to answer a more practical question:

**"Which route will save more fuel for my vehicle under current road and weather conditions?"**

The application combines:

- a **Next.js frontend**
- a **FastAPI backend**
- a **machine learning model** for fuel prediction
- a **local SQLite database** for trip history
- multiple **open map and weather services**

## 2. Main Use Case

The main use case of this project is:

> A user enters a source and destination, selects a vehicle type and mileage, and the system returns route alternatives with fuel estimates so the user can choose the most fuel-efficient trip.

This is useful for:

- daily commuters who want to reduce fuel expenses
- delivery or logistics planning
- personal travel planning
- comparing route options beyond only speed
- educational/demo purposes for intelligent transportation systems

## 3. What Problem the Project Solves

Most map applications optimize mainly for:

- shortest route
- fastest route
- live traffic convenience

FAST adds another layer:

- **fuel awareness**

Fuel usage is not decided only by distance. It also depends on:

- vehicle type
- vehicle mileage
- average speed
- stop frequency
- road type
- weather conditions such as wind, temperature, and rain

This project tries to model those factors and recommend the route that is likely to consume less fuel.

## 4. Core Technical Idea

The technical idea behind FAST is:

1. Get multiple route alternatives from a routing engine.
2. Extract route features such as distance, speed, and stop density.
3. Add environmental context using weather data.
4. Feed those values into an ML model that predicts fuel consumption.
5. Mark the most fuel-efficient route and show the estimated cost.
6. Save selected trips into a database for later history viewing.

So the app is not just displaying route data. It is doing **route intelligence plus fuel prediction**.

## 5. Current End-to-End User Flow

### Step 1: User selects locations

The user can choose source and destination in two ways:

- search using the autocomplete box
- click directly on the map

Location search uses **Nominatim** from OpenStreetMap.

Important current behavior:

- searches are limited to `countrycodes=in`, so the search is effectively focused on **India**
- the default map center is also India

### Step 2: User selects vehicle information

The user chooses:

- Bike
- Car
- SUV
- Truck

The form automatically fills a default mileage:

- Bike: 40 km/l
- Car: 15 km/l
- SUV: 10 km/l
- Truck: 5 km/l

The user can override the mileage manually.

### Step 3: Frontend sends request to backend

The frontend sends a `POST` request to:

- `/api/routes`

It includes:

- source latitude and longitude
- destination latitude and longitude
- vehicle type
- mileage in km/l

### Step 4: Backend fetches route alternatives

The backend asks **OSRM** for up to 3 route alternatives.

Current code behavior:

- it uses the **public OSRM demo server** at `https://router.project-osrm.org/route/v1/driving`

### Step 5: Backend fetches weather

The backend also fetches current weather from **Open-Meteo** using the source coordinates.

Weather values used:

- temperature
- wind speed
- precipitation

### Step 6: Backend extracts useful route features

For each route, the backend computes:

- distance in km
- duration in minutes
- average speed
- road type: `highway`, `urban`, or `mixed`
- stops per km

Road type is estimated from OSRM step names and road references using keyword matching.

### Step 7: ML prediction runs

The backend calls the trained ML model and predicts:

- fuel consumed in litres

If the ML model fails for any reason, the backend falls back to a simple formula:

- `distance / mileage`

### Step 8: Best routes are labeled

The backend marks:

- the route with the lowest predicted fuel as `is_fuel_efficient`
- the route with the smallest duration as `is_fastest`

### Step 9: Frontend displays comparison

The frontend shows:

- fuel litres
- estimated fuel cost
- distance
- duration
- road type
- average speed
- weather summary

### Step 10: User saves a trip

Only the route marked as the most fuel-efficient gets a visible save button in the UI.

The frontend sends that route to:

- `/api/save-trip`

### Step 11: History is loaded

Saved trips are shown in the **Trip History** panel using:

- `/api/history`

## 6. Project Architecture

The project follows a simple full-stack architecture:

```text
Frontend (Next.js + React)
        |
        v
Backend API (FastAPI)
        |
        +--> OSRM routing service
        +--> Open-Meteo weather API
        +--> ML prediction module
        +--> SQLite database
```

### High-level responsibilities

**Frontend**

- collects user input
- displays map and route results
- calls backend APIs
- displays trip history

**Backend**

- validates incoming data
- calls routing and weather services
- computes route features
- predicts fuel usage
- saves and returns trip history

**ML module**

- loads trained artifacts
- transforms incoming route data
- predicts fuel consumption

**Database**

- stores saved trip history

## 7. Frontend Explanation

The frontend lives in the `frontend/` folder and is built with **Next.js 14** using the App Router.

### Important frontend files

- `frontend/src/app/page.js`
- `frontend/src/components/RouteForm.js`
- `frontend/src/components/LocationSearch.js`
- `frontend/src/components/RouteResults.js`
- `frontend/src/components/TripHistory.js`
- `frontend/src/components/Map.js`

### Frontend responsibilities

#### `page.js`

This is the main screen of the app. It:

- stores source and destination state
- stores returned routes and weather
- calls the backend with Axios
- passes data into child components
- triggers history refresh after saving a trip

#### `RouteForm.js`

This file handles:

- source and destination search UI
- vehicle type selection
- mileage input
- form submission
- clear/reset action

#### `LocationSearch.js`

This component provides autocomplete search using Nominatim.

Technical details:

- debounced search with a 300 ms delay
- shows up to 5 suggestions
- stores `lat`, `lng`, and `displayName`
- restricts results to India

#### `Map.js`

This component uses **Leaflet** and **react-leaflet**.

It:

- renders the map
- places source and destination markers
- draws route polylines
- colors routes based on type
- fits the map bounds automatically
- allows location selection by clicking the map

Route colors:

- green for most fuel efficient
- blue for fastest
- gray for other alternatives

#### `RouteResults.js`

This displays route comparison cards and weather information.

It highlights:

- most fuel efficient route
- fastest route
- alternatives

It also computes the presentation of:

- time formatting
- weather card
- save button for the best route

#### `TripHistory.js`

This component:

- fetches saved history from the backend
- shows trips in a collapsible table
- calculates displayed fuel cost using a hardcoded fuel price

### Frontend configuration

The frontend currently uses:

- `jsconfig.json` for the `@/*` import alias
- Tailwind CSS for utility styling
- PostCSS and Autoprefixer for CSS processing

### Important frontend implementation note

Although the README mentions `NEXT_PUBLIC_API_URL`, the current frontend code uses a hardcoded value:

- `http://localhost:8000`

So right now the app expects the backend to be running locally on port `8000`.

## 8. Backend Explanation

The backend lives in the `backend/` folder and is built with **FastAPI**.

### Important backend files

- `backend/main.py`
- `backend/database.py`
- `backend/ml/model.py`
- `backend/ml/train.py`

There is also a duplicate file:

- `backend/app/main.py`

Current startup script usage shows that `backend/main.py` is the practical entry point because `start.sh` runs:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Backend endpoints

#### `POST /api/routes`

Purpose:

- generate route alternatives
- estimate fuel for each route

Request fields:

- `source_lat`
- `source_lng`
- `dest_lat`
- `dest_lng`
- `vehicle_type`
- `mileage_kmpl`

Response includes:

- route list
- weather
- vehicle type
- mileage

For each route, the backend returns:

- `index`
- `distance_km`
- `duration_min`
- `avg_speed_kmh`
- `fuel_litres`
- `fuel_cost_inr`
- `road_type`
- `geometry`
- `summary`
- `is_fuel_efficient`
- `is_fastest`

#### `POST /api/save-trip`

Purpose:

- save a selected trip into the local database

#### `GET /api/history`

Purpose:

- fetch up to 20 recent saved trips

#### `GET /api/health`

Purpose:

- simple service health check

### Backend route processing logic

The backend does the following for each request:

1. Calls OSRM for route alternatives.
2. Calls Open-Meteo for source-point weather.
3. Reads every route leg and step.
4. Estimates road type from street names and road references.
5. Estimates stop density from route manoeuvres.
6. Computes distance, duration, and average speed.
7. Predicts fuel litres using the ML model.
8. Computes fuel cost with a fixed price of `105 INR/litre`.
9. Returns all routes to the frontend.

### Error handling

The backend handles failures in a practical way:

- if OSRM returns a bad status, it raises an API error
- if weather fails, it falls back to default weather values
- if ML prediction fails, it falls back to `distance / mileage`

This makes the app more resilient during demos and local development.

## 9. Machine Learning Explanation

The ML system is one of the most important parts of the project.

### ML goal

Its job is to estimate:

- **how many litres of fuel a route is likely to consume**

### Input features used by the model

The trained model uses these features:

- `distance_km`
- `avg_speed_kmh`
- `vehicle_mileage_kmpl`
- `temperature_c`
- `wind_speed_kmh`
- `precipitation_mm`
- `num_stops_per_km`
- one-hot encoded `vehicle_type`
- one-hot encoded `road_type`

### Supported vehicle types

- bike
- car
- suv
- truck

### Supported road types

- highway
- urban
- mixed

### Training data

The project includes:

- `backend/ml/data/fuel_dataset.csv`
- `backend/ml/data/generate_dataset.py`

The dataset is not random dummy data. It is **synthetic but physics-informed**.

The generator uses ideas based on:

- baseline mileage
- speed efficiency curves
- cold/hot weather penalties
- wind drag effects
- rain penalties
- stop-and-go penalties

This is a strong academic/demo approach because it gives the model structured training data even when real trip telemetry is not available.

### Training pipeline

The training script:

- loads the CSV dataset
- one-hot encodes categorical variables
- splits data into train and test sets
- scales features
- trains multiple regressors
- compares performance
- saves the best model artifacts

Models trained:

- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- Voting Regressor ensemble

### Saved ML artifacts

The repo already contains trained artifacts in:

- `backend/ml/models/best_model.joblib`
- `backend/ml/models/scaler.joblib`
- `backend/ml/models/feature_names.joblib`
- `backend/ml/models/model_metadata.joblib`

### Current trained model

From the saved metadata, the selected best model is:

- **RandomForest**

Stored evaluation metrics:

- `R2`: `0.9609682745340774`
- `MAE`: `4.507150945540677`
- `RMSE`: `8.283215443116495`

Training split sizes:

- train rows: `1600`
- test rows: `400`

### Inference behavior

At runtime:

- the model is lazy-loaded only when needed
- the scaler and feature names are also loaded
- the backend builds a feature vector in the exact training order
- prediction is rounded to 3 decimal places

## 10. Database Use

This section is especially important because the repository contains **two database stories**:

- an older or planned **Supabase/PostgreSQL** design
- the current active **SQLite** implementation

### Current active database

The running backend uses:

- Python `sqlite3`
- local file: `backend/fast.db`

This is the database that is actually connected in the current code.

### Active table used by the app

The active table is:

- `trip_history`

Columns:

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | INTEGER | primary key |
| `source_name` | TEXT | optional source label |
| `dest_name` | TEXT | optional destination label |
| `source_lat` | REAL | source latitude |
| `source_lng` | REAL | source longitude |
| `dest_lat` | REAL | destination latitude |
| `dest_lng` | REAL | destination longitude |
| `vehicle_type` | TEXT | selected vehicle type |
| `mileage` | REAL | user-entered mileage |
| `distance_km` | REAL | route distance |
| `fuel_litres` | REAL | predicted fuel usage |
| `route_name` | TEXT | route summary name |
| `created_at` | TIMESTAMP | save timestamp |

### What is stored in the database

When a user saves a trip, the backend stores:

- coordinates of source and destination
- vehicle type
- mileage
- distance
- predicted fuel litres
- route summary name
- timestamp

### What the database is used for in the app

Database usage is currently simple and focused:

- `init_db()` creates the table if it does not exist
- `save_trip()` inserts a trip
- `get_trips()` returns the latest 20 saved trips

So the database is currently being used for:

- **trip history persistence**

It is not currently being used for:

- authentication
- per-user isolation
- vehicle profiles
- analytics
- route caching

### Current database state

The local `fast.db` file already exists in the repo, and it currently contains saved trip history rows. That means the app has already been run and used locally.

### Legacy or planned database design

The file `database.sql` defines a different database model using **Supabase/PostgreSQL** with these tables:

- `users`
- `vehicles`
- `trips`

That schema suggests an earlier or future architecture with:

- user accounts
- saved vehicles
- richer trip records

However, that schema is **not the database the current backend is using**.

### Practical conclusion about the database

If someone sets up the project based only on the running code, they need:

- the SQLite file and Python backend

If someone sets it up based only on `README.md` and `database.sql`, they might think Supabase is required.

So the most accurate description is:

> The current implementation uses SQLite for trip history, while Supabase/PostgreSQL appears to be an older or planned design that is still present in the repository documentation.

## 11. External Services and APIs Used

The project depends on multiple third-party or open public services.

### 1. OSRM

Used for:

- route calculation
- alternative paths
- route geometry
- route steps

Current code endpoint:

- `https://router.project-osrm.org/route/v1/driving`

### 2. Open-Meteo

Used for:

- current temperature
- wind speed
- precipitation

Endpoint used by backend:

- `https://api.open-meteo.com/v1/forecast`

### 3. Nominatim

Used for:

- location search / geocoding

Endpoint used by frontend:

- `https://nominatim.openstreetmap.org/search`

### 4. OpenStreetMap tiles

Used for:

- rendering the map background in Leaflet

## 12. Technologies Used

### Frontend technologies

- Next.js 14
- React 18
- JavaScript
- Axios
- Leaflet
- React Leaflet
- Tailwind CSS
- PostCSS
- Autoprefixer

### Backend technologies

- Python
- FastAPI
- Uvicorn
- Pydantic
- HTTPX
- SQLite via Python `sqlite3`

### Machine learning and data technologies

- scikit-learn
- pandas
- numpy
- joblib

### Map and data ecosystem

- OpenStreetMap
- OSRM
- Nominatim
- Open-Meteo

### Development tools and runtime tools

- Python virtual environment
- npm
- package-lock
- shell startup script (`start.sh`)

## 13. Folder and File Structure

```text
FAST/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── fast.db
│   ├── requirements.txt
│   ├── app/
│   │   └── main.py
│   └── ml/
│       ├── model.py
│       ├── train.py
│       ├── data/
│       │   ├── fuel_dataset.csv
│       │   └── generate_dataset.py
│       └── models/
│           ├── best_model.joblib
│           ├── scaler.joblib
│           ├── feature_names.joblib
│           └── model_metadata.joblib
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.js
│       │   ├── page.js
│       │   └── globals.css
│       └── components/
│           ├── LocationSearch.js
│           ├── Map.js
│           ├── RouteForm.js
│           ├── RouteResults.js
│           └── TripHistory.js
├── README.md
├── database.sql
├── start.sh
└── explain.md
```

## 14. How the Project Is Set Up Right Now

This section explains the **actual working setup based on the current code**.

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs on:

- `http://localhost:8000`

API docs:

- `http://localhost:8000/docs`

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:3000`

### One-command startup

The repo also has:

- `start.sh`

It starts:

- backend on port `8000`
- frontend on port `3000`

### Database setup

No manual database setup is required for the current SQLite-based version because:

- `init_db()` creates the `trip_history` table automatically if needed

### ML setup

No retraining is required for normal usage because trained model artifacts already exist in the repo.

Retraining is only needed if:

- you change the dataset
- you want a new model
- you want updated metrics

### External service setup

Current code relies on public services directly, so these do not need local installation for the app to work:

- public OSRM routing server
- Open-Meteo weather API
- Nominatim geocoding

## 15. Setup Notes from README vs Current Code

This repo has some documentation drift. These are the main differences.

### README says

- database is Supabase
- OSRM should be run locally with Docker
- backend reads environment values such as `SUPABASE_URL`, `SUPABASE_KEY`, `OSRM_BASE_URL`
- frontend can use `NEXT_PUBLIC_API_URL`
- frontend stack is described as TypeScript
- setup examples mention folders like `fast-backend` and `fast-frontend`

### Current code says

- database is SQLite in `backend/fast.db`
- OSRM base URL is hardcoded to the public demo server
- weather API is hardcoded
- frontend API base is hardcoded to `http://localhost:8000`
- there is no active environment-variable wiring in the current implementation
- the frontend source files are JavaScript files such as `page.js` and component `.js` files
- the actual project folders are `backend/` and `frontend/`

### Why this matters

A new developer should not assume the README fully matches the running code. The current application can be understood best by trusting the source code first.

## 16. Technical Strengths of the Project

This project has several good ideas:

- combines routing, weather, and ML into one product
- uses open-source map infrastructure instead of proprietary APIs
- includes a full working frontend and backend
- has graceful fallback logic
- stores trip history locally for persistence
- uses a structured ML pipeline with saved artifacts
- exposes clean API endpoints for future expansion

## 17. Current Limitations

The project works, but it also has some important current limitations.

### 1. Documentation mismatch

The docs still mention Supabase and local OSRM, while current code uses SQLite and public endpoints.

### 2. Hardcoded configuration

These values are hardcoded in source code:

- backend API URL in frontend
- OSRM base URL
- Open-Meteo base URL
- fuel price

This makes deployment and environment switching harder.

### 3. No user accounts

Although `database.sql` suggests user-based storage, the current running app stores all history in one local database without authentication.

### 4. Public service dependence

The app currently depends on public routing and geocoding services, which may have:

- rate limits
- availability issues
- demo-server limitations

### 5. Synthetic training data

The ML system is thoughtfully built, but it is still trained on generated data rather than real telemetry from vehicles.

### 6. Duplicate backend entrypoint

There are two similar backend app files:

- `backend/main.py`
- `backend/app/main.py`

That can confuse maintenance unless one becomes the clearly supported entrypoint.

## 18. Future Improvement Ideas

Natural next improvements for FAST would be:

- connect the app to environment variables instead of hardcoded URLs
- choose one database direction and remove ambiguity
- add authentication and per-user history
- support saved vehicle profiles
- self-host OSRM for better control and reliability
- add real traffic or elevation data
- train on real trip/fuel logs
- allow saving any route, not only the most fuel-efficient one
- add unit tests and API tests
- clean up duplicate backend files

## 19. Short Summary

FAST is a smart travel planning application that estimates fuel usage for multiple route options instead of showing only speed or distance.

In its current implementation, it:

- uses a **Next.js frontend**
- uses a **FastAPI backend**
- uses a **Random Forest ML model** to estimate fuel consumption
- uses **SQLite** to save recent trip history
- uses **OSRM**, **Open-Meteo**, **Nominatim**, and **OpenStreetMap**

The project idea is strong because it combines:

- route planning
- fuel awareness
- weather-aware prediction
- vehicle-specific comparison

The most important practical onboarding note is this:

> The repository documentation still references Supabase and local OSRM, but the current running application uses SQLite and public API endpoints hardcoded in the codebase.
