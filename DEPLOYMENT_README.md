# HVAC CRM Deployment Guide

This guide provides comprehensive instructions for deploying your HVAC CRM application to various environments, from local development to production VPS.

## 🚀 Quick Start

### Local Development
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start local development environment
./scripts/quick-deploy.sh local
```

### VPS Production Deployment
```bash
# Deploy to VPS with full automation
./scripts/deploy-to-vps.sh
```

## 📋 Prerequisites

### Local Development
- Docker and Docker Compose
- Git
- OpenSSL (for generating secrets)

### VPS Production
- Ubuntu 20.04+ VPS
- SSH access to VPS
- Domain name pointing to VPS
- Email address for SSL certificates

## 🛠️ Deployment Scripts

### 1. Quick Deploy Script (`scripts/quick-deploy.sh`)

A versatile script for local development and basic production deployment.

**Commands:**
```bash
./scripts/quick-deploy.sh local       # Local development
./scripts/quick-deploy.sh production  # Production deployment
./scripts/quick-deploy.sh stop        # Stop all services
./scripts/quick-deploy.sh logs        # View logs
./scripts/quick-deploy.sh status      # Check service status
./scripts/quick-deploy.sh update      # Update application
```

**Features:**
- Automatic environment file generation
- Secret generation
- Health checks
- Service management

### 2. VPS Deploy Script (`scripts/deploy-to-vps.sh`)

Complete VPS deployment automation with production-ready configuration.

**Features:**
- Server setup and hardening
- Docker installation
- Nginx reverse proxy
- SSL certificate automation
- Monitoring and backup setup
- Firewall configuration

**Usage:**
```bash
./scripts/deploy-to-vps.sh
```

The script will prompt for:
- VPS IP address/hostname
- SSH credentials
- Domain name
- Email for SSL certificates

## 🔧 Configuration

### Environment Variables

#### Core Application
```bash
SERVER_URL=https://your-domain.com
APP_SECRET=your-secret-key
PG_DATABASE_PASSWORD=your-db-password
```

#### HVAC Specific
```bash
HVAC_ENABLED=true
HVAC_SENTRY_DSN=your-sentry-dsn
HVAC_WEAVIATE_URL=http://localhost:8080
```

#### Storage Configuration
```bash
# Local storage (development)
STORAGE_TYPE=local

# S3 storage (production recommended)
STORAGE_TYPE=s3
STORAGE_S3_REGION=us-east-1
STORAGE_S3_NAME=your-bucket-name
STORAGE_S3_ENDPOINT=
```

#### Email Configuration
```bash
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_FROM_NAME=HVAC CRM System
EMAIL_DRIVER=smtp
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASSWORD=your-smtp-password
```

## 🏗️ Architecture

### Local Development
```
┌─────────────────┐
│   Frontend      │ ← http://localhost:3000
│   (React)       │
├─────────────────┤
│   Backend       │ ← GraphQL API
│   (NestJS)      │
├─────────────────┤
│   Database      │ ← PostgreSQL
│   (PostgreSQL)  │
├─────────────────┤
│   Cache         │ ← Redis
│   (Redis)       │
└─────────────────┘
```

### Production VPS
```
Internet
    ↓
┌─────────────────┐
│   Nginx         │ ← SSL Termination
│   (Reverse      │   Port 80/443
│    Proxy)       │
└─────────────────┘
    ↓
┌─────────────────┐
│   Docker        │ ← Application
│   Containers    │   Port 3000
│                 │
│ ┌─────────────┐ │
│ │ Frontend    │ │
│ │ Backend     │ │
│ │ Database    │ │
│ │ Redis       │ │
│ │ Worker      │ │
│ └─────────────┘ │
└─────────────────┘
```

## 🔒 Security Features

### VPS Deployment Security
- UFW firewall configuration
- SSL/TLS encryption (Let's Encrypt)
- Security headers
- Fail2ban protection (optional)
- Regular security updates

### Application Security
- JWT authentication
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention

## 📊 Monitoring & Maintenance

### Automated Monitoring
- Health check endpoints
- Container restart on failure
- SSL certificate auto-renewal
- Daily database backups

### Manual Monitoring Commands
```bash
# Check service status
ssh user@your-vps 'cd /opt/hvac-crm && docker compose ps'

# View application logs
ssh user@your-vps 'cd /opt/hvac-crm && docker compose logs -f'

# Check system resources
ssh user@your-vps 'htop'

# View backup status
ssh user@your-vps 'ls -la /opt/backups/hvac-crm/'
```

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Local development
./scripts/quick-deploy.sh update

# Production
./scripts/quick-deploy.sh update production

# Or manually on VPS
ssh user@your-vps 'cd /opt/hvac-crm && git pull && docker compose pull && docker compose up -d'
```

### Database Backup & Restore
```bash
# Manual backup
ssh user@your-vps '/usr/local/bin/hvac-backup.sh'

# Restore from backup
ssh user@your-vps 'docker exec -i $(docker ps -q -f name=db) psql -U postgres default < /opt/backups/hvac-crm/database_YYYYMMDD_HHMMSS.sql'
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

#### Docker Issues
```bash
# Restart Docker
sudo systemctl restart docker

# Clean up Docker
docker system prune -a

# Reset containers
docker compose down && docker compose up -d
```

#### SSL Certificate Issues
```bash
# Renew SSL certificate
sudo certbot renew

# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### Database Connection Issues
```bash
# Check database logs
docker compose logs db

# Reset database
docker compose down
docker volume rm $(docker volume ls -q | grep db)
docker compose up -d
```

## 📞 Support

### Log Locations
- Application logs: `docker compose logs`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`
- Backup logs: `/var/log/hvac-monitor.log`

### Performance Optimization
- Monitor resource usage with `htop`
- Optimize database queries
- Configure Redis caching
- Use CDN for static assets
- Enable gzip compression

### Scaling Considerations
- Load balancer setup
- Database replication
- Redis clustering
- Container orchestration (Kubernetes)
- Microservices architecture

---

For additional support or questions, please refer to the project documentation or create an issue in the repository.
