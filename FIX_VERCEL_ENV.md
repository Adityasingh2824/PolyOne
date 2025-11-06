# 🔧 Fix: Chain Factory Contract Not Configured on Vercel

## Problem

After deploying to Vercel, you're seeing the error: **"Chain Factory Contract Not Configured"**

This happens because environment variables are not set in your Vercel project.

## ✅ Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on your **PolyOne project**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Variables

Click **"Add New"** for each variable and add:

#### Variable 1: ChainFactory Address
- **Key**: `NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS`
- **Value**: `0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: ChainRegistry Address
- **Key**: `NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS`
- **Value**: `0x457e9323366369c04b8e0Db2e409d5E9f3B60252`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: Default Network
- **Key**: `NEXT_PUBLIC_DEFAULT_NETWORK`
- **Value**: `polygonAmoy`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Step 3: Redeploy

**IMPORTANT**: After adding environment variables, you MUST redeploy!

1. Go to **Deployments** tab
2. Click the **three dots (⋮)** on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a new deployment

## 🎯 Quick Copy-Paste

Here are all the variables you need (copy each one):

```
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
```

```
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
```

```
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

## ✅ Verify It's Working

After redeploying:

1. Visit your Vercel URL
2. Go to the "Create Chain" page
3. The error message should be gone
4. You should be able to create chains

## 🔍 Troubleshooting

### Still seeing the error?

1. **Check variable names**: Must be exactly `NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS` (case-sensitive)
2. **Check you redeployed**: Environment variables only apply to new deployments
3. **Check browser console**: Open DevTools (F12) and check for errors
4. **Verify in build logs**: Check Vercel build logs to see if variables are being used

### How to Check if Variables are Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see all three variables listed
3. Make sure they're enabled for the correct environments

### Test Locally First

Before deploying, test locally:

1. Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
   NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
   NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
   ```

2. Restart your dev server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Check if the error is gone

## 📝 Visual Guide

### In Vercel Dashboard:

```
Settings → Environment Variables → Add New

┌─────────────────────────────────────────┐
│ Key: NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS  │
│ Value: 0x7Eb4d5BeC7aabA9e758A50188...   │
│                                         │
│ ☑ Production                            │
│ ☑ Preview                                │
│ ☑ Development                            │
│                                         │
│ [Save]                                   │
└─────────────────────────────────────────┘
```

## 🎉 After Fixing

Once you've added the variables and redeployed:
- ✅ Error message will disappear
- ✅ You can create chains
- ✅ On-chain registration will work
- ✅ Everything will function normally

## 💡 Pro Tip

You can also set these via Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS production
# Paste: 0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c

vercel env add NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS production
# Paste: 0x457e9323366369c04b8e0Db2e409d5E9f3B60252

vercel env add NEXT_PUBLIC_DEFAULT_NETWORK production
# Paste: polygonAmoy
```

Then redeploy: `vercel --prod`

