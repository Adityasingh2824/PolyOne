# 🚀 PolyOne Quick Start Guide

Get your blockchain running in under 5 minutes!

## ⚡ Option 1: Docker (Recommended)

The fastest way to get started:

```bash
# 1. Clone the repository
git clone https://github.com/Adityasingh2824/PolyOne.git
cd PolyOne

# 2. Start all services
docker-compose up -d

# 3. Open your browser
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/health
# Grafana: http://localhost:3001 (admin/admin123)
```

That's it! You now have PolyOne running locally. 🎉

### Stop the services:
```bash
docker-compose down
```

## 💻 Option 2: Manual Setup

If you prefer to run services individually:

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- PostgreSQL (optional - in-memory storage works for testing)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Adityasingh2824/PolyOne.git
cd PolyOne

# 2. Set up Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings (JWT_SECRET is required)
npm run dev

# 3. In a new terminal, set up Frontend
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local if needed
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 🎯 First Steps

### 1. Create an Account
- Go to http://localhost:3000
- Click "Get Started" or "Sign Up"
- Fill in your details
- You'll be redirected to the dashboard

### 2. Launch Your First Chain
- Click "Launch New Chain" button
- Fill in chain details:
  - **Name**: My First Chain
  - **Chain Type**: Public
  - **Rollup Type**: zkRollup (recommended)
  - **Gas Token**: MYTOKEN
  - **Validators**: 3
- Click "Launch Chain"
- Wait ~10 seconds for deployment

### 3. View Your Chain
- See your chain in the dashboard
- Click on it to view details
- Copy the RPC URL
- Use it in your dApp!

## 🧪 Test with Sample dApp

```bash
# 1. Start the sample dApp
cd sample-dapp
npm install
npm run dev

# 2. Open http://localhost:3001
# 3. Connect MetaMask
# 4. Add your custom chain
# 5. Send test transactions
```

## 📚 Next Steps

- Read [Full Setup Guide](docs/SETUP.md) for detailed configuration
- Check [API Documentation](docs/API.md) to integrate your apps
- See [Deployment Guide](docs/DEPLOYMENT.md) for production setup
- Explore [Architecture](docs/ARCHITECTURE.md) to understand the system

## 🆘 Troubleshooting

### "Port already in use"
```bash
# Find and kill the process using the port
# For port 3000:
lsof -ti:3000 | xargs kill -9
# For port 5000:
lsof -ti:5000 | xargs kill -9
```

### "Database connection failed"
```bash
# Using Docker? Ensure containers are running:
docker-compose ps

# Manual setup? Check PostgreSQL is running:
sudo service postgresql status
```

### "JWT_SECRET not defined"
```bash
# Make sure you've created .env file in backend/
cp backend/.env.example backend/.env
# Edit backend/.env and set a strong JWT_SECRET
```

### Frontend can't connect to backend
```bash
# Check backend is running:
curl http://localhost:5000/health

# Check frontend .env.local:
# NEXT_PUBLIC_API_URL should be http://localhost:5000
```

## 🔧 Using Makefile (Linux/Mac)

We provide a Makefile for convenience:

```bash
# Install all dependencies
make install

# Setup project (creates .env files)
make setup

# Start development servers
make dev

# Start with Docker
make docker-up

# Stop Docker
make docker-down

# View logs
make logs

# See all commands
make help
```

## 📞 Need Help?

- 📖 [Documentation](docs/)
- 💬 [GitHub Issues](https://github.com/Adityasingh2824/PolyOne/issues)
- 📧 Email: support@polyone.io

## 🎉 You're Ready!

Start building amazing blockchain applications with PolyOne!

Happy coding! 🚀

