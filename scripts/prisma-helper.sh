#!/bin/bash

# Prisma Helper Script
# This script determines the correct DATABASE_URL based on context
# and executes Prisma commands with the right path

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine if we're running in Docker or on host
if [ -f /.dockerenv ]; then
    # Inside Docker container
    export DATABASE_URL="file:/data/nano-grazynka.db"
    echo -e "${GREEN}🐳 Docker environment detected${NC}"
elif [ "$PWD" = "/Users/pawelwiacek/Documents/ai_agents_dev/nano-grazynka_CC/backend" ] || [ "${PWD##*/}" = "backend" ]; then
    # In backend directory
    export DATABASE_URL="file:../data/nano-grazynka.db"
    echo -e "${GREEN}📁 Backend directory detected${NC}"
else
    # In project root
    export DATABASE_URL="file:./data/nano-grazynka.db"
    echo -e "${GREEN}🏠 Project root detected${NC}"
fi

echo -e "${YELLOW}📍 Using DATABASE_URL: $DATABASE_URL${NC}"

# Check if database exists
DB_PATH="${DATABASE_URL#file:}"
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}⚠️  Warning: Database file does not exist at $DB_PATH${NC}"
    echo -e "${YELLOW}Creating new database...${NC}"
fi

# Execute the passed command
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No command provided${NC}"
    echo "Usage: $0 <prisma command>"
    echo "Example: $0 migrate dev --name my_migration"
    exit 1
fi

# Run Prisma with the determined DATABASE_URL
echo -e "${GREEN}▶️  Running: npx prisma $@${NC}"
npx prisma "$@"