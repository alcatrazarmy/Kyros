'use client';

/**
 * AgentStatus Component
 * Displays real-time status of the Agent Runtime
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Play, 
  Pause, 
  Users, 
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusData {
  running: boolean;
  startedAt?: string;
  activeWorkflows: number;
  pendingLeads: number;
  processedToday: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  errors: Array<{
    id: string;
    timestamp: string;
    type: string;
    message: string;
  }>;
}

export function AgentStatus() {
  const [status, setStatus] = useState<AgentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/agent');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Failed to connect to agent runtime');
    } finally {
      setLoading(false);
    }
  };

  const toggleRuntime = async () => {
    try {
      const action = status?.running ? 'stop' : 'start';
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to toggle runtime:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-gray-400">Loading agent status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-800 bg-red-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const healthColor = {
    healthy: '#39FF14',
    degraded: '#FF6600',
    unhealthy: '#FF0000',
  }[status?.health || 'healthy'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        borderColor: healthColor + '30',
        boxShadow: `0 0 30px ${healthColor}10`,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: healthColor + '20' }}
          >
            <Activity className="w-5 h-5" style={{ color: healthColor }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Runtime</h3>
            <div className="flex items-center gap-2">
              <span 
                className={cn(
                  'w-2 h-2 rounded-full',
                  status?.running ? 'animate-pulse' : ''
                )}
                style={{ backgroundColor: status?.running ? healthColor : '#666' }}
              />
              <span className="text-sm text-gray-400">
                {status?.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        <motion.button
          onClick={toggleRuntime}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            status?.running 
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-green-500/20 text-green-400 border border-green-500/40'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {status?.running ? (
            <>
              <Pause className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            borderColor: '#00FFFF30',
            backgroundColor: '#00FFFF10',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Active Workflows</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {status?.activeWorkflows || 0}
          </div>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{ 
            borderColor: '#39FF1430',
            backgroundColor: '#39FF1410',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Pending Leads</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {status?.pendingLeads || 0}
          </div>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{ 
            borderColor: '#B026FF30',
            backgroundColor: '#B026FF10',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Processed Today</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {status?.processedToday || 0}
          </div>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{ 
            borderColor: healthColor + '30',
            backgroundColor: healthColor + '10',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: healthColor }} />
            <span className="text-xs text-gray-400">Health</span>
          </div>
          <div className="text-2xl font-bold capitalize" style={{ color: healthColor }}>
            {status?.health || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {status?.errors && status.errors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Errors</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {status.errors.slice(0, 3).map((err) => (
              <div 
                key={err.id}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">{err.type}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(err.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{err.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
