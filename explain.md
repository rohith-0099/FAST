# FAST Project Explanation

## 1. Project Name

**FAST** stands for **Fuel Aware Smart Travel**.

It is a route-planning web application that helps a user compare route options not only by:

- distance
- time

but also by:

- estimated fuel consumption
- estimated trip cost
- vehicle-specific efficiency
- road profile
- current route-area weather when available

The main goal of the project is to help a user choose a route that is more practical in the real world, not just shorter on a map.

---

## 2. What Problem This Project Solves

Most map apps answer questions like:

- Which route is shortest?
- Which route is fastest?

FAST tries to answer a more useful question:

- Which route is likely to consume less fuel for this specific vehicle?
- What will that trip roughly cost at today's fuel price?

This matters for:

- daily commuters
- bike and scooter riders
- car owners
- truck drivers
- bus or fleet operators
- delivery and logistics users
- users in India who care about real mileage and changing fuel prices

---

## 3. Is The Current Project Logical?

**Yes, the current product is logically structured.**

The current design is much more logical than the older synthetic-demo version because it now follows this idea:

1. Start from a real vehicle efficiency value.
2. Get real route alternatives from a routing engine.
3. Estimate whether a route behaves more like city driving, highway driving, or mixed driving.
4. Adjust the base fuel use using route conditions and live weather when available.
5. Multiply the final fuel use by the fuel price entered by the user.

That is a sensible real-world approach.

### Why it is logical now

- vehicle efficiency comes from either a real official dataset or a real manual vehicle profile
- fuel price is entered by the user instead of being fetched from a fake or stale hardcoded source
- route comparison is done separately for each returned route
- the app clearly separates **lowest fuel use** from **fastest route**
- weather is used only when live weather is available
- if live weather is unavailable, the app does **not** invent weather values

### Important honesty note

The project is **logical and explainable**, but it is still an **estimation product**, not direct vehicle telemetry.

That means:

- it is more trustworthy than fake demo logic
- but it is still not the same as reading actual live fuel consumption from the vehicle ECU or OBD device

So the correct statement is:

- **logical and practical**: yes
- **fully exact for every trip**: no

That is the honest engineering answer.

---

## 4. Current Product Philosophy

The project now follows these trust rules:

- no synthetic runtime dataset is used for route calculation
- no hardcoded mileage defaults are used for manual vehicles
- no fake live fuel price is injected into calculations
- no fake live weather is injected if weather API data is unavailable
- official structured data is used where it exists
- manual real data entry is used where structured data does not exist in a good free form

This is important because the product is intended to be useful in India, where many real users need:

- bikes
- scooters
- mopeds
- cars
- vans
- trucks
- buses
- auto rickshaws

There is not one single clean, free, structured, official India-wide catalog that covers all of those vehicle types in a form this app can automatically use.

So the product uses two honest data paths.

---

## 5. Two Vehicle Data Paths

### A. Official Catalog Path

This path uses a real free vehicle dataset stored locally at:

- `backend/data/vehicles.csv.zip`

This catalog is loaded by:

- `backend/vehicle_catalog.py`

The current dataset source is:

- FuelEconomy.gov free vehicle dataset

This path is strong for structured vehicle records such as many cars and light vehicles.

### B. Manual Real Vehicle Path

This path exists for vehicles that users actually use in India but that are not cleanly covered by one structured free catalog in this project.

Examples:

- bike
- scooter
- moped
- truck
- bus
- auto rickshaw
- custom commercial vehicle

In this path, the user enters the real vehicle details needed for calculation.

This is more honest than pretending the app knows the mileage automatically when it does not.

---

## 6. What The User Is Asked In The Current Product

### Common inputs

For every route calculation, the app needs:

- source location
- destination location
- vehicle data
- fuel price today

### Manual real vehicle mode

The manual flow now asks only the most relevant questions for calculation.

#### Required questions

- vehicle type
- vehicle name or model
- fuel type
- combined mileage in km/l
- fuel price today per litre

