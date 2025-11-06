# 🚀 Chain Factory Deployment Guide

This guide will help you deploy the ChainFactory contract and configure it for on-chain chain registration.

## 📋 Prerequisites

1. **MetaMask or compatible wallet** with test POL (for Polygon Amoy) or MATIC (for Polygon Mainnet)
   - **Important:** Polygon Amoy Testnet uses **POL**, not MATIC!
2. **Node.js** and npm installed
3. **Private key** from your wallet (for deployment)

## 🔧 Step 1: Get Your Private Key

1. Open MetaMask
2. Go to Settings → Security & Privacy
3. Click "Reveal Private Key"
4. Enter your password
5. Copy the private key (keep it secure!)

## 🔑 Step 2: Configure Environment Variables

### Root Directory `.env` File

Create a `.env` file in the root directory of the project:

```env
# Your wallet private key (NEVER commit this to git!)
PRIVATE_KEY=your_private_key_here

# Polygon Amoy Testnet (Recommended for testing)
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Polygon Mainnet (For production)
POLYGON_RPC_URL=https://polygon-rpc.com

# Optional: For contract verification on Polygonscan
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**⚠️ Important:** Add `.env` to your `.gitignore` file to prevent committing your private key!

## 📦 Step 3: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## 🏗️ Step 4: Compile Contracts

Compile the smart contracts:

```bash
npm run compile
```

## 🚀 Step 5: Deploy the Contract

### Option A: Deploy to Polygon Amoy Testnet (Recommended for Testing)

```bash
npm run deploy:amoy
```

### Option B: Deploy to Polygon Mainnet (For Production)

```bash
npm run deploy:polygon
```

### Option C: Deploy to Local Network (For Development)

First, start a local Hardhat node in one terminal:

```bash
npm run node
```

Then, in another terminal, deploy:

```bash
npm run deploy:localhost
```

## 📝 Step 6: Save the Contract Address

After deployment, you'll see output like this:

```
✅ ChainFactory deployed to: 0x1234567890123456789012345678901234567890
✅ ChainRegistry deployed to: 0x0987654321098765432109876543210987654321
```

**Copy the ChainFactory address** - you'll need it in the next step.

## ⚙️ Step 7: Configure Frontend

Update `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x1234567890123456789012345678901234567890
```

Replace `0x1234567890123456789012345678901234567890` with your actual deployed contract address.

## 🔄 Step 8: Restart Frontend Server

If your frontend server is running, restart it to load the new environment variable:

```bash
# Stop the server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

## ✅ Step 9: Verify Configuration

1. Open your frontend application
2. Navigate to the "Create Chain" page
3. You should **NOT** see the red warning about Chain Factory contract not being configured
4. Connect your wallet
5. Try creating a chain - it should now register on-chain!

## 🔍 Step 10: Verify Contract on Polygonscan (Optional)

To verify your contract on Polygonscan:

```bash
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS>
```

Or for mainnet:

```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## 🐛 Troubleshooting

### Error: "Insufficient funds"
- Make sure your wallet has enough tokens for gas fees
  - **Polygon Amoy Testnet:** Get free POL from [Polygon Faucet](https://faucet.polygon.technology/)
  - **Polygon Mainnet:** Purchase MATIC from an exchange

### Error: "Nonce too high"
- Reset your MetaMask account: Settings → Advanced → Reset Account

### Error: "Contract not configured" still showing
- Make sure you added `NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS` to `frontend/.env.local`
- Restart your frontend server
- Clear browser cache and reload

### Error: "Network not supported"
- Make sure you're deploying to Polygon Amoy (testnet) or Polygon Mainnet
- Check your RPC URL in the `.env` file

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Polygon Faucet](https://faucet.polygon.technology/) (for testnet POL on Amoy)
- [Alchemy Faucet](https://www.alchemy.com/faucets/polygon-amoy) (up to 1 POL/day)
- [Chainlink Faucet](https://faucets.chain.link/polygon-amoy) (0.5 POL/request)

## 🔐 Security Notes

1. **NEVER** commit your `.env` file or private key to git
2. Use testnet for development and testing
3. Only use mainnet when you're ready for production
4. Keep your private key secure and never share it

## 🎉 Success!

Once configured, all chain creations will be registered on-chain on the Polygon network, providing:
- ✅ Immutable chain registration
- ✅ Transparent chain ownership
- ✅ On-chain chain metadata
- ✅ Full blockchain integration

Happy deploying! 🚀

