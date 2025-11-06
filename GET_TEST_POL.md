# 💰 How to Get Test POL for Polygon Amoy Testnet

## 🎯 Important: Polygon Amoy Uses POL, Not MATIC!

**Polygon Amoy Testnet** uses **POL** as its native token, not MATIC. This is important for gas fees and deployment.

## 📋 Network Details

- **Network Name:** Polygon Amoy Testnet
- **Chain ID:** 80002
- **Native Token:** POL (not MATIC)
- **RPC URL:** https://rpc-amoy.polygon.technology/
- **Block Explorer:** https://amoy.polygonscan.com/

## 🎯 Quick Solution

Your wallet needs test POL (Polygon Amoy testnet tokens) to pay for gas fees when deploying contracts.

**Your Wallet Address:** `0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8`

## 📋 Step-by-Step Guide

### Option 1: Polygon Official Faucet (Recommended)

1. **Visit the faucet:**
   - Go to: https://faucet.polygon.technology/

2. **Enter your wallet address:**
   ```
   0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
   ```

3. **Select network:**
   - Choose **"Polygon Amoy Testnet"**

4. **Complete the CAPTCHA** and click "Submit"

5. **Wait 1-2 minutes** for the POL tokens to arrive

6. **Check your balance:**
   ```bash
   npm run check:balance
   ```

### Option 2: Alchemy Faucet (Up to 1 POL/day)

1. Visit: https://www.alchemy.com/faucets/polygon-amoy
2. Connect your wallet or paste your address
3. Request test POL (up to 1 POL per day)
4. Wait for confirmation

### Option 3: Chainlink Faucet (0.5 POL/request)

1. Visit: https://faucets.chain.link/polygon-amoy
2. Enter your wallet address
3. Select Polygon Amoy network
4. Request 0.5 POL per request

### Option 4: Tatum Faucet (0.005 POL/day)

1. Visit: https://tatum.io/faucets/amoy
2. Sign up or log in
3. Request 0.005 POL daily

## ✅ Verify You Have POL

After requesting from the faucet, check your balance:

```bash
npm run check:balance
```

You should see:
```
💰 Current Balance: X.XXXX POL (Amoy Testnet)
✅ You have enough POL for deployment!
```

## 🚀 Deploy After Getting POL

Once you have POL in your wallet:

```bash
npm run deploy:amoy
```

## 💡 How Much POL Do You Need?

- **Minimum:** ~0.01 POL (for basic deployment)
- **Recommended:** 0.1 POL (for multiple deployments)
- **Typical deployment cost:** ~0.03-0.05 POL per contract

## 🔍 Check Balance Anytime

You can check your wallet balance anytime with:

```bash
npm run check:balance
```

This will show:
- Your wallet address
- Current balance in POL
- Estimated deployment cost
- Links to faucets if balance is low

## 🆘 Troubleshooting

### "Still showing 0 balance after requesting"

1. **Wait a few more minutes** - Faucets can take 2-5 minutes
2. **Check the transaction on Polygonscan:**
   - Visit: https://amoy.polygonscan.com/address/0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
   - Look for incoming transactions

3. **Try a different faucet** if one doesn't work

### "Faucet says I've already requested"

- Some faucets have cooldown periods (24 hours)
- Try a different faucet from the list above
- Or wait 24 hours and try again

### "Network error when checking balance"

- Make sure your internet connection is working
- Check if the RPC URL in `.env` is correct:
  ```
  POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
  ```

## 📝 Direct Links

- **Polygon Faucet:** https://faucet.polygon.technology/?address=0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
- **Alchemy Faucet:** https://www.alchemy.com/faucets/polygon-amoy
- **Chainlink Faucet:** https://faucets.chain.link/polygon-amoy
- **Tatum Faucet:** https://tatum.io/faucets/amoy
- **View on Polygonscan:** https://amoy.polygonscan.com/address/0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8

## 🔄 Difference: POL vs MATIC

- **POL:** Used on Polygon Amoy Testnet (Chain ID: 80002)
- **MATIC:** Used on Polygon Mainnet (Chain ID: 137)

Make sure you're requesting POL for Amoy testnet, not MATIC!

## 🎉 Next Steps

Once you have POL:
1. ✅ Run `npm run check:balance` to verify
2. ✅ Run `npm run deploy:amoy` to deploy contracts
3. ✅ Copy the contract addresses from the output
4. ✅ Update `frontend/.env.local` with the ChainFactory address
5. ✅ Restart your frontend server

Happy deploying! 🚀