#### Optional advanced questions

- city mileage in km/l
- highway mileage in km/l

If city and highway mileage are not provided, the app uses the combined mileage value as the fallback for both.

### Official catalog mode

The official catalog flow asks for:

- year
- make
- model
- vehicle variant
- fuel price today per litre

The selected catalog vehicle already contains:

- city efficiency
- highway efficiency
- combined efficiency
- fuel type
- class and drivetrain metadata

---

## 7. Supported Manual Vehicle Types

The current manual vehicle type list in the frontend includes:

- Bike
- Scooter
- Moped
- Car
- Van
- Truck
- Bus
- Auto Rickshaw
- Custom

### Current manual fuel-type support

The current manual vehicle flow supports litre-based fuels only:

- Petrol
- Diesel

This is because the current cost calculation is based on **price per litre**.

That means the current runtime product does **not yet** support manual:

- CNG price per kg
- LPG pricing rules
- EV charging cost per kWh

Those can be added later, but they are not part of the current calculation path.

---

## 8. End-To-End User Flow

### Step 1: User selects source and destination

The user can:

- search using OpenStreetMap Nominatim
- click on the map

### Step 2: User selects vehicle source mode

The user chooses one of:

- `Manual Real Vehicle`
- `Free Official Catalog`

### Step 3: User provides vehicle data

In manual mode, the user enters real mileage.

In official mode, the user chooses a real record from the free catalog.

### Step 4: User enters today's fuel price

Fuel price is currently user-entered because it changes:

- by day
- by location
- by fuel type

This is better than pretending the app has a free perfect live fuel-price API for all users.

### Step 5: Frontend sends request to backend

The frontend sends a request to:

- `POST /api/routes`

The request contains:

- source coordinates
- destination coordinates
- selected vehicle source
- either a `vehicle_id` or a `manual_vehicle` object
- fuel price per litre

### Step 6: Backend fetches route alternatives

The backend calls OSRM and asks for:

- full route geometry
- step-by-step route instructions
- up to 3 route alternatives

### Step 7: Backend fetches live weather

The backend requests current weather from Open-Meteo using the source coordinates.

Weather fields currently used are:

- temperature
- wind speed
- precipitation

### Step 8: Backend analyzes each route

For each returned route, the backend calculates:

- total distance
- total duration
- average speed
- route step list
- road profile shares
- stop density

### Step 9: Backend estimates fuel for each route

The backend uses the selected vehicle efficiency and route conditions to estimate:

- fuel used in litres
- trip cost
- effective route efficiency
- adjustment factor

### Step 10: Backend marks the best routes

The backend marks:

- the route with the lowest estimated fuel use
- the route with the lowest duration

### Step 11: Frontend displays the results

The frontend shows:

- all available routes
- fuel litres
- cost
- road type
- effective route efficiency
- weather information
- selected vehicle information
- whether the route is the lowest-fuel route or the fastest route

### Step 12: User can save the best route

The current UI provides a save button on the route marked as the lowest-fuel route.

Saved trip data is written into SQLite.

---

## 9. Exact Fuel Calculation Logic

This is the most important section.

The app does **not** simply do:

- `fuel = distance / mileage`

That would be too simplistic for route comparison.

Instead, the app does a more realistic version of that idea.

### 9.1 Base efficiency inputs

Every selected vehicle record used by the estimator contains:

- `city_kmpl`
- `highway_kmpl`
- `combined_kmpl`

For manual vehicles:

- `combined_kmpl` is required
- `city_kmpl` is optional
- `highway_kmpl` is optional
- if city or highway are missing, they fall back to `combined_kmpl`

### 9.2 Why km/l is converted

The user naturally understands mileage in:

- km/l

But blending city and highway behavior is easier if fuel use is expressed in:

- litres per 100 km

So the estimator converts km/l into litres per 100 km.

### 9.3 Conversion formula

The formula used is:

