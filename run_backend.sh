#!/bin/bash
# Backend Run Commands

# Navigate to backend directory
cd /Users/manav/Desktop/NoirVision/backend

# Activate virtual environment
source venv/bin/activate

# Run the backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
