'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Code, Rocket, Zap } from 'lucide-react'

export default function QuickStartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Quick Start
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Fast track guide to launching your chain in under 5 minutes
        </p>

        <div className="space-y-12">
          {/* Prerequisites Check */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
              Prerequisites Check
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-gray-300">MetaMask installed and connected to Polygon Amoy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-gray-300">Testnet MATIC in your wallet</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-gray-300">PolyOne application running</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5-Minute Deployment */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-400" />
              5-Minute Deployment
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
                    <p className="text-gray-400">
                      Click "Connect Wallet" in the top right. Ensure you're on Polygon Amoy testnet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Click "Create Chain"</h3>
                    <p className="text-gray-400">
                      From the dashboard, click the "Create Chain" or "Deploy New Chain" button.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Fill Basic Info</h3>
                    <div className="bg-black/30 rounded-lg p-4 mt-2">
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li>• <strong>Name:</strong> MyFirstChain</li>
                        <li>• <strong>Type:</strong> ZK Rollup</li>
                        <li>• <strong>Gas Token:</strong> MATIC</li>
                        <li>• <strong>Validators:</strong> 3 (default)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Deploy</h3>
                    <p className="text-gray-400">
                      Click "Deploy Chain" and confirm the transaction in MetaMask. 
                      Deployment takes 2-5 minutes.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-3">
                      <p className="text-yellow-400 text-sm">
                        <strong>Note:</strong> Keep the page open during deployment. You'll see real-time progress updates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Done! 🎉</h3>
                    <p className="text-gray-400">
                      Your chain is live! You'll receive RPC URLs, Explorer links, and can start building immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Using Your Chain */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-purple-400" />
              Using Your Chain
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Connect to Your Chain</h3>
              <p className="text-gray-300 mb-4">
                Once deployed, you'll get an RPC URL. Add it to MetaMask or use it in your dApp:
              </p>
              
              <div className="bg-black/50 rounded-lg p-4 mb-4 font-mono text-sm">
                <code className="text-green-400">RPC URL:</code> <code className="text-white">https://rpc-xxxxx.polyone.io</code>
                <br />
                <code className="text-green-400">Chain ID:</code> <code className="text-white">Your unique chain ID</code>
                <br />
                <code className="text-green-400">Explorer:</code> <code className="text-white">https://explorer-xxxxx.polyone.io</code>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">Add to MetaMask</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Open MetaMask</li>
                <li>Go to Settings → Networks → Add Network</li>
                <li>Enter your RPC URL and Chain ID</li>
                <li>Save and switch to your chain</li>
              </ol>
            </div>
          </section>

          {/* Code Examples */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Code className="w-8 h-8 text-purple-400" />
              Quick Code Examples
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Ethers.js</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300">{`const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(
  'https://rpc-xxxxx.polyone.io'
);

const signer = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

// Your chain is ready to use!
console.log('Connected to PolyOne chain');`}</pre>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">Web3.js</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300">{`const Web3 = require('web3');

const web3 = new Web3(
  'https://rpc-xxxxx.polyone.io'
);

// Check connection
const blockNumber = await web3.eth.getBlockNumber();
console.log('Current block:', blockNumber);`}</pre>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">API Request</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300">{`// Get chain details
const response = await fetch(
  'http://localhost:5000/api/chains/your-chain-id',
  {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  }
);

const chain = await response.json();
console.log('Chain RPC:', chain.rpcUrl);`}</pre>
              </div>
            </div>
          </section>

          {/* Common Tasks */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Common Tasks</h2>
            <div className="grid gap-4">
              <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-2">Pause Your Chain</h3>
                <p className="text-gray-400 text-sm">
                  POST <code className="bg-black/50 px-2 py-1 rounded">/api/chains/:id/pause</code>
                </p>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-2">Resume Your Chain</h3>
                <p className="text-gray-400 text-sm">
                  POST <code className="bg-black/50 px-2 py-1 rounded">/api/chains/:id/resume</code>
                </p>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-2">Get Chain Metrics</h3>
                <p className="text-gray-400 text-sm">
                  GET <code className="bg-black/50 px-2 py-1 rounded">/api/monitoring/:chainId/metrics</code>
                </p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section>
            <h2 className="text-3xl font-bold mb-6">What's Next?</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <Link href="/docs/api-reference" className="text-purple-400 hover:text-purple-300 font-semibold">
                      Explore the API
                    </Link>
                    <p className="text-gray-400">Full API reference for advanced usage</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <Link href="/docs/security" className="text-purple-400 hover:text-purple-300 font-semibold">
                      Secure Your Chain
                    </Link>
                    <p className="text-gray-400">Best practices for production deployment</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <span className="text-purple-400 font-semibold">Deploy Smart Contracts</span>
                    <p className="text-gray-400">Use the contract deployment UI to deploy your first contract</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}



















