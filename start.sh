#!/bin/bash
# FAST - Fuel Aware Smart Travel
# Startup script

echo "========================================="
echo "  FAST - Fuel Aware Smart Travel"
echo "  Starting all services..."
echo "========================================="

# Start backend
echo ""
echo "[1/2] Starting FastAPI backend on port 8000..."
cd /home/rohith/FAST/backend
source /home/rohith/FAST/backend/venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
echo "[2/2] Starting Next.js frontend on port 3000..."
cd /home/rohith/FAST/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
