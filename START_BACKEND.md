# 🚀 How to Start the Backend Server

The backend server is **optional** for chain creation. Your chains are registered on-chain regardless of whether the backend is running. The backend is only needed for infrastructure deployment.

## Quick Start

### Option 1: Start Backend Only

```bash
cd backend
npm install  # If not already installed
npm run dev  # Starts with nodemon (auto-reload)
# OR
npm start    # Starts normally
```

### Option 2: Start Both Frontend and Backend

From the root directory:

```bash
npm run dev
```

This will start both frontend and backend concurrently.

## Backend Server Details

- **Port:** 5000 (default)
- **URL:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## What the Backend Does

The backend is responsible for:
- Infrastructure deployment (validators, nodes, etc.)
- Chain monitoring and analytics
- API endpoints for chain management

**Note:** Chain registration on the blockchain happens independently and does NOT require the backend.

## Troubleshooting

### Port 5000 Already in Use

```bash
# Windows PowerShell
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the port in backend/.env
PORT=5001
```

### Backend Not Starting

1. Check if Node.js is installed: `node --version`
2. Install dependencies: `cd backend && npm install`
3. Check for errors in the console

### Backend Connection Error

If you see "Cannot connect to backend server":
- The chain is still registered on-chain ✅
- Only infrastructure deployment is skipped
- You can start the backend later and it will catch up

## Environment Variables

Create `backend/.env` if needed:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=polyone
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

## Verify Backend is Running

Visit: http://localhost:5000/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "version": "1.0.0"
}
```

## Next Steps

Once the backend is running:
1. Your chains will have full infrastructure deployment
2. Monitoring and analytics will be available
3. All API endpoints will work

But remember: **Your chains are already registered on-chain even without the backend!** 🎉
