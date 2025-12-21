'use client';

/**
 * TokenVault Component
 * Main interface for the NeonGlow memory-core system
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, Search, Filter } from 'lucide-react';
import type { ApiToken } from '@/types';
import { TokenCard } from './TokenCard';
import { TokenDetails } from './TokenDetails';

interface TokenVaultProps {
  tokens: ApiToken[];
  onRotate?: (tokenId: string) => void;
  onRevoke?: (tokenId: string) => void;
  onCreate?: () => void;
}

export function TokenVault({ 
  tokens, 
  onRotate, 
  onRevoke, 
  onCreate 
}: TokenVaultProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.token.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || token.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                NeonGlow Memory Core
              </h1>
              <p className="text-gray-400">
                Biometric memory bank for secure token management
              </p>
            </div>
            <motion.button
              onClick={onCreate}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium shadow-lg shadow-cyan-500/50"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Create new API token"
            >
              <Plus className="w-5 h-5" />
              Create Token
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Tokens', value: tokens.length, color: '#00FFFF' },
              { label: 'Active', value: tokens.filter(t => t.status === 'active').length, color: '#39FF14' },
              { label: 'Revoked', value: tokens.filter(t => t.status === 'revoked').length, color: '#FF0000' },
              { label: 'Endpoints', value: tokens.reduce((sum, t) => sum + t.activeEndpoints.length, 0), color: '#B026FF' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg bg-black/40 border backdrop-blur-sm"
                style={{
                  borderColor: stat.color + '30',
                  boxShadow: `0 0 20px ${stat.color}10`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4" style={{ color: stat.color }} />
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                aria-label="Search tokens by name or token value"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'revoked' | 'expired')}
                className="pl-10 pr-8 py-2 rounded-lg bg-black/40 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer"
                aria-label="Filter tokens by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Token Vault ({filteredTokens.length})
            </h2>
            <AnimatePresence mode="popLayout">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.id}
                  token={token}
                  onRotate={onRotate}
                  onRevoke={onRevoke}
                  onSelect={setSelectedTokenId}
                  isSelected={selectedTokenId === token.id}
                />
              ))}
            </AnimatePresence>
            {filteredTokens.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                No tokens found
              </motion.div>
            )}
          </div>

          {/* Token Details Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <AnimatePresence mode="wait">
              {selectedToken ? (
                <TokenDetails 
                  key={selectedToken.id}
                  token={selectedToken} 
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <Database className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    Select a Token
                  </h3>
                  <p className="text-sm text-gray-600">
                    Click on a token to view detailed information,
                    interaction history, and audit trail
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
