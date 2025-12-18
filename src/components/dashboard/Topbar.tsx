'use client';

/**
 * Topbar Component
 * Main navigation bar with modular icon toggles
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Users,
  Map,
  Mic,
  Settings,
  Menu,
  X,
  Zap,
  ChevronDown,
} from 'lucide-react';
import type { DashboardPanel, VoiceMode } from '@/types';
import { cn } from '@/lib/utils';

interface TopbarProps {
  activePanel: DashboardPanel;
  onPanelChange: (panel: DashboardPanel) => void;
  voiceMode: VoiceMode;
  onVoiceModeChange: (mode: VoiceMode) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

const NAV_ITEMS: { id: DashboardPanel; label: string; icon: typeof Key }[] = [
  { id: 'tokens', label: 'Tokens', icon: Key },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const VOICE_MODES: { id: VoiceMode; label: string; color: string }[] = [
  { id: 'executive', label: 'Executive', color: '#00FFFF' },
  { id: 'calm', label: 'Calm', color: '#39FF14' },
  { id: 'hype', label: 'Hype', color: '#FF10F0' },
  { id: 'flirt', label: 'Flirt', color: '#FF6600' },
  { id: 'storyteller', label: 'Storyteller', color: '#B026FF' },
];

export function Topbar({
  activePanel,
  onPanelChange,
  voiceMode,
  onVoiceModeChange,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: TopbarProps) {
  const [voiceModeDropdownOpen, setVoiceModeDropdownOpen] = useState(false);

  const currentVoiceModeInfo = VOICE_MODES.find(m => m.id === voiceMode);

  return (
    <header className="relative z-50 border-b border-gray-800 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Kyros
              </h1>
              <p className="text-xs text-gray-500">AI Solar Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onPanelChange(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Right side: Voice Mode & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Voice Mode Selector */}
            <div className="relative">
              <motion.button
                onClick={() => setVoiceModeDropdownOpen(!voiceModeDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentVoiceModeInfo?.color }}
                />
                <span className="hidden sm:inline text-gray-300">
                  {currentVoiceModeInfo?.label}
                </span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-gray-400 transition-transform',
                  voiceModeDropdownOpen && 'rotate-180'
                )} />
              </motion.button>

              <AnimatePresence>
                {voiceModeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-900 border border-gray-700 shadow-xl overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="text-xs text-gray-500 px-3 py-1 mb-1">
                        Bauliver Voice Mode
                      </div>
                      {VOICE_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            onVoiceModeChange(mode.id);
                            setVoiceModeDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            voiceMode === mode.id
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: mode.color }}
                          />
                          <span>{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-800 bg-black/95"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPanelChange(item.id);
                      onMobileMenuToggle();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
