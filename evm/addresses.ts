// Contract addresses configuration
// Update these after deployment

export const CONTRACT_ADDRESSES = {
  CHAIN_FACTORY: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || process.env.CHAIN_FACTORY_ADDRESS || '',
  POLYONE_CHAIN_FACTORY: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || process.env.CHAIN_FACTORY_ADDRESS || '',
  VALIDATOR_REGISTRY: process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY_ADDRESS || process.env.VALIDATOR_REGISTRY_ADDRESS || '',
  BRIDGE: process.env.NEXT_PUBLIC_BRIDGE_ADDRESS || process.env.BRIDGE_ADDRESS || '',
  BILLING: process.env.NEXT_PUBLIC_BILLING_ADDRESS || process.env.BILLING_ADDRESS || '',
  CHAIN_REGISTRY: process.env.NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS || process.env.CHAIN_REGISTRY_ADDRESS || '',
} as const;