```text
litres_per_100km = 100 / kmpl
```

Example:

```text
20 km/l  ->  5.0 L/100km
10 km/l  ->  10.0 L/100km
```

This is important because a weighted blend of fuel consumption works better in L/100km than directly in km/l.

### 9.4 Route profile blending

The backend estimates how much of a route looks like:

- urban driving
- highway driving
- unclassified or mixed driving

Then it blends the vehicle's efficiency values.

The base blended fuel consumption is:

```text
base_l_per_100km =
    city_share * city_l_per_100km
  + highway_share * highway_l_per_100km
  + neutral_share * combined_l_per_100km
```

Where:

```text
neutral_share = 1 - city_share - highway_share
```

If the route cannot be classified from step names, the estimator falls back to the combined efficiency.

### 9.5 Adjustment factors

After the base blended fuel consumption is found, the backend applies adjustment factors.

Current adjustment sources:

- temperature
- wind
- rain
- average speed
- stop density

Each factor increases fuel use when conditions are less efficient.

#### Temperature factor

- below 10°C: penalty increases up to 12%
- above 30°C: penalty increases up to 6%
- between 10°C and 30°C: no temperature penalty

#### Wind factor

- higher wind speed increases fuel use
- current cap is 10%

#### Rain factor

- more precipitation slightly increases fuel use
- current cap is 5%

#### Speed factor

- very low average speed increases fuel use because of slow urban movement
- very high average speed also increases fuel use
- middle speeds are treated as neutral

#### Stop factor

- more stops per km increases fuel use
- current stop penalty begins above 2 stops per km
- current cap is 12%

### 9.6 Final combined adjustment factor

The estimator multiplies all factors together:

```text
adjustment_factor =
    temperature_factor
  * wind_factor
  * rain_factor
  * speed_factor
  * stop_factor
```

### 9.7 Final route fuel consumption

Then the route fuel consumption is calculated:

```text
effective_l_per_100km = base_l_per_100km * adjustment_factor
```

Then total fuel for the trip is:

```text
fuel_litres = distance_km * effective_l_per_100km / 100
```

### 9.8 Effective route mileage shown to the user

The app also converts the final result back into a route-specific mileage view:

```text
effective_kmpl = distance_km / fuel_litres
```

This is the route-adjusted mileage shown in the result card.

### 9.9 Fuel cost formula

Trip cost is then calculated using the user-entered fuel price:

```text
fuel_cost = fuel_litres * fuel_price_per_litre
```

### 9.10 What happens if live weather is unavailable

The current product does **not** inject fake weather anymore.

If the weather API is unavailable:

- temperature is left unavailable
- wind is left unavailable
- precipitation is left unavailable
- weather factor becomes neutral instead of fake

So the estimator still works, but it behaves like:

- route adjustment + vehicle efficiency
- without a weather penalty or bonus

That is more honest than inventing weather values.

---

## 10. How Routes Are Understood Internally

The backend gets route alternatives from OSRM with step data.

Each route contains multiple steps, and the backend reads those steps to estimate route behavior.

### 10.1 Distance

Distance comes from the route engine and is converted from metres to kilometres.

### 10.2 Duration

Duration comes from the route engine and is converted from seconds to minutes.

### 10.3 Average speed

Average speed is derived as:

```text
avg_speed_kmh = distance_km / (duration_min / 60)
```

### 10.4 Road profile classification

The backend looks at route step names and references.

It checks for highway-style keywords such as:

- highway
- expressway
- motorway
- NH
- national highway
- freeway
- interstate

It also checks for urban-style keywords such as:

- street
- road
- avenue
- lane
- boulevard
- marg
- nagar

From those matches, it calculates:

- `highway_share`
- `urban_share`
- `unclassified_share`

Then it chooses a summary `road_type`:

- `highway` if highway share is at least 0.5
- `urban` if urban share is at least 0.5
- `mixed` otherwise

### Important note about this logic

This road-type detection is **heuristic**, not perfect ground truth.

