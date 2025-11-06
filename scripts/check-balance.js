const hre = require("hardhat")
require("dotenv").config()

async function main() {
  console.log("🔍 Checking Wallet Balance...\n")

  // Get deployer account
  const signers = await hre.ethers.getSigners()
  if (!signers || signers.length === 0) {
    console.error("❌ Error: No signers available. Check your PRIVATE_KEY in .env file")
    process.exit(1)
  }

  const deployer = signers[0]
  const address = deployer.address

  console.log("📝 Wallet Address:", address)
  console.log("🌐 Network:", hre.network.name)
  console.log("")

  try {
    const balance = await hre.ethers.provider.getBalance(address)
    const balanceInEther = hre.ethers.formatEther(balance)
    const balanceAmount = parseFloat(balanceInEther)
    
    // Determine token name based on network
    const networkName = hre.network.name
    const isAmoy = networkName === "polygonAmoy" || hre.network.config.chainId === 80002
    const tokenName = isAmoy ? "POL" : "MATIC"
    const tokenDisplay = isAmoy ? "POL (Amoy Testnet)" : "MATIC"

    console.log("💰 Current Balance:", balanceAmount.toFixed(4), tokenDisplay)
    console.log("")

    if (balanceAmount === 0) {
      console.log(`❌ Your wallet has 0 ${tokenName}!`)
      console.log("")
      
      if (isAmoy) {
        console.log(`📋 To get test ${tokenName} (POL):`)
        console.log("")
        console.log("1. Visit: https://faucet.polygon.technology/")
        console.log("2. Enter your wallet address:", address)
        console.log("3. Select 'Polygon Amoy Testnet'")
        console.log("4. Complete the CAPTCHA and request POL")
        console.log("5. Wait 1-2 minutes for the tokens to arrive")
        console.log("")
        console.log("🔗 Direct link with your address:")
        console.log(`   https://faucet.polygon.technology/?address=${address}`)
        console.log("")
        console.log("💡 Alternative faucets for POL:")
        console.log("   - https://www.alchemy.com/faucets/polygon-amoy (up to 1 POL/day)")
        console.log("   - https://faucets.chain.link/polygon-amoy (0.5 POL/request)")
        console.log("   - https://tatum.io/faucets/amoy (0.005 POL/day)")
        console.log("")
      } else {
        console.log(`📋 To get ${tokenName}:`)
        console.log("")
        console.log("   Mainnet: Purchase MATIC from an exchange")
        console.log("   Testnet: https://faucet.polygon.technology/")
        console.log("")
      }
    } else if (balanceAmount < 0.01) {
      console.log("⚠️  Warning: Low balance!")
      console.log(`   You may not have enough ${tokenName} for deployment.`)
      console.log(`   Recommended: At least 0.1 ${tokenName}`)
      console.log("")
      if (isAmoy) {
        console.log(`📋 Get more test ${tokenName}:`)
        console.log("   https://faucet.polygon.technology/")
        console.log("   https://www.alchemy.com/faucets/polygon-amoy")
        console.log("")
      } else {
        console.log(`📋 Get more ${tokenName}:`)
        console.log("   https://faucet.polygon.technology/")
        console.log("")
      }
    } else {
      console.log(`✅ You have enough ${tokenName} for deployment!`)
      console.log("   You can now run: npm run deploy:amoy")
      console.log("")
    }

    // Estimate gas cost
    try {
      const gasPrice = await hre.ethers.provider.getFeeData()
      const estimatedGas = 3000000n // Rough estimate for contract deployment
      const estimatedCost = gasPrice.gasPrice * estimatedGas
      const estimatedCostInToken = hre.ethers.formatEther(estimatedCost)
      
      console.log("📊 Estimated deployment cost: ~", parseFloat(estimatedCostInToken).toFixed(6), tokenName)
      console.log("")
    } catch (e) {
      // Ignore gas estimation errors
    }

  } catch (error) {
    console.error("❌ Error checking balance:", error.message)
    console.error("   This might indicate a network connection issue")
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })

