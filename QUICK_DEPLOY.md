# ⚡ Quick Deploy Guide - Chain Factory Contract

## 🎯 Quick Setup (5 minutes)

### Step 1: Get Your Private Key
1. Open MetaMask → Settings → Security & Privacy
2. Click "Reveal Private Key"
3. Copy it (keep it secret!)

### Step 2: Create Root `.env` File
Create `.env` in the root directory:
```env
PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### Step 3: Deploy Contract
```bash
npm run deploy:amoy
```

### Step 4: Copy Contract Address
After deployment, copy the ChainFactory address (looks like `0x1234...`)

### Step 5: Update Frontend Config
Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x1234...  # Paste your address here
```

### Step 6: Restart Frontend
```bash
cd frontend
npm run dev
```

## ✅ Done!
Now you can create chains on-chain! 🚀

## 🆘 Need Help?
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔑 Get Test MATIC
- [Polygon Faucet](https://faucet.polygon.technology/) - Get free test MATIC

