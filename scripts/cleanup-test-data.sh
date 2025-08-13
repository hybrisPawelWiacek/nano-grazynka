#!/bin/bash

echo "🧹 Cleaning up test data..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Clean uploads older than 7 days
echo "  Removing uploads older than 7 days..."
find data/uploads/ -type f -mtime +7 -delete 2>/dev/null

# Alternative: Keep only last 10 files
# cd data/uploads/ && ls -1t | tail -n +11 | xargs rm -f

# Clean old database WAL files
echo "  Cleaning old database WAL files..."
find data/ -name "*.db-wal" -mtime +1 -delete 2>/dev/null
find backend/prisma/data/ -name "*.db-wal" -mtime +1 -delete 2>/dev/null

# Remove test results older than 30 days
echo "  Removing old test results..."
find tests/test-results/ -type f -mtime +30 -delete 2>/dev/null

# Clean up debug archive if it gets too large (optional)
DEBUG_ARCHIVE_SIZE=$(du -sm tests/debug-archive 2>/dev/null | cut -f1)
if [ "$DEBUG_ARCHIVE_SIZE" -gt "50" ]; then
    echo "  Debug archive is large (${DEBUG_ARCHIVE_SIZE}MB), consider cleaning..."
fi

# Report results
UPLOAD_COUNT=$(ls -1 data/uploads/ 2>/dev/null | wc -l | xargs)
UPLOAD_SIZE=$(du -sh data/uploads/ 2>/dev/null | cut -f1)

echo "✅ Cleanup complete"
echo "   - Uploads directory: $UPLOAD_COUNT files, $UPLOAD_SIZE total"