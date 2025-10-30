# Production Deployment Guide

This guide covers deploying PolyOne to production environments.

## 🌐 Deployment Options

### 1. AWS Deployment

#### Prerequisites
- AWS Account
- AWS CLI configured
- Docker
- Terraform (optional)

#### Steps

**Option A: Using Docker on EC2**

1. Launch EC2 instance:
```bash
# t3.medium or larger recommended
aws ec2 run-instances \
  --image-id ami-xxxxx \
  --instance-type t3.medium \
  --key-name your-key \
  --security-groups polyone-sg
```

2. SSH into instance and install Docker:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. Deploy application:
```bash
# Clone repository
git clone https://github.com/yourusername/polyone.git
cd polyone

# Set up environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

**Option B: Using ECS (Elastic Container Service)**

1. Build and push Docker images:
```bash
# Build images
docker build -t polyone-backend:latest ./backend
docker build -t polyone-frontend:latest ./frontend

# Tag for ECR
docker tag polyone-backend:latest AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/polyone-backend:latest
docker tag polyone-frontend:latest AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/polyone-frontend:latest

# Push to ECR
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
docker push AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/polyone-backend:latest
docker push AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/polyone-frontend:latest
```

2. Create ECS task definition and service (use AWS Console or CLI)

#### Database
Use Amazon RDS for PostgreSQL:
```bash
aws rds create-db-instance \
  --db-instance-identifier polyone-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --allocated-storage 100 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD
```

### 2. Google Cloud Platform (GCP)

#### Using Google Cloud Run

1. Build and push to Google Container Registry:
```bash
# Configure gcloud
gcloud auth configure-docker

# Build images
docker build -t gcr.io/PROJECT_ID/polyone-backend:latest ./backend
docker build -t gcr.io/PROJECT_ID/polyone-frontend:latest ./frontend

# Push to GCR
docker push gcr.io/PROJECT_ID/polyone-backend:latest
docker push gcr.io/PROJECT_ID/polyone-frontend:latest
```

2. Deploy to Cloud Run:
```bash
# Backend
gcloud run deploy polyone-backend \
  --image gcr.io/PROJECT_ID/polyone-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
gcloud run deploy polyone-frontend \
  --image gcr.io/PROJECT_ID/polyone-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Database
Use Cloud SQL for PostgreSQL:
```bash
gcloud sql instances create polyone-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1
```

### 3. Azure Deployment

#### Using Azure Container Instances

```bash
# Login
az login

# Create resource group
az group create --name polyone-rg --location eastus

# Create container registry
az acr create --resource-group polyone-rg --name polyoneacr --sku Basic

# Build and push images
az acr build --registry polyoneacr --image polyone-backend:latest ./backend
az acr build --registry polyoneacr --image polyone-frontend:latest ./frontend

# Deploy containers
az container create \
  --resource-group polyone-rg \
  --name polyone-backend \
  --image polyoneacr.azurecr.io/polyone-backend:latest \
  --dns-name-label polyone-backend \
  --ports 5000
```

### 4. Digital Ocean

```bash
# Install doctl
brew install doctl  # macOS
# or: snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml
```

## 🔒 Security Checklist

### Environment Variables
- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Configure database credentials
- [ ] Set up API keys for third-party services

### Network Security
- [ ] Configure firewall rules
- [ ] Enable HTTPS/SSL
- [ ] Set up VPC/private networks
- [ ] Implement rate limiting
- [ ] Configure CORS properly

### Database Security
- [ ] Enable SSL connections
- [ ] Set up automated backups
- [ ] Configure access controls
- [ ] Enable encryption at rest

### Application Security
- [ ] Enable helmet.js middleware
- [ ] Set up input validation
- [ ] Implement CSRF protection
- [ ] Enable security headers
- [ ] Set up logging and monitoring

## 🔧 Production Configuration

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      # Use secrets management for sensitive data
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name polyone.io www.polyone.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name polyone.io www.polyone.io;

    ssl_certificate /etc/letsencrypt/live/polyone.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/polyone.io/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Logging

### CloudWatch (AWS)
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Datadog
```bash
# Install Datadog agent
DD_API_KEY=YOUR_API_KEY bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### Sentry (Error Tracking)
```javascript
// backend/src/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push Docker images
        run: |
          docker build -t polyone-backend:${{ github.sha }} ./backend
          docker build -t polyone-frontend:${{ github.sha }} ./frontend
          # Push to registry
      
      - name: Deploy to production
        run: |
          # Deploy commands
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancers (AWS ALB, GCP Load Balancer)
- Deploy multiple instances
- Implement session management (Redis)

### Database Scaling
- Read replicas
- Connection pooling
- Query optimization

### Caching
- Redis for session storage
- CDN for static assets
- API response caching

## 🔐 Backup Strategy

```bash
# Automated PostgreSQL backups
pg_dump -h hostname -U username -d polyone > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://polyone-backups/
```

## 📱 Health Checks

```javascript
// Implement comprehensive health checks
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: await checkDatabase(),
    redis: await checkRedis()
  };
  res.json(health);
});
```

## 🆘 Troubleshooting

### Container Issues
```bash
# View logs
docker-compose logs -f service_name

# Restart service
docker-compose restart service_name

# Check resource usage
docker stats
```

### Database Connection Issues
- Check security groups/firewall rules
- Verify connection string
- Check SSL requirements
- Verify database is running

## 📞 Support

For production support:
- Email: ops@polyone.io
- Slack: #polyone-ops
- Phone: +1-XXX-XXX-XXXX (24/7)

