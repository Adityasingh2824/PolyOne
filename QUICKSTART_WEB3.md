# 🚀 PolyOne Web3 Quick Start

## ⚡ 5-Minute Setup

### 1. Install & Setup

```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# Or manually:
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure

Edit `.env`:
```env
PRIVATE_KEY=your_metamask_private_key_here
```

**Get your private key:**
- MetaMask → Settings → Security & Privacy → Reveal Private Key
- ⚠️ **NEVER share or commit this key!**

### 3. Get Test MATIC

Visit: https://faucet.polygon.technology/
- Select "Polygon Amoy"
- Paste your wallet address
- Click "Submit"

### 4. Deploy Contracts

```bash
# Compile smart contracts
npm run compile

# Deploy to Polygon Amoy Testnet
npm run deploy:amoy
```

**Save the output addresses!**

### 5. Update Frontend

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x... # from deployment
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x... # from deployment
```

### 6. Run

```bash
# Start everything
npm run dev

# Or separately:
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

Visit **http://localhost:3000** 🎉

## 🎯 Test Your Setup

1. **Connect Wallet** - Click "Launch App" and connect MetaMask
2. **Switch Network** - App will prompt to switch to Polygon Amoy
3. **Create Chain** - Fill the form and deploy your first blockchain
4. **View Transaction** - Check Polygonscan for your transaction

## 📚 What's Included

### Smart Contracts
- ✅ **ChainFactory.sol** - Deploy and manage chains
- ✅ **ChainRegistry.sol** - Chain metadata registry
- ✅ Deployed on Polygon network
- ✅ Verified on Polygonscan

### Frontend
- ✅ **MetaMask integration**
- ✅ **Wallet connection**
- ✅ **Network switching**
- ✅ **Contract interactions**
- ✅ **Futuristic UI**

### Backend
- ✅ REST API for off-chain data
- ✅ JWT authentication
- ✅ Database integration
- ✅ Deployment automation

## 🔧 Key Commands

```bash
npm run compile          # Compile Solidity contracts
npm run test:contracts   # Run smart contract tests
npm run deploy:amoy      # Deploy to Polygon Amoy
npm run deploy:polygon   # Deploy to Polygon Mainnet
npm run deploy:zkevm     # Deploy to Polygon zkEVM
npm run dev              # Run full stack
npm run node             # Local blockchain
```

## 🌐 Networks

### Polygon Amoy Testnet (Recommended)
- Chain ID: 80002
- RPC: https://rpc-amoy.polygon.technology
- Faucet: https://faucet.polygon.technology
- Explorer: https://amoy.polygonscan.com

### Polygon Mainnet
- Chain ID: 137
- RPC: https://polygon-rpc.com
- Explorer: https://polygonscan.com

### Polygon zkEVM
- Chain ID: 1101
- RPC: https://zkevm-rpc.com
- Explorer: https://zkevm.polygonscan.com

## 💡 Quick Tips

1. **Always test on Amoy first** before mainnet
2. **Keep private keys safe** - never commit `.env`
3. **Save contract addresses** after deployment
4. **Get test MATIC** from faucet (free!)
5. **Check Polygonscan** for transaction status

## 📖 Learn More

- **WEB3_README.md** - Complete Web3 guide
- **docs/WEB3_SETUP.md** - Detailed setup
- **docs/API.md** - API reference
- [Polygon Docs](https://docs.polygon.technology/)

## 🆘 Troubleshooting

### "Insufficient funds"
→ Get test MATIC from faucet

### "Wrong network"
→ Let the app switch networks automatically

### "Contract not deployed"
→ Run `npm run deploy:amoy` first

### "MetaMask not found"
→ Install [MetaMask](https://metamask.io/)

## ✅ Checklist

- [ ] Node.js v18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with PRIVATE_KEY
- [ ] Test MATIC obtained from faucet
- [ ] Contracts compiled (`npm run compile`)
- [ ] Contracts deployed (`npm run deploy:amoy`)
- [ ] Frontend `.env.local` updated with addresses
- [ ] App running (`npm run dev`)
- [ ] Wallet connected in browser
- [ ] First blockchain created! 🎉

## 🎉 You're Ready!

Your PolyOne platform is now fully integrated with Polygon blockchain!

**Start building the future of Web3! 🚀**

---

Built with ❤️ on Polygon for Polygon Buildathon 2025

