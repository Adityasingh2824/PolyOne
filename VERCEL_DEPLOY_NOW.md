# 🚀 Deploy PolyOne to Vercel - Quick Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free)
2. **GitHub Repository**: Your code should be on GitHub
3. **Vercel CLI** (optional): `npm i -g vercel`

## 🎯 Quick Deployment (3 Steps)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your **GitHub repository** (PolyOne)
4. Click **"Import"**

### Step 3: Configure Project Settings

**IMPORTANT: Set Root Directory**

1. In the project configuration page, find **"Root Directory"**
2. Click **"Edit"** and set it to: `frontend`
3. Click **"Continue"**

**Framework Settings** (should auto-detect):
- Framework Preset: **Next.js** ✅
- Build Command: `npm run build` ✅
- Output Directory: `.next` ✅
- Install Command: `npm install` ✅

**Environment Variables** (Click "Environment Variables" and add):

```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

4. Click **"Deploy"**

## ✅ That's It!

Your app will be live at: `https://your-project.vercel.app`

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS` | `0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c` | ChainFactory contract address |
| `NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS` | `0x457e9323366369c04b8e0Db2e409d5E9f3B60252` | ChainRegistry contract address |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API URL (optional) |
| `NEXT_PUBLIC_DEFAULT_NETWORK` | `polygonAmoy` | Default network |

## 📝 Alternative: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
cd frontend
vercel

# Deploy to production
vercel --prod
```

## 🔍 Verify Deployment

1. Visit your Vercel URL
2. Connect your wallet
3. Try creating a chain
4. Check that on-chain registration works

## 🐛 Troubleshooting

### Build Fails

- **Check Root Directory**: Must be set to `frontend` in Vercel Dashboard
- **Check Node Version**: Should be 18+ (set in Vercel Settings → General → Node.js Version)
- **Check Build Logs**: View in Vercel Dashboard → Deployments → [Your Deployment] → Build Logs

### Environment Variables Not Working

- **Check Variable Names**: Must start with `NEXT_PUBLIC_` for client-side access
- **Redeploy**: After adding variables, trigger a new deployment
- **Check Build Logs**: Variables are available at build time

### Wallet Connection Issues

- **Check Contract Addresses**: Verify they're set correctly in environment variables
- **Check Network**: Make sure you're on Polygon Amoy Testnet
- **Check Browser Console**: Look for errors

## 📚 Next Steps

1. **Set Custom Domain** (optional): Vercel Dashboard → Settings → Domains
2. **Enable Analytics**: Vercel Dashboard → Analytics
3. **Set Up Monitoring**: Vercel Dashboard → Monitoring
4. **Configure Backend** (if needed): Deploy backend separately or use serverless functions

## 🎉 Success!

Your PolyOne app is now live on Vercel! 🚀

For more help, see:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

