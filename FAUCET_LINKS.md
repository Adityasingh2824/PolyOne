# 🚰 Quick Faucet Links for POL Tokens

## Your Wallet Address
```
0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
```

## 🔗 Direct Faucet Links (Click to Open)

### 1. Polygon Official Faucet (Recommended)
**Link:** https://faucet.polygon.technology/?address=0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
- **Amount:** Variable
- **Cooldown:** 24 hours
- **Steps:**
  1. Click the link above (your address is pre-filled)
  2. Select "Polygon Amoy Testnet"
  3. Complete CAPTCHA
  4. Click "Submit"
  5. Wait 1-2 minutes

### 2. Alchemy Faucet
**Link:** https://www.alchemy.com/faucets/polygon-amoy
- **Amount:** Up to 1 POL per day
- **Cooldown:** 24 hours
- **Steps:**
  1. Click the link above
  2. Connect wallet or paste: `0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8`
  3. Request POL
  4. Wait for confirmation

### 3. Chainlink Faucet
**Link:** https://faucets.chain.link/polygon-amoy
- **Amount:** 0.5 POL per request
- **Cooldown:** 24 hours
- **Steps:**
  1. Click the link above
  2. Enter address: `0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8`
  3. Select Polygon Amoy
  4. Request POL

### 4. Tatum Faucet
**Link:** https://tatum.io/faucets/amoy
- **Amount:** 0.005 POL per day
- **Cooldown:** 24 hours
- **Steps:**
  1. Click the link above
  2. Sign up or log in
  3. Request POL

## 🚀 Quick Command

Run this command to automatically open all faucet pages:

```bash
npm run get:pol
```

## ✅ Check Your Balance

After requesting from faucets, check your balance:

```bash
npm run check:balance
```

## 📊 How Much POL Do You Need?

- **Minimum:** ~0.01 POL (for basic deployment)
- **Recommended:** 0.1 POL (for multiple deployments)
- **Estimated deployment cost:** ~0.05-0.1 POL per contract

## 🎯 Recommended Strategy

1. **Start with Alchemy Faucet** (gives up to 1 POL/day - most generous)
2. **Then try Chainlink** (0.5 POL per request)
3. **Use Polygon Official** as backup
4. **Check balance** after each request: `npm run check:balance`

## ⏱️ Timeline

- **Request tokens:** 1-2 minutes per faucet
- **Wait for tokens:** 1-5 minutes after request
- **Total time:** ~10-15 minutes to get enough POL

## 🆘 Troubleshooting

### "Faucet says I've already requested"
- Try a different faucet
- Wait 24 hours and try again

### "Still showing 0 balance"
- Wait 2-5 more minutes
- Check on Polygonscan: https://amoy.polygonscan.com/address/0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8
- Try another faucet

### "All faucets are exhausted"
- Wait 24 hours
- Try again tomorrow
- Consider using a local network for testing: `npm run node` then `npm run deploy:localhost`

## 🎉 Once You Have POL

Deploy your contracts:

```bash
npm run deploy:amoy
```

Happy deploying! 🚀

