#!/bin/sh
# Docker migration script for nano-Grazynka
# Usage: docker exec nano-grazynka_cc-backend-1 sh /app/scripts/docker-migrate.sh [command]

set -e  # Exit on error

# Colors (basic for sh compatibility)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Docker database path
export DATABASE_URL="file:/data/nano-grazynka.db"

echo "${GREEN}🐳 Running in Docker container${NC}"
echo "${GREEN}🗄️  Database: $DATABASE_URL${NC}"

# Parse command
COMMAND=${1:-deploy}

case $COMMAND in
  deploy)
    echo "${YELLOW}🚀 Deploying migrations...${NC}"
    npx prisma migrate deploy
    echo "${GREEN}✅ Migrations deployed successfully!${NC}"
    ;;
    
  status)
    echo "${YELLOW}📊 Checking migration status...${NC}"
    npx prisma migrate status
    ;;
    
  generate)
    echo "${YELLOW}🔧 Generating Prisma Client...${NC}"
    npx prisma generate
    echo "${GREEN}✅ Client generated successfully!${NC}"
    ;;
    
  push)
    echo "${YELLOW}🚀 Pushing schema changes (development)...${NC}"
    npx prisma db push
    echo "${GREEN}✅ Schema pushed successfully!${NC}"
    ;;
    
  *)
    echo "${RED}❌ Unknown command: $COMMAND${NC}"
    echo "Usage: $0 [deploy|status|generate|push]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy migrations (production)"
    echo "  status     - Check migration status"
    echo "  generate   - Generate Prisma Client"
    echo "  push       - Push schema changes (development)"
    exit 1
    ;;
esac