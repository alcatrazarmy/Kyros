'use client';

/**
 * Agent Dashboard Page
 * Main interface for managing the Kyros Agent Runtime
 */

import { motion } from 'framer-motion';
import { Bot, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AgentStatus } from '@/components/agent/AgentStatus';
import { LeadManager } from '@/components/agent/LeadManager';

export default function AgentDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Vault
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(0, 255, 255, 0.2)',
                      '0 0 30px rgba(176, 38, 255, 0.2)',
                      '0 0 20px rgba(0, 255, 255, 0.2)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Bot className="w-6 h-6 text-cyan-400" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                    Kyros Agent Runtime
                  </h1>
                  <p className="text-sm text-gray-400">
                    SMS Appointment Setter & Workflow Orchestration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Agent Status */}
        <section>
          <AgentStatus />
        </section>

        {/* Lead Management */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Lead Management
            </h2>
            <LeadManager />
          </motion.div>
        </section>

        {/* System Information */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm"
          >
            <h2 className="text-lg font-semibold text-white mb-4">System Architecture</h2>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h3 className="font-medium text-cyan-400">Dashboard (This UI)</h3>
                <ul className="text-gray-400 space-y-1">
                  <li>• Token management (NeonGlow)</li>
                  <li>• Visualization</li>
                  <li>• Manual overrides</li>
                  <li>• NO workflow logic</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-purple-400">Agent Runtime</h3>
                <ul className="text-gray-400 space-y-1">
                  <li>• Lead state machine</li>
                  <li>• SMS appointment setting</li>
                  <li>• Workflow orchestration</li>
                  <li>• Retries & failure handling</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-green-400">Communication Layer</h3>
                <ul className="text-gray-400 space-y-1">
                  <li>• Message drafting</li>
                  <li>• Intent classification</li>
                  <li>• OpenAI for language only</li>
                  <li>• NO decision-making</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
