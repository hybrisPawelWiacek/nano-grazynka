# Prisma Migration Guide for nano-Grazynka

## Overview
This guide provides clear instructions for handling Prisma database migrations in the nano-Grazynka project, addressing common issues and providing best practices.

## Database Locations

| Environment | Database Path | Usage |
|-------------|--------------|-------|
| **Host Development** | `./data/nano-grazynka.db` | Running locally outside Docker |
| **From Backend Directory** | `../data/nano-grazynka.db` | When running commands from `/backend` |
| **Docker Container** | `/data/nano-grazynka.db` | Inside Docker container |

## Quick Commands

### Development (Most Common)

```bash
# For schema changes during development (preserves data)
cd backend
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma db push

# Generate Prisma Client after schema changes
cd backend
npx prisma generate
```

### Production Migrations

```bash
# Create a new migration file
cd backend
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate dev --name descriptive_name

# Deploy migrations in production
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate deploy
```

## When to Use Each Command

### `prisma db push`
**Use when:**
- Actively developing and iterating on schema
- You want to preserve existing data
- You don't need migration history
- You have database drift issues

**Example:**
```bash
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma db push
```

### `prisma migrate dev`
**Use when:**
- Creating production-ready migrations
- You need version-controlled migration files
- Preparing changes for deployment

**Example:**
```bash
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate dev --name add_entity_system
```

### `prisma migrate deploy`
**Use when:**
- Deploying to production
- Applying migrations in CI/CD pipeline
- Running in Docker container

**Example:**
```bash
DATABASE_URL="file:/data/nano-grazynka.db" npx prisma migrate deploy
```

## Common Issues and Solutions

### Issue 1: Database Drift
**Error:** "Drift detected: Your database schema is not in sync with your migration history"

**Solution:**
```bash
# Option 1: Use db push for development
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma db push

# Option 2: Reset migrations (CAUTION: loses data)
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate reset --skip-seed

# Option 3: Baseline existing schema
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate resolve --applied "migration_name"
```

### Issue 2: Shell Command Failed (No Details)
**Solution:** Create a script with error handling:
```bash
#!/bin/bash
set -e  # Exit on error
set -x  # Print commands
cd backend
export DATABASE_URL="file:../data/nano-grazynka.db"
npx prisma db push 2>&1
```

### Issue 3: Wrong Database Path
**Solution:** Always use relative path from backend directory:
```bash
# ✅ Correct
DATABASE_URL="file:../data/nano-grazynka.db"

# ❌ Wrong (Docker path in local dev)
DATABASE_URL="file:/data/nano-grazynka.db"
```

### Issue 4: Permission Denied
**Solution:**
```bash
# Check file permissions
ls -la data/nano-grazynka.db

# Fix permissions if needed
chmod 644 data/nano-grazynka.db
```

## Migration Scripts

### Development Migration Script
Use `/backend/scripts/dev-migrate.sh`:
```bash
./backend/scripts/dev-migrate.sh push  # For development
./backend/scripts/dev-migrate.sh migrate "migration_name"  # For production migrations
```

### Docker Migration Script
Use `/backend/scripts/docker-migrate.sh`:
```bash
docker exec nano-grazynka_cc-backend-1 sh /app/scripts/docker-migrate.sh
```

## Debugging Commands

```bash
# Check migration status
cd backend && npx prisma migrate status

# Validate schema syntax
cd backend && npx prisma validate

# Format schema (reveals syntax errors)
cd backend && npx prisma format

# View database content
cd backend && npx prisma studio

# Generate client without migration
cd backend && npx prisma generate
```

## Best Practices

1. **Always work from the `/backend` directory** to ensure correct relative paths
2. **Use `db push` during active development** to avoid migration conflicts
3. **Create migrations only when ready for production** or committing features
4. **Test migrations locally** before deploying to production
5. **Keep `.env` for Docker**, use environment variables for local development
6. **Document schema changes** in migration names and commit messages

## Environment Setup

### Local Development
```bash
# In terminal or script
export DATABASE_URL="file:../data/nano-grazynka.db"
```

### Docker Development
The `.env` file contains:
```
DATABASE_URL=file:/data/nano-grazynka.db
```

### CI/CD Pipeline
Set `DATABASE_URL` as an environment variable in your CI/CD configuration.

## Workflow Example

### Adding New Features (Entity System Example)

1. **Update schema** (`backend/prisma/schema.prisma`):
```prisma
model Entity {
  id        String   @id @default(cuid())
  name      String
  // ... fields
}
```

2. **Apply changes in development**:
```bash
cd backend
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma db push
```

3. **Test the changes**:
```bash
# Run your application and tests
npm test
```

4. **Create production migration** (when ready):
```bash
DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate dev --name add_entity_system
```

5. **Commit changes**:
```bash
git add .
git commit -m "feat: Add Entity Project System database schema"
```

## Troubleshooting Checklist

- [ ] Am I in the `/backend` directory?
- [ ] Is my `DATABASE_URL` using the correct path?
- [ ] Do I have write permissions on the database file?
- [ ] Is the database file corrupted? (Check with `sqlite3 data/nano-grazynka.db ".tables"`)
- [ ] Are there any running processes locking the database?
- [ ] Is my Prisma schema valid? (Run `npx prisma format`)
- [ ] Do I need to regenerate the client? (Run `npx prisma generate`)

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Troubleshooting Prisma Migrate](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)
- [SQLite with Prisma](https://www.prisma.io/docs/concepts/database-connectors/sqlite)