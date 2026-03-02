'use client'

import Link from 'next/link'
import { ArrowLeft, Code, ExternalLink, Key, Server } from 'lucide-react'

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          API Reference
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Complete API documentation for developers
        </p>

        <div className="space-y-12">
          {/* Base URL */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-400" />
              Base URL
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <code className="text-green-400">Production:</code> <code className="text-white">https://api.polyone.io</code>
                <br />
                <code className="text-green-400">Development:</code> <code className="text-white">http://localhost:5000</code>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Key className="w-8 h-8 text-purple-400" />
              Authentication
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300 mb-4">
                PolyOne uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
              </p>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm">
                <code className="text-yellow-400">Authorization:</code> <code className="text-green-400">Bearer YOUR_JWT_TOKEN</code>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 mt-6">Get Authentication Token</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-4 font-mono text-sm">
                <code className="text-blue-400">POST</code> <code className="text-white">/api/auth/login</code>
              </div>
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Request Body:</p>
                <pre className="text-sm text-gray-300">{`{
  "email": "user@example.com",
  "password": "your-password"
}`}</pre>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Response:</p>
                <pre className="text-sm text-gray-300">{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}`}</pre>
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Code className="w-8 h-8 text-purple-400" />
              API Endpoints
            </h2>

            {/* Chains */}
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-2xl font-semibold mb-4">Chains</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/chains</code>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Get all chains for the authenticated user</p>
                  <div className="bg-black/30 rounded-lg p-3 text-sm">
                    <code className="text-gray-400">Query params:</code> <code className="text-white">?walletAddress=0x...</code>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/chains/:id</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get a specific chain by ID</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code className="text-white font-mono">/api/chains/create</code>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Create a new chain</p>
                  <div className="bg-black/30 rounded-lg p-3 text-sm mb-2">
                    <p className="text-gray-400 mb-1">Request Body:</p>
                    <pre className="text-xs text-gray-300">{`{
  "name": "My Chain",
  "chainType": "zkRollup",
  "rollupType": "validium",
  "gasToken": "MATIC",
  "validatorAccess": "public",
  "initialValidators": 3
}`}</pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-mono">PUT</span>
                    <code className="text-white font-mono">/api/chains/:id</code>
                  </div>
                  <p className="text-gray-400 text-sm">Update a chain</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code className="text-white font-mono">/api/chains/:id/pause</code>
                  </div>
                  <p className="text-gray-400 text-sm">Pause a chain</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code className="text-white font-mono">/api/chains/:id/resume</code>
                  </div>
                  <p className="text-gray-400 text-sm">Resume a paused chain</p>
                </div>
              </div>
            </div>

            {/* Validators */}
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-2xl font-semibold mb-4">Validators</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/validators/chain/:chainId</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get all validators for a chain</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code className="text-white font-mono">/api/validators</code>
                  </div>
                  <p className="text-gray-400 text-sm">Add a validator to a chain</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-2xl font-semibold mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/notifications</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get all notifications for user</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/notifications/unread/count</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get unread notification count</p>
                </div>
              </div>
            </div>

            {/* Monitoring */}
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-semibold mb-4">Monitoring</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/api/monitoring/:chainId/metrics</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get chain metrics (TPS, block time, etc.)</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code className="text-white font-mono">/metrics</code>
                  </div>
                  <p className="text-gray-400 text-sm">Prometheus metrics endpoint</p>
                </div>
              </div>
            </div>
          </section>

          {/* WebSocket API */}
          <section>
            <h2 className="text-3xl font-bold mb-6">WebSocket API</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300 mb-4">
                PolyOne provides real-time updates via WebSocket. Connect to:
              </p>
              <div className="bg-black/50 rounded-lg p-4 mb-6 font-mono text-sm">
                <code className="text-green-400">ws://localhost:5000/ws</code>
              </div>

              <h3 className="text-xl font-semibold mb-4">Subscribe to Updates</h3>
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-300">{`{
  "type": "subscribe",
  "userId": "user-id",
  "chainId": "chain-id"
}`}</pre>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">Event Types</h3>
              <ul className="space-y-2 text-gray-300">
                <li><code className="bg-black/50 px-2 py-1 rounded text-sm">chain_status_change</code> - Chain status updated</li>
                <li><code className="bg-black/50 px-2 py-1 rounded text-sm">chain_deployment</code> - Deployment progress</li>
                <li><code className="bg-black/50 px-2 py-1 rounded text-sm">notification</code> - New notification</li>
                <li><code className="bg-black/50 px-2 py-1 rounded text-sm">chain_created</code> - New chain created</li>
              </ul>
            </div>
          </section>

          {/* Interactive API Docs */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Interactive API Documentation</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300 mb-4">
                For interactive API documentation with live examples, visit:
              </p>
              <a 
                href="http://localhost:5000/api-docs" 
                target="_blank"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold"
              >
                Swagger UI <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-gray-400 text-sm mt-2">
                (Available when backend server is running)
              </p>
            </div>
          </section>

          {/* Error Handling */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Error Handling</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300 mb-4">
                All API errors follow a consistent format:
              </p>
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-300">{`{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "requestId": "uuid-request-id"
  }
}`}</pre>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">HTTP Status Codes</h3>
              <ul className="space-y-2 text-gray-300">
                <li><code className="bg-green-500/20 text-green-400 px-2 py-1 rounded">200</code> - Success</li>
                <li><code className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">201</code> - Created</li>
                <li><code className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">400</code> - Bad Request</li>
                <li><code className="bg-red-500/20 text-red-400 px-2 py-1 rounded">401</code> - Unauthorized</li>
                <li><code className="bg-red-500/20 text-red-400 px-2 py-1 rounded">403</code> - Forbidden</li>
                <li><code className="bg-red-500/20 text-red-400 px-2 py-1 rounded">404</code> - Not Found</li>
                <li><code className="bg-red-500/20 text-red-400 px-2 py-1 rounded">500</code> - Internal Server Error</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}



















