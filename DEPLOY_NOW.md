# 🚀 Deploy to Vercel - Right Now!

## Quick Deployment Steps

### Option 1: Deploy via Vercel CLI (Fastest)

```bash
# Navigate to frontend directory
cd frontend

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No (or Yes if you have one)
# - Project name? polyone (or your preferred name)
# - Directory? ./ (current directory)
# - Override settings? No

# After deployment, deploy to production:
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub first**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository

3. **Configure**:
   - **Root Directory**: `frontend` ⚠️ **CRITICAL!**
   - Framework: Next.js (auto-detected)
   - Click "Deploy"

## ⚠️ CRITICAL: After Deployment

### 1. Set Root Directory (if using Dashboard)

1. Go to: Vercel Dashboard → Your Project → Settings → General
2. Find: "Root Directory"
3. Set to: `frontend`
4. Save

### 2. Add Environment Variables

Go to: **Settings → Environment Variables** and add:

```
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

**For each variable:**
- Enable for: Production, Preview, Development
- Click "Save"

### 3. Redeploy

After adding environment variables, **redeploy**:
- Go to Deployments tab
- Click ⋮ on latest deployment
- Click "Redeploy"

## ✅ Done!

Your app will be live at: `https://your-project.vercel.app`

## 🎯 Quick Commands

```bash
# Deploy to preview
cd frontend
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```
