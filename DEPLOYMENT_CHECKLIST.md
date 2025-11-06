# Vercel Deployment Checklist

## ✅ Pre-Deployment Checks Completed

- [x] Created `vercel.json` with proper configuration
- [x] Created `.vercelignore` to exclude unnecessary files
- [x] Converted Express backend routes to Next.js API routes
- [x] Added all required dependencies to `frontend/package.json`
- [x] Fixed TypeScript types for dynamic route parameters
- [x] Created utility files for auth and storage
- [x] Fixed Next.js configuration

## 📋 Before Deploying

### 1. Environment Variables
Set these in Vercel Dashboard (Settings > Environment Variables):

```
JWT_SECRET=your-secret-key-here (generate with: openssl rand -base64 32)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret (generate with: openssl rand -base64 32)
GOOGLE_CLIENT_ID=your-google-client-id (optional, for OAuth)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
GITHUB_ID=your-github-id (optional, for OAuth)
GITHUB_SECRET=your-github-secret (optional)
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=your-contract-address (optional)
```

### 2. Verify Build Locally (Optional)
```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Vercel

**Option A: Vercel CLI**
```bash
vercel
vercel --prod
```

**Option B: GitHub Integration**
1. Push code to GitHub
2. Go to vercel.com/new
3. Import repository
4. Root Directory: `frontend`
5. Deploy

## 🔍 Post-Deployment Checks

- [ ] Verify homepage loads
- [ ] Test API endpoints:
  - [ ] `/api/health` - Should return `{status: "healthy"}`
  - [ ] `/api/auth/signup` - Test user registration
  - [ ] `/api/auth/login` - Test user login
  - [ ] `/api/chains` - Test chain listing (requires auth)
- [ ] Check Vercel function logs for errors
- [ ] Verify environment variables are set correctly

## ⚠️ Known Limitations

1. **In-Memory Storage**: The app uses in-memory Maps for storage, which means data will reset between serverless function invocations. For production, consider:
   - Vercel Postgres
   - Vercel KV (Redis)
   - MongoDB Atlas
   - Supabase

2. **Serverless Functions**: Each API route runs as a separate serverless function, so in-memory storage won't persist across requests. This is fine for testing but needs a database for production.

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check Vercel build logs

### API Routes Return 500
- Check Vercel function logs
- Verify environment variables are set
- Check for TypeScript compilation errors

### Authentication Not Working
- Verify `JWT_SECRET` is set
- Check that Authorization header is being sent correctly
- Review API route logs

## 📚 Next Steps

1. Set up a production database
2. Configure custom domain
3. Set up monitoring and analytics
4. Enable error tracking (Sentry, etc.)

