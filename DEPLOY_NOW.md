# 🚀 Deploy to Vercel - Quick Guide

## Step 1: Set Root Directory (REQUIRED)

**⚠️ CRITICAL:** You MUST set Root Directory in Vercel Dashboard first:

1. Go to: https://vercel.com/dashboard
2. Click on your project: `poly-one`
3. Go to: **Settings** → **General**
4. Scroll to: **Root Directory**
5. Click **Edit** and set it to: `frontend`
6. Click **Save**

**This step is REQUIRED - deployment will fail without it!**

## Step 2: Deploy

After setting Root Directory, run:

```bash
vercel --prod
```

Or if you want a preview deployment first:

```bash
vercel
```

## What Happens

With Root Directory = `frontend`, Vercel will:
- ✅ Upload only the `frontend` directory
- ✅ Auto-detect Next.js
- ✅ Install dependencies from `frontend/package.json`
- ✅ Run `npm run build` (which runs `next build`)
- ✅ Deploy your app

## Environment Variables (Optional but Recommended)

Before deploying, set these in Vercel Dashboard → Settings → Environment Variables:

- `JWT_SECRET` - For authentication (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your Vercel URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` - For NextAuth.js (generate with: `openssl rand -base64 32`)

## Troubleshooting

**"No Next.js version detected"**
- Root Directory is not set to `frontend` - check dashboard

**Build fails with "Cannot find module 'tailwindcss'"**
- Make sure Root Directory is set correctly
- Dependencies should install automatically

**"cd: backend: No such file or directory"**
- Root Directory is not set - Vercel is using root package.json instead




