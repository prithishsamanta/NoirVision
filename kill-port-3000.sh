#!/bin/bash
# Kill process using port 3000

echo "Finding process using port 3000..."

if command -v lsof > /dev/null; then
    PID=$(lsof -ti :3000)
    if [ ! -z "$PID" ]; then
        echo "Found process: $PID"
        echo "Killing process..."
        kill -9 $PID
        echo "Port 3000 is now free"
    else
        echo "No process found using port 3000"
    fi
else
    echo "lsof not available. Please install it or manually find the process."
fi
