'use client';

/**
 * KyrosDashboard Component
 * Main dashboard that integrates all panels and features
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DashboardPanel, Lead, ApiToken, VoiceMode } from '@/types';
import { Topbar } from './Topbar';
import { LeadPanel } from './LeadPanel';
import { LeadMap } from './LeadMap';
import { VoiceInterface } from './VoiceInterface';
import { SettingsPanel } from './SettingsPanel';
import { TokenVault } from '@/components/neonglow/TokenVault';
import { getAllLeads } from '@/services/leadService';
import {
  getAllTokens,
  rotateToken as rotateTokenService,
  revokeToken as revokeTokenService,
  createToken as createTokenService,
} from '@/services/tokenService';
import { cn } from '@/lib/utils';

export function KyrosDashboard() {
  // State
  const [activePanel, setActivePanel] = useState<DashboardPanel>('leads');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('executive');
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      const allLeads = getAllLeads();
      const allTokens = getAllTokens();
      setLeads(allLeads);
      setTokens(allTokens);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Token handlers
  const handleRotateToken = (tokenId: string) => {
    const rotatedToken = rotateTokenService(tokenId);
    if (rotatedToken) {
      setTokens(prevTokens =>
        prevTokens.map(t => (t.id === tokenId ? rotatedToken : t))
      );
    }
  };

  const handleRevokeToken = (tokenId: string) => {
    const success = revokeTokenService(tokenId);
    if (success) {
      setTokens(prevTokens =>
        prevTokens.map(t =>
          t.id === tokenId ? { ...t, status: 'revoked' } : t
        )
      );
    }
  };

  const handleCreateToken = () => {
    const newToken = createTokenService('New API Token', ['read', 'write'], 365);
    setTokens(prevTokens => [newToken, ...prevTokens]);
  };

  // Refresh leads
  const handleRefreshLeads = () => {
    const allLeads = getAllLeads();
    setLeads(allLeads);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <div className="text-gray-400">Initializing Kyros Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Topbar */}
      <Topbar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        voiceMode={voiceMode}
        onVoiceModeChange={setVoiceMode}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Tokens Panel */}
          {activePanel === 'tokens' && (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full"
            >
              <TokenVault
                tokens={tokens}
                onRotate={handleRotateToken}
                onRevoke={handleRevokeToken}
                onCreate={handleCreateToken}
              />
            </motion.div>
          )}

          {/* Leads Panel */}
          {activePanel === 'leads' && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full flex"
            >
              <div className="w-full lg:w-1/2 xl:w-2/5 border-r border-gray-800 overflow-hidden">
                <LeadPanel
                  leads={leads}
                  selectedLead={selectedLead}
                  onSelectLead={setSelectedLead}
                  onRefresh={handleRefreshLeads}
                />
              </div>
              <div className="hidden lg:block flex-1 p-4">
                <LeadMap
                  leads={leads}
                  selectedLead={selectedLead}
                  onSelectLead={setSelectedLead}
                  className="h-full"
                />
              </div>
            </motion.div>
          )}

          {/* Map Panel (Mobile) */}
          {activePanel === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full h-full p-4"
            >
              <LeadMap
                leads={leads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
                className="h-full"
              />
            </motion.div>
          )}

          {/* Voice Panel */}
          {activePanel === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-2xl mx-auto h-full"
            >
              <VoiceInterface
                currentMode={voiceMode}
                onModeChange={setVoiceMode}
              />
            </motion.div>
          )}

          {/* Settings Panel */}
          {activePanel === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-2xl mx-auto h-full overflow-y-auto"
            >
              <SettingsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
