# DigitalOcean + Coolify Deployment Plan

## Overview
This document outlines the deployment strategy for nano-Grazynka using DigitalOcean as the infrastructure provider and Coolify as the deployment platform. This approach provides a perfect balance between simplicity, control, and cost-effectiveness.

## Why Coolify + DigitalOcean?

### 🎯 Perfect Balance
- **Simple as Heroku** - Web UI for everything
- **Powerful as Docker** - Full Docker Compose support
- **Cheap as VPS** - Only $12-24/month total

### 🚀 Key Benefits
1. **Push to Deploy** - Connect GitHub, push code, auto-deploys
2. **Automatic SSL** - Free HTTPS certificates, auto-renewed
3. **Web Dashboard** - Monitor logs, CPU, memory, all in browser
4. **One-Click Rollback** - Made a mistake? Roll back instantly
5. **SQLite Works Perfectly** - Persistent storage, automatic backups
6. **Scale Later** - Can host multiple apps on same droplet

## Implementation Plan

### Phase 1: Prepare Your Application

#### 1. Create Production Dockerfiles
- `backend/Dockerfile.prod` - Optimized production build
- `frontend/Dockerfile.prod` - Optimized production build

#### 2. Create Production Docker Compose
- `docker-compose.prod.yml` - Production configuration
- Update NEXT_PUBLIC_API_URL to use domain/IP
- Ensure SQLite volume is properly mapped

#### 3. Push to GitHub
- Commit all changes
- Push to your GitHub repository

### Phase 2: Setup DigitalOcean Droplet

#### 1. Create Droplet
- Go to DigitalOcean Dashboard
- Create Droplet → Ubuntu 22.04 LTS
- Choose: 2 GB RAM / 2 vCPUs ($12/month) or 4 GB RAM / 2 vCPUs ($24/month for better performance)
- Select datacenter region closest to you
- Add your SSH key (or use password)
- Create droplet and note the IP address

### Phase 3: Install Coolify

#### 1. SSH into your droplet
```bash
ssh root@YOUR_DROPLET_IP
```

#### 2. Run Coolify installer
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
- Installation takes 1-2 minutes
- Note the URL shown (http://YOUR_DROPLET_IP:8000)

#### 3. Access Coolify Dashboard
- Open browser to http://YOUR_DROPLET_IP:8000
- Create admin account (save credentials!)
- Complete initial setup wizard

### Phase 4: Deploy Your Application

#### 1. In Coolify Dashboard
- Click "New Project"
- Choose "Add New Resource" → "Public Repository" (or Private if you have GitHub integration)
- Select "Docker Compose" as deployment type

#### 2. Configure Git Repository
- Repository URL: https://github.com/YOUR_USERNAME/nano-grazynka
- Branch: main (or your default branch)
- Build Path: / (root)
- Docker Compose Location: /docker-compose.prod.yml

#### 3. Set Environment Variables
Click "Environment Variables" and add:
```
OPENAI_API_KEY=your-key
OPENROUTER_API_KEY=your-key
DATABASE_URL=file:/data/nano-grazynka.db
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:3101
```

#### 4. Configure Networking
- Frontend: Expose port 3100 → Map to 3100
- Backend: Expose port 3101 → Map to 3101
- Enable "Expose to Internet"

#### 5. Deploy
- Click "Deploy"
- Watch logs for deployment progress
- App will be available at:
  - Frontend: http://YOUR_DROPLET_IP:3100
  - Backend: http://YOUR_DROPLET_IP:3101

### Phase 5: Setup Domain & SSL (Optional)

#### 1. Add Domain in DigitalOcean
- Networking → Domains → Add Domain
- Point your domain to droplet IP

#### 2. Configure in Coolify
- Go to your application settings
- Add domain: yourdomain.com
- Enable "Generate SSL Certificate"
- Coolify auto-configures Let's Encrypt

### Phase 6: Setup Backups

#### 1. Create backup script
`scripts/backup-sqlite.sh`:
```bash
#!/bin/bash
# SSH into server and backup SQLite
ssh root@YOUR_DROPLET_IP "cd /var/lib/docker/volumes/your-app-data && tar -czf /backups/backup-$(date +%Y%m%d).tar.gz nano-grazynka.db"
```

#### 2. Setup automated backups in Coolify
- Go to application settings
- Configure S3 backup (DigitalOcean Spaces)
- Or use Coolify's built-in backup features

## Files to Create

1. `backend/Dockerfile.prod` - Production backend image
2. `frontend/Dockerfile.prod` - Production frontend image
3. `docker-compose.prod.yml` - Production compose configuration
4. `scripts/backup-sqlite.sh` - Backup script (optional)

## Time Estimates

- 10 minutes: Create production Docker files
- 5 minutes: Create DigitalOcean droplet
- 5 minutes: Install Coolify
- 10 minutes: Configure and deploy app
- **Total: ~30 minutes**

## Advantages of Coolify

✅ **Web UI** - No command line needed after setup  
✅ **Auto SSL** - Automatic HTTPS with Let's Encrypt  
✅ **Git Integration** - Push to deploy  
✅ **Built-in Monitoring** - CPU, RAM, logs in dashboard  
✅ **Easy Rollback** - One-click rollback to previous versions  
✅ **Multiple Apps** - Host multiple projects on same droplet  
✅ **Backups** - Built-in backup scheduling  
✅ **Zero Downtime** - Deployments with health checks  

## Cost Breakdown

- DigitalOcean Droplet: $12-24/month
- Coolify: Free (self-hosted)
- Domain: ~$10/year (optional)
- **Total: $12-24/month**

## Future Deployments

After initial setup, deploying updates is just:
1. Push code to GitHub
2. Click "Deploy" in Coolify (or set auto-deploy)
3. Done! Zero downtime deployment

## Alternative: Simple Manual Deployment

If you prefer not to use Coolify, we also have an ultra-simple manual deployment option that requires only 4 files:

### Ultra-Simple Plan (Without Coolify)
1. Create production Dockerfiles
2. Create `docker-compose.prod.yml` (change API URL from localhost to droplet IP)
3. Create `scripts/deploy.sh` for one-command deployment
4. Run `./scripts/deploy.sh YOUR_DROPLET_IP`

The deploy script:
```bash
#!/bin/bash
DROPLET_IP=$1
# Rsync everything including .env
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'data/uploads/*' . root@$DROPLET_IP:/app/nano-grazynka/
# Restart containers
ssh root@$DROPLET_IP "cd /app/nano-grazynka && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d --build"
```

This manual approach:
- Uses your existing .env file
- No separate production configuration needed
- Deploy with one command
- Total setup time: 20 minutes

## Decision Guide

Choose **Coolify** if you want:
- Web UI for management
- Automatic SSL certificates
- Built-in monitoring
- Git push deployments
- Multiple apps on same server

Choose **Manual deployment** if you want:
- Absolute simplicity
- Full control
- Minimal setup time
- No additional services

Both approaches work perfectly for the nano-Grazynka MVP and can handle production traffic reliably.