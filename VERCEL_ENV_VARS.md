# 🔐 Vercel Environment Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

### ChainFactory Contract Address
```
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
```

### ChainRegistry Contract Address
```
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
```

### Default Network
```
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

## Optional Variables

### Backend API URL (if you deploy backend separately)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
```

Or leave it as default (will use localhost for development, but backend is optional anyway).

## How to Add in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name and value
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. **Redeploy** your project for changes to take effect

## Quick Copy-Paste (All at Once)

```
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

## Verify Variables

After deployment, check that variables are loaded:
1. Visit your Vercel URL
2. Open browser console (F12)
3. Check that `process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS` is set

## Important Notes

- Variables must start with `NEXT_PUBLIC_` to be available in the browser
- After adding variables, you must **redeploy** for them to take effect
- Variables are available at **build time**, not runtime
- Never commit `.env.local` files to git (they're already in .gitignore)

