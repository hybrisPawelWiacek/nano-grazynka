#!/bin/bash

# Validate we're in the correct backend directory before running Prisma commands
# Prevents the backend/backend/ navigation issue

# Get current directory name and parent directory name
CURRENT_DIR=$(basename "$PWD")
PARENT_DIR=$(basename "$(dirname "$PWD")")

# Check if we're in backend/backend (wrong!)
if [ "$CURRENT_DIR" = "backend" ] && [ "$PARENT_DIR" = "backend" ]; then
    echo "❌ ERROR: You are in backend/backend/ which is WRONG!"
    echo "📁 Current path: $PWD"
    echo "✅ Navigating to correct backend directory..."
    cd ..
    echo "📁 Now in: $PWD"
fi

# Check if we're not in backend at all
if [ "$CURRENT_DIR" != "backend" ]; then
    echo "⚠️  WARNING: Not in backend directory"
    echo "📁 Current path: $PWD"
    
    # If we're in project root, navigate to backend
    if [ -d "backend" ]; then
        echo "✅ Navigating to backend directory..."
        cd backend
        echo "📁 Now in: $PWD"
    else
        echo "❌ ERROR: Cannot find backend directory!"
        echo "Please navigate to the project root or backend directory"
        exit 1
    fi
fi

# Final verification
if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
    echo "❌ ERROR: This doesn't look like the backend directory!"
    echo "Missing package.json or prisma directory"
    echo "📁 Current path: $PWD"
    exit 1
fi

echo "✅ Directory validation passed - in correct backend directory"