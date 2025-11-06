# 🚀 Deploy PolyOne to Vercel - Complete Guide

## ✅ What's Ready

Your project is now configured for Vercel deployment! Here's what's been set up:

- ✅ `frontend/vercel.json` - Vercel configuration
- ✅ `frontend/next.config.js` - Next.js configuration with environment variables
- ✅ `frontend/.vercelignore` - Files to exclude from deployment
- ✅ Contract addresses configured

## 🎯 Quick Start (5 Minutes)

### Method 1: Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository

3. **Configure Project**:
   - **Root Directory**: `frontend` ⚠️ **CRITICAL - MUST SET THIS!**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add these (see `VERCEL_ENV_VARS.md` for details):
     ```
     NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
     NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
     NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
     ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from frontend directory)
cd frontend
vercel

# Deploy to production
vercel --prod
```

## 📋 Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS` | `0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c` |
| `NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS` | `0x457e9323366369c04b8e0Db2e409d5E9f3B60252` |
| `NEXT_PUBLIC_DEFAULT_NETWORK` | `polygonAmoy` |

See `VERCEL_ENV_VARS.md` for detailed instructions.

## ⚠️ Critical: Root Directory

**YOU MUST SET ROOT DIRECTORY TO `frontend` IN VERCEL DASHBOARD!**

1. Go to: Vercel Dashboard → Your Project → Settings → General
2. Find: "Root Directory"
3. Click: "Edit"
4. Set to: `frontend`
5. Click: "Save"
6. Redeploy

**Why?** Your Next.js app is in the `frontend` subdirectory, not the root.

## 🔍 Verify Deployment

After deployment:

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Test wallet connection**: Connect MetaMask
3. **Test chain creation**: Try creating a chain
4. **Check console**: Open browser DevTools (F12) and check for errors

## 🐛 Troubleshooting

### Build Fails

**Problem**: Build fails with "No Next.js version detected"

**Solution**:
- ✅ Set Root Directory to `frontend` in Vercel Dashboard
- ✅ Make sure `frontend/package.json` has `"next"` in dependencies
- ✅ Check Node.js version is 18+ in Vercel Settings

### Environment Variables Not Working

**Problem**: Contract addresses not found

**Solution**:
- ✅ Variables must start with `NEXT_PUBLIC_`
- ✅ Redeploy after adding variables
- ✅ Check variable names are correct (case-sensitive)
- ✅ Verify in browser console: `process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS`

### Wallet Connection Issues

**Problem**: MetaMask not connecting

**Solution**:
- ✅ Check you're on Polygon Amoy Testnet
- ✅ Verify contract addresses are set correctly
- ✅ Check browser console for errors
- ✅ Make sure HTTPS is enabled (Vercel provides this automatically)

## 📚 Project Structure

```
PolyOne/
├── frontend/          ← Vercel deploys from here
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── vercel.json
├── backend/           ← Not deployed to Vercel (optional)
├── contracts/         ← Not deployed to Vercel
└── scripts/           ← Not deployed to Vercel
```

## 🎉 What Happens After Deployment

1. ✅ Your frontend is live on Vercel
2. ✅ Wallet connection works
3. ✅ Chain creation works (on-chain registration)
4. ✅ Backend is optional (chains work without it)

## 📝 Next Steps

1. **Set Custom Domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

2. **Enable Analytics**:
   - Vercel Dashboard → Analytics
   - Track page views and performance

3. **Set Up Monitoring**:
   - Vercel Dashboard → Monitoring
   - Get alerts for errors

4. **Deploy Backend** (optional):
   - Backend can be deployed separately
   - Or use Vercel Serverless Functions
   - Or keep it local (backend is optional)

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Your Contract on Polygonscan**: https://amoy.polygonscan.com/address/0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root Directory set to `frontend`
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Tested wallet connection
- [ ] Tested chain creation
- [ ] Custom domain configured (optional)

## 🎊 Success!

Your PolyOne app is now live on Vercel! 🚀

For questions or issues, check:
- `VERCEL_DEPLOY_NOW.md` - Quick deployment guide
- `VERCEL_ENV_VARS.md` - Environment variables reference
- Vercel Dashboard logs for build errors

Happy deploying! 🎉

