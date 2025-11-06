# 🔑 How to Set Up Your Private Key

## The Error You're Seeing

If you see this error:
```
Invalid account: #0 for network: polygonAmoy - private key too short, expected 32 bytes
```

It means your `.env` file still has the placeholder `your_private_key_here` instead of your actual private key.

## ✅ Solution

### Step 1: Get Your Private Key from MetaMask

1. Open **MetaMask** browser extension
2. Click the **three dots (⋮)** in the top right
3. Go to **Settings** → **Security & Privacy**
4. Scroll down and click **"Reveal Private Key"**
5. Enter your MetaMask password
6. **Copy the private key** (it will look like: `0x1234567890abcdef...`)

⚠️ **IMPORTANT**: Never share your private key with anyone! It gives full access to your wallet.

### Step 2: Update Your `.env` File

1. Open the `.env` file in the root directory of your project
2. Find this line:
   ```
   PRIVATE_KEY=your_private_key_here
   ```
3. Replace `your_private_key_here` with your actual private key:
   ```
   PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```
4. **Save the file**

### Step 3: Verify the Format

Your private key should:
- ✅ Start with `0x`
- ✅ Be exactly 66 characters long (including `0x`)
- ✅ Contain only hexadecimal characters (0-9, a-f)

Example of a valid private key:
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Step 4: Test the Configuration

Try running the deployment again:
```bash
npm run deploy:amoy
```

If you still get errors, the deploy script will now show helpful messages about what's wrong.

## 🔒 Security Reminders

1. **Never commit your `.env` file to git** (it's already in `.gitignore`)
2. **Never share your private key** with anyone
3. **Use a separate wallet** for testing/development if possible
4. **Only use testnet** for development and testing

## 🆘 Still Having Issues?

1. Make sure there are **no spaces** around the `=` sign in `.env`
2. Make sure the private key is on **one line** (no line breaks)
3. Make sure you're using the **correct wallet** that has MATIC for gas fees
4. For testnet, get free MATIC from: https://faucet.polygon.technology/

## 📝 Example `.env` File

```env
# Smart Contract Deployment Configuration
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=
```

Replace the `PRIVATE_KEY` value with your actual private key!

