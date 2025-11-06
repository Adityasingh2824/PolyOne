# Vercel Deployment - Root Directory Setup

## ⚠️ IMPORTANT: Set Root Directory

Since this is a monorepo, you **MUST** set the Root Directory in Vercel Dashboard:

### Steps:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `poly-one`
3. **Go to Settings** → **General**
4. **Scroll to "Root Directory"** section
5. **Click "Edit"** and set it to: `frontend`
6. **Save** the changes

### Why?

Vercel needs to know where your `package.json` with Next.js is located. Since it's in the `frontend` subdirectory (not the root), you must configure this in the dashboard.

### After Setting Root Directory:

Once you've set the Root Directory to `frontend` in the dashboard:

1. The `vercel.json` will automatically use the correct paths
2. Vercel will detect Next.js correctly
3. Your deployment should work

### Alternative: Remove vercel.json

If you prefer, you can delete `vercel.json` entirely and just set:
- **Root Directory**: `frontend`
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

All of these will be auto-detected once Root Directory is set to `frontend`.

---

## Quick Fix Command

After setting Root Directory in dashboard, redeploy:

```bash
vercel --prod
```

