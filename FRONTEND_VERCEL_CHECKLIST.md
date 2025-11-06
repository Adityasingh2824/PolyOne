# ✅ Vercel Deployment Checklist

## Critical Step: Verify Root Directory is Set

**YOU MUST DO THIS IN VERCEL DASHBOARD:**

1. Go to: https://vercel.com/dashboard
2. Select project: `poly-one`
3. Go to: **Settings** → **General**
4. Scroll to: **Root Directory**
5. **MUST BE SET TO**: `frontend`
6. **Click Save**

## Why This Matters

If Root Directory is not set to `frontend`, Vercel will:
- ❌ Look for Next.js in root directory
- ❌ Try to use root package.json
- ❌ Fail because it tries to build backend too

When Root Directory is set to `frontend`, Vercel will:
- ✅ Only upload the `frontend` directory
- ✅ Auto-detect Next.js from `frontend/package.json`
- ✅ Use `frontend/package.json` build scripts
- ✅ Build correctly

## After Setting Root Directory

1. **Commit and push** any changes:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## What Vercel Will Auto-Detect

With Root Directory = `frontend` and no vercel.json:
- ✅ Framework: Next.js (from `package.json` dependencies)
- ✅ Build Command: `npm run build` (from `package.json` scripts)
- ✅ Output Directory: `.next` (Next.js default)
- ✅ Install Command: `npm install` (default)

## Troubleshooting

**If you still see "No Next.js version detected":**
- Double-check Root Directory is set to `frontend` (not `/frontend` or `./frontend`)
- Make sure `frontend/package.json` has `"next"` in dependencies
- Redeploy after changing settings

**If build still fails:**
- Check the build logs in Vercel dashboard
- Make sure all devDependencies are needed (tailwindcss, etc. should install)

