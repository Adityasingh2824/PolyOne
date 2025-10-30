# 🌐 Web3 Integration Guide - PolyOne on Polygon

## 📋 Overview

PolyOne is now a full Web3 application integrated with the **Polygon ecosystem**. This guide will help you set up and deploy the smart contracts, connect wallets, and interact with the blockchain.

## 🔗 Polygon Networks Supported

- ✅ **Polygon PoS Mainnet** (Chain ID: 137)
- ✅ **Polygon Amoy Testnet** (Chain ID: 80002) - Recommended for testing
- ✅ **Polygon zkEVM** (Chain ID: 1101)
- ✅ **Polygon zkEVM Testnet** (Chain ID: 1442)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (includes Hardhat)
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Set Up Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your private key and API keys
nano .env
```

**Important:** Get a private key from MetaMask:
1. Open MetaMask → Settings → Security & Privacy
2. Click "Reveal Private Key"
3. Copy and paste into `.env` file
4. **NEVER commit this file to git!**

### 3. Get Test MATIC

For Polygon Amoy Testnet:
- Visit [Polygon Faucet](https://faucet.polygon.technology/)
- Enter your wallet address
- Request test MATIC

### 4. Compile Smart Contracts

```bash
npm run compile
```

This will compile the Solidity contracts and generate artifacts.

### 5. Deploy to Polygon Testnet

```bash
# Deploy to Polygon Amoy Testnet
npm run deploy:amoy

# Or deploy to local network for testing
npm run node  # In one terminal
npm run deploy:localhost  # In another terminal
```

**Save the deployed contract addresses!** You'll need them for the frontend.

### 6. Update Frontend Configuration

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=PolyOne
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x... # From deployment
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x... # From deployment
NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy
```

### 7. Run the Application

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit http://localhost:3000 🎉

## 📝 Smart Contracts

### ChainFactory.sol

Main contract for managing blockchain deployments:

```solidity
// Create a new chain
function createChain(
    string memory _name,
    string memory _chainType,
    string memory _rollupType,
    string memory _gasToken,
    uint256 _validators,
    string memory _rpcUrl,
    string memory _explorerUrl
) external returns (uint256)
```

**Features:**
- Create blockchain deployments
- Track ownership
- Update chain status
- Delete chains
- Query user's chains

### ChainRegistry.sol

Registry for chain metadata and verification:

```solidity
// Register a chain
function registerChain(
    uint256 _chainId,
    address _contractAddress,
    string memory _name,
    string memory _symbol,
    string memory _cdkVersion,
    string memory _zkevmVersion
) external
```

**Features:**
- Register chain metadata
- Verify chains
- Track CDK/zkEVM versions
- Manage verified deployers

## 🔧 Available Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test:contracts

# Deploy to different networks
npm run deploy:localhost      # Local Hardhat network
npm run deploy:amoy           # Polygon Amoy Testnet
npm run deploy:polygon        # Polygon Mainnet
npm run deploy:zkevm          # Polygon zkEVM

# Verify contracts on Polygonscan
npm run verify -- --network polygonAmoy <CONTRACT_ADDRESS>

# Interact with deployed contracts
node scripts/interact.js
```

## 🦊 MetaMask Setup

### Add Polygon Amoy Testnet

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter details:
   - **Network Name:** Polygon Amoy Testnet
   - **RPC URL:** https://rpc-amoy.polygon.technology
   - **Chain ID:** 80002
   - **Currency Symbol:** MATIC
   - **Block Explorer:** https://amoy.polygonscan.com

Or the dApp will prompt you to add it automatically!

## 💻 Frontend Web3 Integration

### Connect Wallet

```typescript
import { useWallet } from '@/hooks/useWallet'

function MyComponent() {
  const { connect, address, isConnected } = useWallet()

  return (
    <button onClick={connect}>
      {isConnected ? address : 'Connect Wallet'}
    </button>
  )
}
```

### Interact with Contracts

```typescript
import { web3Service } from '@/lib/web3'

// Switch to Polygon
await web3Service.switchToPolygon('POLYGON_AMOY')

// Deploy a contract
const address = await web3Service.deployContract(abi, bytecode, ...args)

// Send transaction
const txHash = await web3Service.sendTransaction(to, amount)
```

## 🧪 Testing

### Run Contract Tests

```bash
npm run test:contracts
```

Tests include:
- ✅ Chain creation
- ✅ Ownership verification
- ✅ Status updates
- ✅ Chain deletion
- ✅ Multiple users

### Test on Local Network

```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts
npm run deploy:localhost

# Terminal 3: Run tests
npm run test:contracts
```

## 📊 Contract Interactions

### Create a Chain

```javascript
const ChainFactory = await ethers.getContractFactory("ChainFactory")
const chainFactory = ChainFactory.attach(contractAddress)

const tx = await chainFactory.createChain(
  "My zkRollup Chain",
  "public",
  "zk-rollup",
  "MYTOKEN",
  3,
  "https://rpc.mychain.io",
  "https://explorer.mychain.io"
)

await tx.wait()
```

### Query Chains

```javascript
// Get total chains
const count = await chainFactory.getTotalChains()

// Get user's chains
const userChains = await chainFactory.getUserChains(address)

// Get chain details
const chain = await chainFactory.getChain(chainId)
```

## 🔐 Security Best Practices

1. **Never commit private keys**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Test on testnet first**
   - Always test on Amoy before mainnet
   - Verify contract code

3. **Audit smart contracts**
   - Have contracts audited before mainnet
   - Follow OpenZeppelin best practices

4. **Use multi-sig for production**
   - Deploy with Gnosis Safe
   - Require multiple approvals

## 📚 Polygon Resources

### Official Documentation
- [Polygon Docs](https://docs.polygon.technology/)
- [Polygon CDK](https://docs.polygon.technology/cdk/)
- [zkEVM Docs](https://docs.polygon.technology/zkevm/)
- [AggLayer](https://docs.polygon.technology/agglayer/)

### Developer Tools
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Polygonscan](https://polygonscan.com/)
- [Polygon RPC](https://rpc.polygon.technology/)

### Community
- [Polygon Discord](https://discord.gg/polygon)
- [Polygon Forum](https://forum.polygon.technology/)
- [GitHub](https://github.com/0xpolygon)

## 🎯 Next Steps

1. ✅ Deploy contracts to Polygon Amoy
2. ✅ Connect MetaMask wallet
3. ✅ Create your first blockchain
4. ✅ Integrate Polygon CDK for actual deployment
5. ✅ Connect to AggLayer for interoperability
6. ✅ Build your dApp on your custom chain

## 💡 Example Use Cases

### DeFi Platform
Deploy a private chain for your DeFi protocol with custom gas tokens

### Gaming
Launch a high-performance gaming chain with instant finality

### Enterprise
Create a permissioned chain for supply chain tracking

### NFT Marketplace
Deploy a scalable chain optimized for NFT transactions

## 🆘 Troubleshooting

### "Insufficient funds"
- Get test MATIC from faucet
- Check you're on the right network

### "Contract not deployed"
- Run deployment script first
- Update contract addresses in `.env.local`

### "Transaction failed"
- Check gas limits
- Verify network connection
- Check contract ABI matches deployed version

### "MetaMask not detected"
- Install MetaMask extension
- Refresh the page
- Check browser console for errors

## 📞 Support

- 📖 Read the [full documentation](../README.md)
- 💬 Join [Polygon Discord](https://discord.gg/polygon)
- 🐛 Report [issues on GitHub](https://github.com/Adityasingh2824/PolyOne/issues)

---

**Built with ❤️ on Polygon** 🟣

