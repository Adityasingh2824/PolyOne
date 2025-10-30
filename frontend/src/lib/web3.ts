import { ethers } from 'ethers'

// Polygon Network Configurations
export const NETWORKS = {
  POLYGON_MAINNET: {
    chainId: '0x89', // 137
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  POLYGON_AMOY: {
    chainId: '0x13882', // 80002
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com']
  },
  POLYGON_ZKEVM: {
    chainId: '0x44d', // 1101
    chainName: 'Polygon zkEVM',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://zkevm-rpc.com'],
    blockExplorerUrls: ['https://zkevm.polygonscan.com']
  },
  POLYGON_ZKEVM_TESTNET: {
    chainId: '0x5a2', // 1442
    chainName: 'Polygon zkEVM Testnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.public.zkevm-test.net'],
    blockExplorerUrls: ['https://testnet-zkevm.polygonscan.com']
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask to use this dApp')
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      
      const address = await this.signer.getAddress()
      const network = await this.provider.getNetwork()
      
      return {
        address,
        chainId: Number(network.chainId)
      }
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  async switchToPolygon(network: keyof typeof NETWORKS = 'POLYGON_AMOY'): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found')
    }

    const networkConfig = NETWORKS[network]

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }]
      })
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig]
          })
        } catch (addError) {
          throw new Error('Failed to add network')
        }
      } else {
        throw error
      }
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized')
    }

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    })

    await tx.wait()
    return tx.hash
  }

  async deployContract(abi: any[], bytecode: string, ...args: any[]): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized')
    }

    const factory = new ethers.ContractFactory(abi, bytecode, this.signer)
    const contract = await factory.deploy(...args)
    await contract.waitForDeployment()
    
    return await contract.getAddress()
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized')
    }

    return await this.signer.signMessage(message)
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }
}

// Singleton instance
export const web3Service = new Web3Service()

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

