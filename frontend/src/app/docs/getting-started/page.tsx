'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Code, Database, Key, Rocket, Server } from 'lucide-react'

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Getting Started
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Learn how to deploy your first blockchain in minutes with PolyOne
        </p>

        <div className="space-y-12">
          {/* Prerequisites */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
              Prerequisites
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong className="text-lg">Node.js 18+</strong>
                    <p className="text-gray-400">Install Node.js from nodejs.org</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong className="text-lg">npm or yarn</strong>
                    <p className="text-gray-400">Package manager for installing dependencies</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong className="text-lg">MetaMask or Web3 Wallet</strong>
                    <p className="text-gray-400">For connecting to Polygon network</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong className="text-lg">Polygon Testnet Tokens</strong>
                    <p className="text-gray-400">Get testnet MATIC from a faucet for deployment</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Installation */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-purple-400" />
              Installation
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">1. Clone the Repository</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-green-400">git clone https://github.com/your-org/polyone.git</code>
                <br />
                <code className="text-green-400">cd polyone</code>
              </div>

              <h3 className="text-xl font-semibold mb-4">2. Install Dependencies</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-green-400">npm install</code>
                <br />
                <code className="text-green-400">cd backend && npm install</code>
                <br />
                <code className="text-green-400">cd ../frontend && npm install</code>
              </div>

              <h3 className="text-xl font-semibold mb-4">3. Configure Environment</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-gray-400"># Copy environment template</code>
                <br />
                <code className="text-green-400">cp .env.example .env</code>
                <br />
                <code className="text-gray-400"># Edit .env with your configuration</code>
              </div>
            </div>
          </section>

          {/* Database Setup */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Database className="w-8 h-8 text-purple-400" />
              Database Setup
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300 mb-4">
                PolyOne uses Supabase (PostgreSQL) for data persistence. You can also use in-memory storage for development.
              </p>
              
              <h3 className="text-xl font-semibold mb-4 mt-6">Option 1: Supabase (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300 mb-6">
                <li>Create a project at <a href="https://supabase.com" target="_blank" className="text-purple-400 hover:underline">supabase.com</a></li>
                <li>Get your project URL and API keys from Settings → API</li>
                <li>Add credentials to your <code className="bg-black/50 px-2 py-1 rounded">.env</code> file:</li>
              </ol>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-yellow-400">SUPABASE_URL</code>=<code className="text-green-400">https://your-project.supabase.co</code>
                <br />
                <code className="text-yellow-400">SUPABASE_ANON_KEY</code>=<code className="text-green-400">your-anon-key</code>
                <br />
                <code className="text-yellow-400">SUPABASE_SERVICE_ROLE_KEY</code>=<code className="text-green-400">your-service-role-key</code>
              </div>
              <p className="text-gray-400 text-sm">
                See <Link href="/docs/supabase-setup" className="text-purple-400 hover:underline">Supabase Setup Guide</Link> for detailed instructions.
              </p>

              <h3 className="text-xl font-semibold mb-4 mt-6">Option 2: In-Memory Storage (Development Only)</h3>
              <p className="text-gray-300 mb-4">
                If Supabase is not configured, the app automatically uses in-memory storage. 
                <strong className="text-yellow-400"> Note: Data will be lost on server restart.</strong>
              </p>
            </div>
          </section>

          {/* Running the Application */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-400" />
              Running the Application
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Start Backend Server</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-green-400">cd backend</code>
                <br />
                <code className="text-green-400">npm run dev</code>
              </div>
              <p className="text-gray-400 mb-6">Backend will run on <code className="bg-black/50 px-2 py-1 rounded">http://localhost:5000</code></p>

              <h3 className="text-xl font-semibold mb-4">Start Frontend</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <code className="text-green-400">cd frontend</code>
                <br />
                <code className="text-green-400">npm run dev</code>
              </div>
              <p className="text-gray-400 mb-6">Frontend will run on <code className="bg-black/50 px-2 py-1 rounded">http://localhost:3000</code></p>
            </div>
          </section>

          {/* Creating Your First Chain */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-purple-400" />
              Creating Your First Chain
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <ol className="space-y-6">
                <li>
                  <h3 className="text-xl font-semibold mb-3">1. Connect Your Wallet</h3>
                  <p className="text-gray-300 mb-3">
                    Open the application and connect your MetaMask wallet. Make sure you're connected to Polygon Amoy testnet.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      <strong>Tip:</strong> Get testnet MATIC from the <a href="https://faucet.polygon.technology" target="_blank" className="underline">Polygon Faucet</a>
                    </p>
                  </div>
                </li>

                <li>
                  <h3 className="text-xl font-semibold mb-3">2. Navigate to Chain Creation</h3>
                  <p className="text-gray-300">
                    Click on "Create Chain" or "Deploy New Chain" from the dashboard.
                  </p>
                </li>

                <li>
                  <h3 className="text-xl font-semibold mb-3">3. Configure Your Chain</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li><strong>Chain Name:</strong> Choose a unique name for your chain</li>
                    <li><strong>Chain Type:</strong> Select ZK Rollup or Validium</li>
                    <li><strong>Gas Token:</strong> Choose the native gas token (MATIC, ETH, etc.)</li>
                    <li><strong>Validators:</strong> Set the number of validators (minimum 1)</li>
                    <li><strong>Validator Access:</strong> Public or permissioned</li>
                  </ul>
                </li>

                <li>
                  <h3 className="text-xl font-semibold mb-3">4. Deploy Your Chain</h3>
                  <p className="text-gray-300 mb-3">
                    Review your configuration and click "Deploy Chain". The deployment process will:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Create the chain configuration</li>
                    <li>Deploy smart contracts to Polygon</li>
                    <li>Register with AggLayer</li>
                    <li>Set up validators</li>
                    <li>Initialize the chain</li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-4">
                    This process typically takes 2-5 minutes.
                  </p>
                </li>

                <li>
                  <h3 className="text-xl font-semibold mb-3">5. Access Your Chain</h3>
                  <p className="text-gray-300">
                    Once deployed, you'll receive RPC URLs, Explorer URLs, and Bridge information. 
                    You can start using your chain immediately!
                  </p>
                </li>
              </ol>
            </div>
          </section>

          {/* Next Steps */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Next Steps</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <Link href="/docs/quick-start" className="text-purple-400 hover:text-purple-300 font-semibold">
                      Quick Start Guide
                    </Link>
                    <p className="text-gray-400">Fast track guide for experienced developers</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <Link href="/docs/api-reference" className="text-purple-400 hover:text-purple-300 font-semibold">
                      API Reference
                    </Link>
                    <p className="text-gray-400">Complete API documentation for integration</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <div>
                    <Link href="/docs/security" className="text-purple-400 hover:text-purple-300 font-semibold">
                      Security Best Practices
                    </Link>
                    <p className="text-gray-400">Learn how to secure your blockchain</p>
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



















