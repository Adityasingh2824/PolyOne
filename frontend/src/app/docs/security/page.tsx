'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Key, Lock, Shield, Users } from 'lucide-react'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Security
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Best practices for securing your blockchain
        </p>

        <div className="space-y-12">
          {/* Overview */}
          <section>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <p className="text-gray-300">
                Security is paramount when deploying and managing blockchain infrastructure. 
                This guide covers essential security practices for PolyOne chains.
              </p>
            </div>
          </section>

          {/* Authentication & Access Control */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Key className="w-8 h-8 text-purple-400" />
              Authentication & Access Control
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">JWT Token Security</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Never expose tokens in client-side code</strong>
                    <p className="text-gray-400 text-sm">Store tokens securely and use HTTP-only cookies when possible</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement token rotation</strong>
                    <p className="text-gray-400 text-sm">Use refresh tokens and rotate them regularly</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Set appropriate token expiration</strong>
                    <p className="text-gray-400 text-sm">Use short-lived access tokens (15-60 minutes)</p>
                  </div>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">API Key Management</h3>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Important:</strong> Never commit API keys or private keys to version control. 
                  Use environment variables and secrets management services.
                </p>
              </div>
            </div>
          </section>

          {/* Validator Security */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              Validator Security
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Validator Key Management</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use hardware security modules (HSM)</strong>
                    <p className="text-gray-400 text-sm">For production validators, use HSMs to protect private keys</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement key rotation policies</strong>
                    <p className="text-gray-400 text-sm">Regularly rotate validator keys</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use permissioned validators for sensitive chains</strong>
                    <p className="text-gray-400 text-sm">Restrict validator access to trusted parties</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Monitor validator performance</strong>
                    <p className="text-gray-400 text-sm">Set up alerts for validator downtime or misbehavior</p>
                  </div>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">Validator Distribution</h3>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm mb-2">
                  <strong>Best Practice:</strong> Distribute validators across multiple:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm ml-4">
                  <li>Geographic regions</li>
                  <li>Cloud providers</li>
                  <li>Independent operators</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Network Security */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Lock className="w-8 h-8 text-purple-400" />
              Network Security
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">RPC Endpoint Security</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use HTTPS for all RPC endpoints</strong>
                    <p className="text-gray-400 text-sm">Never expose unencrypted RPC endpoints in production</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement rate limiting</strong>
                    <p className="text-gray-400 text-sm">Protect against DDoS and abuse</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use API keys for RPC access</strong>
                    <p className="text-gray-400 text-sm">Require authentication for sensitive operations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Monitor network traffic</strong>
                    <p className="text-gray-400 text-sm">Set up alerts for unusual patterns</p>
                  </div>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">Firewall Configuration</h3>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  Configure firewalls to only allow necessary ports and IP addresses. 
                  Restrict validator-to-validator communication to known peers.
                </p>
              </div>
            </div>
          </section>

          {/* Smart Contract Security */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Smart Contract Security
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Before Deployment</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Get professional audits</strong>
                    <p className="text-gray-400 text-sm">Have contracts audited by reputable security firms</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Test thoroughly on testnets</strong>
                    <p className="text-gray-400 text-sm">Deploy and test extensively before mainnet</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use upgradeable contracts with timelocks</strong>
                    <p className="text-gray-400 text-sm">Implement proper governance for upgrades</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement access controls</strong>
                    <p className="text-gray-400 text-sm">Use role-based access control (RBAC) patterns</p>
                  </div>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">Common Vulnerabilities</h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm font-semibold mb-2">Watch out for:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm ml-4">
                  <li>Reentrancy attacks</li>
                  <li>Integer overflow/underflow</li>
                  <li>Unchecked external calls</li>
                  <li>Front-running vulnerabilities</li>
                  <li>Access control issues</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Lock className="w-8 h-8 text-purple-400" />
              Data Security
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Database Security</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Encrypt sensitive data at rest</strong>
                    <p className="text-gray-400 text-sm">Use encryption for database backups and storage</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use connection encryption (TLS/SSL)</strong>
                    <p className="text-gray-400 text-sm">Always use encrypted connections to databases</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement row-level security</strong>
                    <p className="text-gray-400 text-sm">Use Supabase RLS policies to restrict data access</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Regular backups</strong>
                    <p className="text-gray-400 text-sm">Automate backups and test restoration procedures</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Monitoring & Incident Response */}
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-purple-400" />
              Monitoring & Incident Response
            </h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Security Monitoring</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Set up security alerts</strong>
                    <p className="text-gray-400 text-sm">Monitor for suspicious activities, failed logins, unusual API usage</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Log all security events</strong>
                    <p className="text-gray-400 text-sm">Maintain audit logs for compliance and forensics</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Use Prometheus and Grafana</strong>
                    <p className="text-gray-400 text-sm">Monitor chain health and performance metrics</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <div>
                    <strong>Implement circuit breakers</strong>
                    <p className="text-gray-400 text-sm">Automatically pause chains if anomalies are detected</p>
                  </div>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">Incident Response Plan</h3>
              <div className="bg-black/30 rounded-lg p-4">
                <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                  <li>Identify and contain the incident</li>
                  <li>Assess the impact and scope</li>
                  <li>Notify relevant stakeholders</li>
                  <li>Remediate and restore services</li>
                  <li>Document and learn from the incident</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Best Practices Summary */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Security Checklist</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Strong passwords and 2FA enabled</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">All secrets stored in environment variables</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">HTTPS/TLS enabled for all endpoints</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Rate limiting configured</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Smart contracts audited</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Monitoring and alerts set up</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Backup and recovery procedures tested</span>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-300">Incident response plan documented</span>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Resources */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Additional Resources</h2>
            <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <ul className="space-y-3">
                <li>
                  <a href="https://consensys.github.io/smart-contract-best-practices/" target="_blank" className="text-purple-400 hover:text-purple-300">
                    ConsenSys Smart Contract Best Practices
                  </a>
                </li>
                <li>
                  <a href="https://owasp.org/www-project-blockchain/" target="_blank" className="text-purple-400 hover:text-purple-300">
                    OWASP Blockchain Security
                  </a>
                </li>
                <li>
                  <a href="https://ethereum.org/en/developers/docs/security/" target="_blank" className="text-purple-400 hover:text-purple-300">
                    Ethereum Security Documentation
                  </a>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}



















