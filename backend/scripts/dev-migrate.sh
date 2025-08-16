#!/bin/bash
# Development migration script for nano-Grazynka
# Usage: ./dev-migrate.sh [push|migrate|status|reset] [migration_name]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and move to backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Set database URL
export DATABASE_URL="file:../data/nano-grazynka.db"

echo -e "${GREEN}📁 Working directory: $(pwd)${NC}"
echo -e "${GREEN}🗄️  Database: $DATABASE_URL${NC}"

# Parse command
COMMAND=${1:-push}

case $COMMAND in
  push)
    echo -e "${YELLOW}🚀 Pushing schema changes (development mode)...${NC}"
    npx prisma db push
    echo -e "${GREEN}✅ Schema pushed successfully!${NC}"
    ;;
    
  migrate)
    MIGRATION_NAME=${2:-"update"}
    echo -e "${YELLOW}📝 Creating migration: $MIGRATION_NAME${NC}"
    npx prisma migrate dev --name "$MIGRATION_NAME"
    echo -e "${GREEN}✅ Migration created successfully!${NC}"
    ;;
    
  status)
    echo -e "${YELLOW}📊 Checking migration status...${NC}"
    npx prisma migrate status
    ;;
    
  reset)
    echo -e "${RED}⚠️  WARNING: This will reset your database and lose all data!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}🔄 Resetting database...${NC}"
      npx prisma migrate reset --skip-seed
      echo -e "${GREEN}✅ Database reset successfully!${NC}"
    else
      echo -e "${YELLOW}❌ Reset cancelled${NC}"
    fi
    ;;
    
  generate)
    echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Client generated successfully!${NC}"
    ;;
    
  studio)
    echo -e "${YELLOW}🎨 Opening Prisma Studio...${NC}"
    npx prisma studio
    ;;
    
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo "Usage: $0 [push|migrate|status|reset|generate|studio] [migration_name]"
    echo ""
    echo "Commands:"
    echo "  push       - Push schema changes (development)"
    echo "  migrate    - Create a new migration"
    echo "  status     - Check migration status"
    echo "  reset      - Reset database (CAUTION: loses data)"
    echo "  generate   - Generate Prisma Client"
    echo "  studio     - Open Prisma Studio"
    exit 1
    ;;
esac