That means:

- it is a reasonable practical inference
- but it is not the same as having a complete official per-segment road classification for every route step

### 10.5 Stop density

The backend estimates stop density from route manoeuvres:

```text
stops_per_km = max(number_of_steps - 2, 0) / distance_km
```

This is used as a simple stop-and-go traffic signal.

Again, this is an inference, not direct traffic telemetry.

---

## 11. How The Best Routes Are Picked

This is another important section.

The app does **not** assume the shortest route is always the cheapest route.

Instead, each returned route alternative is estimated independently.

After the backend finishes estimating all routes, it compares them.

### 11.1 Lowest fuel route

The backend finds:

```text
route with minimum fuel_litres
```

That route is marked:

- `is_fuel_efficient = true`

In the UI, this appears as:

- **Lowest Fuel Use**

### 11.2 Fastest route

The backend also finds:

```text
route with minimum duration_min
```

That route is marked:

- `is_fastest = true`

In the UI, this appears as:

- **Fastest**

### 11.3 Alternative routes

Any other routes are shown as:

- **Alternative**

### 11.4 Can one route be both?

Yes.

If one route has both:

- the smallest fuel estimate
- the shortest duration

then the same route is both the fastest and the most fuel-efficient route.

In the current UI, the visible badge priority favors:

- `Lowest Fuel Use`

because that badge check is evaluated first.

The map coloring also prioritizes the fuel-efficient highlighting.

---

## 12. Why This Route Choice Logic Makes Sense

This route-picking logic is practical because:

- the fastest route is not always the cheapest
- the shortest route is not always the most fuel-efficient
- city-heavy roads can use more fuel than smoother highway routes
- stop-and-go movement can change fuel consumption a lot

So the app correctly treats route selection as a **comparison problem**, not as a one-rule problem.

---

## 13. Frontend Architecture

The frontend lives in:

- `frontend/`

It is a Next.js application.

### Main frontend files

- `frontend/src/app/page.js`
- `frontend/src/components/RouteForm.js`
- `frontend/src/components/RouteResults.js`
- `frontend/src/components/TripHistory.js`
- `frontend/src/components/Map.js`
- `frontend/src/components/LocationSearch.js`
- `frontend/src/lib/api.js`

### Frontend responsibilities

#### `page.js`

This is the main page controller.

It:

- stores selected source and destination
- stores the returned routes
- stores weather data
- stores the selected vehicle record
- sends `POST /api/routes`
- sends `POST /api/save-trip`
- refreshes history after a save

#### `RouteForm.js`

This is the main user-input component.

It:

- supports both manual profile mode and official catalog mode
- loads official vehicle years, makes, models, and variants from backend APIs
- asks only the relevant manual-vehicle questions by default
- makes city/highway mileage optional inside advanced details
- requires user-entered fuel price

#### `RouteResults.js`

This displays:

- selected vehicle record used for the estimate
- fuel price used
- weather data
- route comparison cards
- litres and cost
- road type
- effective route mileage
- route labels such as lowest fuel use or fastest

#### `TripHistory.js`

This displays saved trip history from SQLite.

It shows:

- date
- vehicle label
- fuel type
- vehicle data source
- route summary
- distance
- fuel litres
- fuel price used
- estimated cost

#### `LocationSearch.js`

This component uses:

- OpenStreetMap Nominatim

It is no longer restricted to India-only search.

#### `Map.js`

This uses:

- Leaflet
- React Leaflet

It:

- shows source and destination markers
- draws all route alternatives
- highlights the lowest-fuel route
- highlights the fastest route
- defaults to a world map view when no source is selected

---

## 14. Backend Architecture

The backend lives in:

- `backend/`

It is a FastAPI application.

### Main backend files

- `backend/main.py`
- `backend/app/main.py`
- `backend/database.py`
- `backend/vehicle_catalog.py`
- `backend/fuel_estimator.py`
- `backend/data/vehicles.csv.zip`
- `backend/data/update_vehicle_dataset.py`

