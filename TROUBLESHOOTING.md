# Troubleshooting Guide - Network Error Fix

## Problem
Getting "Network Error" when clicking "Launch Chain" button.

## Root Causes & Solutions

### 1. Backend Server Not Running ⚠️ (Most Common)

**Symptom**: "Cannot connect to backend server" error

**Solution**:
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Create .env file with required environment variables
# Create a file named .env in the backend directory with:
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Start the backend server
npm run dev
# OR
npm start
```

**Verify Backend is Running**:
- Open browser and go to: http://localhost:5000/health
- You should see: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### 2. Missing Authentication Token 🔑

**Symptom**: "Authentication failed" or "No token provided"

**Solution**:
1. Make sure you're logged in:
   - Go to `/auth/login`
   - Login with your credentials
   - The system now automatically stores the auth token

2. If you don't have an account:
   - Go to `/auth/signup`
   - Create a new account
   - Login after signup

### 3. Frontend Environment Variables Not Set

**Symptom**: Frontend can't find backend URL

**Solution**:
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Then restart the frontend:
```bash
cd frontend
npm run dev
```

### 4. Backend Missing JWT_SECRET

**Symptom**: Backend crashes or authentication fails

**Solution**:
1. Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

2. Restart the backend server

### 5. CORS Issues

**Symptom**: Network errors in browser console mentioning CORS

**Solution**:
The backend already has CORS enabled. If you still see issues:
- Make sure frontend is running on `http://localhost:3000`
- Make sure backend is running on `http://localhost:5000`
- Check that `NEXT_PUBLIC_API_URL` matches the backend URL

## Quick Start Commands

### Start Both Servers (Recommended)

**Terminal 1 - Backend**:
```bash
cd backend
npm install
# Create .env file first (see above)
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
# Create .env.local file (see above)
npm run dev
```

### Or Use Root Script (if available):
```bash
npm run dev
# This should start both backend and frontend
```

## Verification Steps

1. ✅ Backend health check: http://localhost:5000/health
2. ✅ Frontend running: http://localhost:3000
3. ✅ User logged in: Check browser console for `authToken` in localStorage
4. ✅ Wallet connected: Check wallet connection in dashboard

## What Was Fixed

1. ✅ **Login/Signup pages** now call the backend API and store auth tokens
2. ✅ **Error handling** improved to show specific error messages
3. ✅ **Network connectivity checks** added before API calls
4. ✅ **Better error messages** for common issues (backend down, auth failures, etc.)

## Still Having Issues?

1. Check browser console (F12) for detailed error messages
2. Check backend logs in `backend/logs/` directory
3. Verify both servers are running on correct ports
4. Clear browser localStorage and try logging in again
5. Check that your firewall isn't blocking localhost connections

## Environment Variables Summary

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Next Steps After Fix

Once the backend is running and you're logged in:
1. Connect your wallet
2. Fill in the chain creation form
3. Click "Launch Chain"
4. You should see success message instead of network error!

