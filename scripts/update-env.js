#!/usr/bin/env node
/**
 * Script to update environment variables from latest deployment
 * Usage: node scripts/update-env.js [network]
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config()

const network = process.argv[2] || 'polygonAmoy'
const deploymentFile = path.join(__dirname, '..', 'deployments', `${network}-latest.json`)

if (!fs.existsSync(deploymentFile)) {
  console.error(`❌ Deployment file not found: ${deploymentFile}`)
  console.error(`   Please deploy contracts first using: npm run deploy:${network}`)
  process.exit(1)
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
const contracts = deployment.contracts

console.log('📝 Updating environment variables from deployment...')
console.log(`   Network: ${network}`)
console.log(`   Chain ID: ${deployment.chainId}`)
console.log(`   Deployer: ${deployment.deployer}`)

// Generate .env updates
const envUpdates = {
  frontend: {
    file: path.join(__dirname, '..', 'frontend', '.env.local'),
    vars: {
      'NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS': contracts.PolyOneChainFactory || contracts.ChainFactory,
      'NEXT_PUBLIC_VALIDATOR_REGISTRY_ADDRESS': contracts.ValidatorRegistry,
      'NEXT_PUBLIC_BRIDGE_ADDRESS': contracts.PolyOneBridge,
      'NEXT_PUBLIC_BILLING_ADDRESS': contracts.PolyOneBilling,
      'NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS': contracts.ChainRegistry,
      'NEXT_PUBLIC_NETWORK': network,
      'NEXT_PUBLIC_CHAIN_ID': deployment.chainId.toString(),
    }
  },
  backend: {
    file: path.join(__dirname, '..', 'backend', '.env'),
    vars: {
      'CHAIN_FACTORY_ADDRESS': contracts.PolyOneChainFactory || contracts.ChainFactory,
      'VALIDATOR_REGISTRY_ADDRESS': contracts.ValidatorRegistry,
      'BRIDGE_ADDRESS': contracts.PolyOneBridge,
      'BILLING_ADDRESS': contracts.PolyOneBilling,
      'CHAIN_REGISTRY_ADDRESS': contracts.ChainRegistry,
      'DEPLOYER_ADDRESS': deployment.deployer,
      'NETWORK': network,
      'CHAIN_ID': deployment.chainId.toString(),
    }
  },
  root: {
    file: path.join(__dirname, '..', '.env'),
    vars: {
      'CHAIN_FACTORY_ADDRESS': contracts.PolyOneChainFactory || contracts.ChainFactory,
      'VALIDATOR_REGISTRY_ADDRESS': contracts.ValidatorRegistry,
      'BRIDGE_ADDRESS': contracts.PolyOneBridge,
      'BILLING_ADDRESS': contracts.PolyOneBilling,
    }
  }
}

// Function to update .env file
function updateEnvFile(filePath, vars) {
  let content = ''
  const fileExists = fs.existsSync(filePath)
  
  if (fileExists) {
    content = fs.readFileSync(filePath, 'utf8')
  }
  
  // Update or add each variable
  Object.entries(vars).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️  Warning: ${key} is empty, skipping...`)
      return
    }
    
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(content)) {
      // Update existing
      content = content.replace(regex, `${key}=${value}`)
      console.log(`   ✓ Updated ${key}`)
    } else {
      // Add new
      if (content && !content.endsWith('\n')) {
        content += '\n'
      }
      content += `${key}=${value}\n`
      console.log(`   ✓ Added ${key}`)
    }
  })
  
  // Ensure directory exists
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, content)
  console.log(`   ✅ Updated ${filePath}`)
}

// Update all files
console.log('\n📝 Updating environment files...\n')

Object.entries(envUpdates).forEach(([name, config]) => {
  console.log(`\n${name.toUpperCase()}:`)
  updateEnvFile(config.file, config.vars)
})

console.log('\n✨ Environment variables updated successfully!')
console.log('\n📋 Contract Addresses:')
console.log(`   ChainFactory: ${contracts.ChainFactory || contracts.PolyOneChainFactory}`)
console.log(`   ValidatorRegistry: ${contracts.ValidatorRegistry}`)
console.log(`   Bridge: ${contracts.PolyOneBridge}`)
console.log(`   Billing: ${contracts.PolyOneBilling}`)
console.log(`   ChainRegistry: ${contracts.ChainRegistry}`)
console.log('\n💡 Next steps:')
console.log('   1. Restart your frontend and backend servers')
console.log('   2. Verify contracts are accessible in your app')
console.log('   3. Test chain creation functionality')