### Backend responsibilities

#### `main.py`

This is the active backend entrypoint.

It handles:

- request validation using Pydantic
- vehicle resolution
- route fetching from OSRM
- weather fetching from Open-Meteo
- route analysis
- fuel estimation
- route ranking
- save-trip API
- history API
- health API

#### `app/main.py`

This currently mirrors the backend entrypoint so the app can also run from that path if needed.

#### `vehicle_catalog.py`

This file:

- loads the official free vehicle dataset from the zip file
- filters supported fuel types
- converts MPG to km/l
- builds catalog indexes for year, make, model, and variant
- returns the selected official vehicle record by id

The current supported primary fuels in the official catalog path are:

- Regular Gasoline
- Premium Gasoline
- Midgrade Gasoline
- Diesel

Vehicles with a secondary fuel are filtered out in the current runtime logic.

#### `fuel_estimator.py`

This file contains the transparent estimation logic.

It performs:

- km/l to L/100km conversion
- city/highway/combined blending
- weather factor application when weather data exists
- speed factor application
- stop-density factor application
- final litre and cost calculation

#### `database.py`

This file manages SQLite.

It:

- creates the trip-history table if needed
- adds missing columns when the schema evolves
- saves trip rows
- fetches recent trip rows

---

## 15. Current Backend APIs

### `GET /api/vehicles/years`

Returns the list of years available in the official vehicle catalog.

### `GET /api/vehicles/makes?year=...`

Returns available makes for the selected year.

### `GET /api/vehicles/models?year=...&make=...`

Returns available models for the selected year and make.

### `GET /api/vehicles/options?year=...&make=...&model=...`

Returns the matching vehicle variants from the official catalog.

### `POST /api/routes`

This is the main calculation API.

It accepts:

- source latitude and longitude
- destination latitude and longitude
- vehicle source type
- selected official `vehicle_id` or `manual_vehicle` profile
- fuel price per litre

It returns:

- route list
- route geometry
- selected vehicle record used for estimation
- weather object
- fuel price used
- pricing note

### `POST /api/save-trip`

Stores a selected route estimate in SQLite.

### `GET /api/history`

Returns recent saved trips.

### `GET /api/health`

Returns:

- service status
- catalog summary
- current estimation mode summary

---

## 16. Database Use

The active runtime database is:

- SQLite
- file: `backend/fast.db`

### Active table

- `trip_history`

### What is stored in trip history

The database stores:

- source name
- destination name
- source latitude and longitude
- destination latitude and longitude
- vehicle type
- mileage
- distance in km
- estimated fuel litres
- route summary name
- vehicle id
- vehicle label
- vehicle year
- vehicle make
- vehicle model
- fuel type
- city km/l
- highway km/l
- combined km/l
- fuel price per litre used in that calculation
- estimated trip cost
- estimation method text
- vehicle data source
- source note
- creation timestamp

### What the database is currently used for

- trip history persistence

### What the database is not currently used for

- user accounts
- authentication
- multi-user access control
- admin panel
- cloud sync

### Important legacy note

There is also a file in the repo named:

- `database.sql`

That file reflects an older database direction and is **not** the active runtime database for the current product.

The active runtime database is SQLite in `backend/fast.db`.

---

## 17. Technologies Used

### Frontend

- Next.js 14
- React 18
- Axios
- Tailwind CSS
- Leaflet
- React Leaflet

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- HTTPX
- SQLite

### Free external data/services

- OSRM for routing
- Open-Meteo for weather
- OpenStreetMap Nominatim for geocoding/search
- FuelEconomy.gov dataset for the structured official vehicle catalog

### Development and runtime approach

- free/open public services where practical
- local SQLite database for persistence
- no paid proprietary map dependency in the current implementation
- no paid fuel-price API dependency in the current implementation

---

## 18. Real Data Sources Used In The Current Product

### Routing

- OSRM public routing service
- backend URL: `https://router.project-osrm.org/route/v1/driving`

### Weather

- Open-Meteo
- backend URL: `https://api.open-meteo.com/v1/forecast`

### Geocoding and place search

- OpenStreetMap Nominatim
- frontend URL: `https://nominatim.openstreetmap.org/search`

### Official vehicle catalog

- FuelEconomy.gov downloadable vehicle dataset
- dataset refresh URL: `https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip`

---

## 19. What Has Been Removed From The Active Runtime Logic

Earlier project iterations included synthetic-data and ML experiment files such as the material inside:

- `backend/ml/`

Those files still exist in the repository for historical or experimental purposes.

But the current runtime product does **not** depend on them for route calculation.

The active route-estimation path is now:

- real official vehicle catalog data when available
- real manual vehicle profile data when needed
- formula-based transparent route adjustment

So the synthetic dataset is no longer the active source of truth for runtime estimation.

---

## 20. Setup And How The Project Is Run

### Backend setup

From the project root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend requirements currently come from:

- `backend/requirements.txt`

Current backend Python dependencies are:

- fastapi
- uvicorn[standard]
- httpx
- pydantic

### Frontend setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend dependencies currently come from:

- `frontend/package.json`

Main frontend dependencies are:

- next
- react
- react-dom
- leaflet
- react-leaflet
- axios
- tailwindcss
- postcss
- autoprefixer

### Combined startup script

The repository also includes:

- `start.sh`

It starts:

- backend on port 8000
- frontend on port 3000

It also prints:

- frontend URL
- backend URL
- FastAPI docs URL

### Dataset requirement

For the official catalog flow, the following file must be present:

- `backend/data/vehicles.csv.zip`

The project also includes a helper script to refresh that dataset:

- `backend/data/update_vehicle_dataset.py`

---

## 21. What Makes The Current Product Trustworthy Compared To The Old Version

The current product is more trustworthy because:

- it no longer relies on synthetic runtime data
- it no longer assigns hardcoded mileage defaults to user vehicle categories
- it requires the user to enter fuel price instead of assuming it
- it does not fake weather when weather data is missing
- it uses route-by-route estimation instead of one generic number
- it clearly shows the vehicle record used for the estimate
- it stores the vehicle source and price used in history

---

## 22. Current Limitations

This project is much stronger now, but it still has real limitations.

### Vehicle data limitations

- there is no single structured free India-wide official vehicle dataset in this project for all bikes, scooters, buses, trucks, and auto-rickshaws
- manual profile accuracy depends on the user's entered mileage
- the official catalog path is strongest for passenger/light vehicles

### Routing limitations

- the current routing service is OSRM public routing
- the current mode used is driving
- route quality depends on the public routing service response

### Weather limitations

- current weather is fetched from the source point, not along the full route
- if live weather is unavailable, weather effects are neutral instead of route-specific

### Estimation limitations

- road type is inferred from route-step keywords, which is heuristic
- stop density is estimated from manoeuvre count, not from live traffic telemetry
- the product does not yet read real-time vehicle telemetry or OBD data

### Fuel-type limitations

- manual profile mode currently supports only petrol and diesel
- CNG, LPG, and EV pricing models are not yet implemented in the active route calculator

---

## 23. Final Summary

FAST is now a much more real and logical product than the earlier synthetic-demo version.

Its current logic is:

1. get a real vehicle efficiency record
2. get real route alternatives
3. estimate route behavior from distance, duration, steps, road profile, and stop density
4. apply live weather adjustments when available
5. calculate litres used from mileage and route conditions
6. calculate cost using the user's entered fuel price
7. mark the lowest-fuel route and the fastest route separately
8. save results in SQLite for history

That means the project is now based on:

- real data where available
- manual real input where structured data is not available
- transparent formulas
- explainable route ranking
- free tools and services

This makes the product suitable as a serious prototype and a strong practical base for a real-world fuel-aware route planner.
