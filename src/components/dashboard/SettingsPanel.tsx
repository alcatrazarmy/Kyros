'use client';

/**
 * SettingsPanel Component
 * Dashboard settings and configuration
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Volume2,
  Palette,
  Shield,
  Database,
  Globe,
  Moon,
  Sun,
  Zap,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  className?: string;
}

interface SettingToggleProps {
  label: string;
  description: string;
  icon: typeof Settings;
  enabled: boolean;
  onToggle: () => void;
  color: string;
}

function SettingToggle({ label, description, icon: Icon, enabled, onToggle, color }: SettingToggleProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800"
      whileHover={{ borderColor: `${color}30` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{label}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button onClick={onToggle} className="text-gray-400">
        {enabled ? (
          <ToggleRight className="w-8 h-8" style={{ color }} />
        ) : (
          <ToggleLeft className="w-8 h-8" />
        )}
      </button>
    </motion.div>
  );
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    notifications: true,
    voiceFeedback: true,
    darkMode: true,
    autoRefresh: true,
    biometricAuth: false,
    dataSync: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">Configure your Kyros dashboard</p>
        </div>
      </div>

      {/* General Settings */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          General
        </h2>
        <div className="space-y-3">
          <SettingToggle
            label="Notifications"
            description="Receive alerts for hot leads and token events"
            icon={Bell}
            enabled={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
            color="#00FFFF"
          />
          <SettingToggle
            label="Voice Feedback"
            description="Enable audio responses from Bauliver"
            icon={Volume2}
            enabled={settings.voiceFeedback}
            onToggle={() => toggleSetting('voiceFeedback')}
            color="#39FF14"
          />
          <SettingToggle
            label="Dark Mode"
            description="Use dark theme for the interface"
            icon={settings.darkMode ? Moon : Sun}
            enabled={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
            color="#B026FF"
          />
        </div>
      </section>

      {/* Data Settings */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Data & Sync
        </h2>
        <div className="space-y-3">
          <SettingToggle
            label="Auto Refresh"
            description="Automatically refresh lead and token data"
            icon={Zap}
            enabled={settings.autoRefresh}
            onToggle={() => toggleSetting('autoRefresh')}
            color="#FF6600"
          />
          <SettingToggle
            label="Cloud Sync"
            description="Sync data across all your devices"
            icon={Database}
            enabled={settings.dataSync}
            onToggle={() => toggleSetting('dataSync')}
            color="#00FFFF"
          />
        </div>
      </section>

      {/* Security Settings */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Security
        </h2>
        <div className="space-y-3">
          <SettingToggle
            label="Biometric Authentication"
            description="Require biometric verification for sensitive actions"
            icon={Shield}
            enabled={settings.biometricAuth}
            onToggle={() => toggleSetting('biometricAuth')}
            color="#FF10F0"
          />
        </div>
      </section>

      {/* API Configuration */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          API Configuration
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">OpenSolar API</h3>
                <p className="text-xs text-green-400">Connected</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Endpoint</span>
                <span className="text-white font-mono text-xs">api.opensolar.com/v1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Sync</span>
                <span className="text-white text-xs">Just now</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">NeonGlow Memory Core</h3>
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tokens Stored</span>
                <span className="text-white">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Memory Usage</span>
                <span className="text-white">12.4 KB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="pt-4 border-t border-gray-800">
        <div className="text-center text-sm text-gray-500">
          <p>Kyros Dashboard v1.0.0</p>
          <p className="mt-1">Built with Next.js, Tailwind CSS & Framer Motion</p>
        </div>
      </section>
    </div>
  );
}
