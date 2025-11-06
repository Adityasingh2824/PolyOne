# ⚡ Quick Fix: Vercel Environment Variables

## 🚨 Problem
Seeing "Chain Factory Contract Not Configured" on your Vercel site.

## ✅ Solution (2 Minutes)

### 1. Go to Vercel Dashboard
https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### 2. Add These 3 Variables

Click "Add New" and add each one:

**Variable 1:**
```
Key: NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
Value: 0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
```

**Variable 2:**
```
Key: NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS
Value: 0x457e9323366369c04b8e0Db2e409d5E9f3B60252
```

**Variable 3:**
```
Key: NEXT_PUBLIC_DEFAULT_NETWORK
Value: polygonAmoy
```

**For each variable:**
- ✅ Check "Production"
- ✅ Check "Preview"  
- ✅ Check "Development"
- Click "Save"

### 3. Redeploy

**IMPORTANT**: You must redeploy after adding variables!

- Go to **Deployments** tab
- Click **⋮** on latest deployment
- Click **"Redeploy"**

OR push a new commit to trigger deployment.

## ✅ Done!

After redeploy, the error will be gone and you can create chains! 🎉

See `FIX_VERCEL_ENV.md` for detailed instructions.

