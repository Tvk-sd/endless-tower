#!/bin/bash
# Endless Tower — dev launcher
# Double-click this file to start the app + Storybook

cd "$(dirname "$0")/app"

# Kill anything on ports 4000 and 6006
lsof -ti :4000 | xargs kill -9 2>/dev/null
lsof -ti :6006 | xargs kill -9 2>/dev/null

echo "Starting Endless Tower..."
npm run dev -- -p 4000 &

echo "Starting Storybook..."
npm run storybook &

# Wait for servers then open both in browser
sleep 5 && open http://localhost:4000 &
sleep 6 && open http://localhost:6006 &

wait
