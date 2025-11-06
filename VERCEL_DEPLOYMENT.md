# Vercel Deployment Guide

This guide will help you deploy PolyOne to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. GitHub account (if deploying from a repository)
3. Node.js 18+ installed locally (for testing)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to project root**:
   ```bash
   cd PolyOne
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - Choose your account and project settings
   - Vercel will automatically detect Next.js and configure the build

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository

3. **Configure Project**:
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables** (if needed):
   Add these in Vercel dashboard under Settings > Environment Variables:
   ```
   JWT_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

## Environment Variables

Set these in Vercel Dashboard (Settings > Environment Variables):

- `JWT_SECRET`: Secret key for JWT token generation (required for auth API)
- `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`: Secret for NextAuth.js (generate with `openssl rand -base64 32`)

## Project Structure

The deployment is configured to:
- Build from the `frontend` directory
- Use Next.js framework
- Serve API routes from `frontend/src/app/api/*`

## API Routes

All backend routes have been converted to Next.js API routes:
- `/api/auth/signup` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user
- `/api/chains` - List chains
- `/api/chains/create` - Create new chain
- `/api/chains/[id]` - Get/Update/Delete chain
- `/api/monitoring/[chainId]/metrics` - Get chain metrics
- `/api/monitoring/[chainId]/analytics` - Get chain analytics
- `/api/monitoring/[chainId]/logs` - Get chain logs
- `/api/health` - Health check endpoint

## Important Notes

1. **Data Persistence**: The current implementation uses in-memory storage (Map objects). For production, consider using:
   - Vercel Postgres
   - Vercel KV (Redis)
   - MongoDB Atlas
   - Supabase

2. **Authentication**: The API routes use JWT tokens. Make sure to set `JWT_SECRET` as an environment variable.

3. **Build Time**: First deployment may take a few minutes as it installs dependencies.

4. **Custom Domain**: You can add a custom domain in Vercel Dashboard > Settings > Domains.

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `frontend/package.json`
- Ensure Node.js version is 18+ in Vercel settings

### API Routes Not Working
- Verify environment variables are set correctly
- Check Vercel function logs in the dashboard

### Authentication Issues
- Ensure `JWT_SECRET` is set as an environment variable
- Check that API routes are receiving the Authorization header

## Next Steps

After deployment:
1. Test all API endpoints
2. Set up a production database (replace in-memory storage)
3. Configure custom domain (optional)
4. Set up monitoring and analytics

For more help, visit [Vercel Documentation](https://vercel.com/docs).

