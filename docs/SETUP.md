# PolyOne Setup Guide

This guide will help you set up and run the PolyOne platform locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for containerized deployment)
- **Git**
- **PostgreSQL** (if running without Docker)

## 🚀 Quick Start (Docker)

The easiest way to run PolyOne is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/polyone.git
cd polyone

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## 💻 Manual Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start the backend
npm run dev
```

The backend will run on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start the development server
npm run dev
```

The frontend will run on http://localhost:3000

### 3. Sample dApp Setup

```bash
cd sample-dapp

# Install dependencies
npm install

# Start the dApp
npm run dev
```

The sample dApp will run on http://localhost:3001

## 🗄️ Database Setup

### Using Docker

PostgreSQL is automatically set up with Docker Compose.

### Manual Setup

1. Install PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. Create database:
```bash
sudo -u postgres psql
CREATE DATABASE polyone;
CREATE USER polyone_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE polyone TO polyone_user;
\q
```

3. Update backend `.env` with your database credentials.

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=polyone
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
POLYGON_CDK_PATH=/usr/local/bin/polygon-cdk
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=PolyOne
NEXT_PUBLIC_POLYGON_TESTNET_RPC=https://rpc-amoy.polygon.technology
```

## 🔨 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build

# View logs
docker-compose logs -f [service_name]

# Execute commands in container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove all data (⚠️ destructive)
docker-compose down -v
```

## 📊 Monitoring

### Prometheus

Access Prometheus at http://localhost:9090

Query examples:
- `up` - Check service status
- `http_requests_total` - Total HTTP requests
- `chain_uptime` - Chain uptime metrics

### Grafana

1. Access Grafana at http://localhost:3001
2. Login with admin/admin123
3. Add Prometheus data source:
   - URL: http://prometheus:9090
   - Save & Test

## 🔐 Security

### Production Deployment

1. **Change default passwords**:
   - Database password
   - Grafana admin password
   - JWT secret

2. **Enable HTTPS**:
   - Use a reverse proxy (nginx/Caddy)
   - Obtain SSL certificates (Let's Encrypt)

3. **Environment variables**:
   - Never commit `.env` files
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)

4. **Network security**:
   - Configure firewall rules
   - Use VPC/private networks
   - Implement rate limiting

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running
- Verify database credentials in `.env`
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check if backend is running
- Check CORS settings

### Docker issues
- Run `docker-compose down -v` to clean up
- Rebuild with `docker-compose up -d --build`
- Check logs with `docker-compose logs -f`

### Database connection errors
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists

## 📚 Additional Resources

- [Polygon CDK Documentation](https://wiki.polygon.technology/docs/cdk/overview)
- [Polygon zkEVM](https://wiki.polygon.technology/docs/zkEVM/overview)
- [AggLayer Overview](https://wiki.polygon.technology/docs/agglayer/overview)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)

## 🆘 Getting Help

- Check the [FAQ](./FAQ.md)
- Open an issue on GitHub
- Join our Discord community
- Email: support@polyone.io

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details

