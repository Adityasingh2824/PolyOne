const hre = require("hardhat")

async function main() {
  console.log("🚀 Deploying PolyOne Smart Contracts to Polygon Network...")

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log("📝 Deploying contracts with account:", deployer.address)

  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC/ETH")

  // Deploy ChainFactory
  console.log("\n🏗️  Deploying ChainFactory...")
  const ChainFactory = await hre.ethers.getContractFactory("ChainFactory")
  const chainFactory = await ChainFactory.deploy()
  await chainFactory.waitForDeployment()
  const chainFactoryAddress = await chainFactory.getAddress()
  console.log("✅ ChainFactory deployed to:", chainFactoryAddress)

  // Deploy ChainRegistry
  console.log("\n🏗️  Deploying ChainRegistry...")
  const ChainRegistry = await hre.ethers.getContractFactory("ChainRegistry")
  const chainRegistry = await ChainRegistry.deploy()
  await chainRegistry.waitForDeployment()
  const chainRegistryAddress = await chainRegistry.getAddress()
  console.log("✅ ChainRegistry deployed to:", chainRegistryAddress)

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      ChainFactory: chainFactoryAddress,
      ChainRegistry: chainRegistryAddress
    },
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  }

  console.log("\n📋 Deployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))

  // Save to file
  const fs = require("fs")
  const path = require("path")
  
  const deploymentDir = path.join(__dirname, "../deployments")
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true })
  }

  const deploymentFile = path.join(
    deploymentDir,
    `${hre.network.name}-${Date.now()}.json`
  )
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))
  console.log("\n💾 Deployment info saved to:", deploymentFile)

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts, run:")
    console.log(`npx hardhat verify --network ${hre.network.name} ${chainFactoryAddress}`)
    console.log(`npx hardhat verify --network ${hre.network.name} ${chainRegistryAddress}`)
  }

  console.log("\n✨ Deployment complete!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })

