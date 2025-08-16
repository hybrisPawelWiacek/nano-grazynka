#!/bin/bash
cd "$(dirname "$0")"
export DATABASE_URL="file:../data/nano-grazynka.db"
npx prisma migrate dev --name add_entity_project_system --skip-seed