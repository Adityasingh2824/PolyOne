#!/usr/bin/env node
/**
 * Script to export contract ABIs to JSON files for frontend/backend use
 * Usage: node scripts/export-abi.js
 */

const fs = require('fs')
const path = require('path')

const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts')
const outputDir = path.join(__dirname, '..', 'evm')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const contracts = [
  'ChainFactory.sol',
  'PolyOneChainFactory.sol',
  'ValidatorRegistry.sol',
  'PolyOneBridge.sol',
  'PolyOneBilling.sol',
  'ChainRegistry.sol'
]

console.log('📦 Exporting contract ABIs...\n')

contracts.forEach(contractName => {
  const contractPath = path.join(artifactsDir, contractName)
  const contractJsonPath = path.join(contractPath, path.basename(contractName, '.sol') + '.json')
  
  if (!fs.existsSync(contractJsonPath)) {
    console.warn(`⚠️  Contract artifact not found: ${contractJsonPath}`)
    console.warn(`   Run 'npm run compile' first to generate artifacts`)
    return
  }
  
  try {
    const artifact = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'))
    const contractNameOnly = path.basename(contractName, '.sol')
    
    // Export ABI
    const abiFile = path.join(outputDir, `${contractNameOnly}.abi.json`)
    fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2))
    console.log(`✅ Exported ABI: ${contractNameOnly}.abi.json`)
    
    // Export full artifact (ABI + bytecode + metadata)
    const artifactFile = path.join(outputDir, `${contractNameOnly}.artifact.json`)
    fs.writeFileSync(artifactFile, JSON.stringify(artifact, null, 2))
    console.log(`✅ Exported artifact: ${contractNameOnly}.artifact.json`)
    
    // Export TypeScript type definitions for ABI
    const tsFile = path.join(outputDir, `${contractNameOnly}.abi.ts`)
    const tsContent = `// Auto-generated ABI export for ${contractNameOnly}
// Generated at: ${new Date().toISOString()}

export const ${contractNameOnly.toUpperCase()}_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export type ${contractNameOnly}ABI = typeof ${contractNameOnly.toUpperCase()}_ABI;
`
    fs.writeFileSync(tsFile, tsContent)
    console.log(`✅ Exported TypeScript: ${contractNameOnly}.abi.ts`)
    
  } catch (error) {
    console.error(`❌ Error processing ${contractName}:`, error.message)
  }
})

// Create index file for easy imports
const indexContent = `// Auto-generated index file for EVM artifacts
// Generated at: ${new Date().toISOString()}

${contracts.map(c => {
  const name = path.basename(c, '.sol')
  return `export { ${name.toUpperCase()}_ABI, type ${name}ABI } from './${name}.abi';`
}).join('\n')}

// Re-export contract addresses helper
export * from './addresses';
`

const indexFile = path.join(outputDir, 'index.ts')
fs.writeFileSync(indexFile, indexContent)
console.log(`✅ Created index file: index.ts`)

// Create addresses file
const addressesContent = `// Contract addresses configuration
// Update these after deployment

export const CONTRACT_ADDRESSES = {
  CHAIN_FACTORY: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || process.env.CHAIN_FACTORY_ADDRESS || '',
  POLYONE_CHAIN_FACTORY: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || process.env.CHAIN_FACTORY_ADDRESS || '',
  VALIDATOR_REGISTRY: process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY_ADDRESS || process.env.VALIDATOR_REGISTRY_ADDRESS || '',
  BRIDGE: process.env.NEXT_PUBLIC_BRIDGE_ADDRESS || process.env.BRIDGE_ADDRESS || '',
  BILLING: process.env.NEXT_PUBLIC_BILLING_ADDRESS || process.env.BILLING_ADDRESS || '',
  CHAIN_REGISTRY: process.env.NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS || process.env.CHAIN_REGISTRY_ADDRESS || '',
} as const;
`

const addressesFile = path.join(outputDir, 'addresses.ts')
fs.writeFileSync(addressesFile, addressesContent)
console.log(`✅ Created addresses file: addresses.ts`)

console.log('\n✨ ABI export complete!')
console.log(`📁 Files exported to: ${outputDir}`)
console.log('\n💡 Usage:')
console.log('   import { CHAINFACTORY_ABI } from "@/evm/ChainFactory.abi"')
console.log('   import { CONTRACT_ADDRESSES } from "@/evm/addresses"')























