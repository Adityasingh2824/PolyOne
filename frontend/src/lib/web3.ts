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
  private walletType: string = 'unknown'

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    // Only support MetaMask
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this dApp.')
    }

    if (!window.ethereum.isMetaMask) {
      throw new Error('Please use MetaMask wallet. Other wallets are not supported.')
    }

    const ethereumProvider = window.ethereum
    this.walletType = 'metamask'

    try {
      // Request account access
      await ethereumProvider.request({ method: 'eth_requestAccounts' })
      
      this.provider = new ethers.BrowserProvider(ethereumProvider)
      this.signer = await this.provider.getSigner()
      
      const address = await this.signer.getAddress()
      const network = await this.provider.getNetwork()
      
      return {
        address,
        chainId: Number(network.chainId)
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Wallet connection rejected by user')
      }
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  async switchToPolygon(network: keyof typeof NETWORKS = 'POLYGON_AMOY'): Promise<void> {
    // Get the provider we're using (could be any injected wallet)
    let ethereumProvider: any = null
    
    if (this.provider) {
      // Get the underlying provider
      const provider = this.provider as any
      ethereumProvider = provider.provider || window.ethereum
    } else if (typeof window.ethereum !== 'undefined') {
      ethereumProvider = window.ethereum
    }

    if (!ethereumProvider) {
      throw new Error('No wallet provider found')
    }

    const networkConfig = NETWORKS[network]

    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }]
      })
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        try {
          await ethereumProvider.request({
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

  getWalletType(): string {
    return this.walletType
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
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}

