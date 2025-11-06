# Quick Start Guide - Backend Server

## ✅ Backend is Now Running!

The backend server has been set up and is running on **http://localhost:5000**

## Verify It's Working

Open your browser and go to: http://localhost:5000/health

You should see:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

## How to Start Backend in the Future

### Option 1: Using npm (Recommended)
```bash
cd backend
npm start
```

### Option 2: Using nodemon (Auto-restart on changes)
```bash
cd backend
npm run dev
```

### Option 3: From Root Directory
```bash
npm run dev:backend
```

## What Was Set Up

1. ✅ Created `backend/.env` file with:
   - PORT=5000
   - NODE_ENV=development
   - JWT_SECRET=polyone_super_secret_jwt_key_2024_change_in_production

2. ✅ Installed backend dependencies

3. ✅ Started backend server on port 5000

4. ✅ Created `frontend/.env.local` with:
   - NEXT_PUBLIC_API_URL=http://localhost:5000

## Important Notes

- **Backend must be running** before you can login or create chains
- If you close the terminal, the backend will stop
- To run in background, use: `npm start &` (Linux/Mac) or start it in a separate terminal
- The backend is currently running in the background

## Troubleshooting

### Backend Won't Start
- Check if port 5000 is already in use: `netstat -ano | findstr :5000`
- Make sure `backend/.env` file exists
- Run `npm install` in the backend directory

### Frontend Can't Connect
- Make sure backend is running (check http://localhost:5000/health)
- Restart frontend after creating `.env.local`: `npm run dev`
- Check browser console for detailed error messages

### Authentication Errors
- Make sure you're logged in at `/auth/login`
- Clear browser localStorage and login again
- Check that `JWT_SECRET` in backend/.env matches

## Next Steps

1. ✅ Backend is running
2. Go to your frontend (usually http://localhost:3000)
3. Try logging in again - it should work now!
4. If frontend isn't running, start it with: `cd frontend && npm run dev`

