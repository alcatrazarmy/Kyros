'use client';

/**
 * TokenCard Component
 * Displays token information with neon styling and interactive controls
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Activity,
  Zap,
  Shield,
} from 'lucide-react';
import { cn, maskToken, timeAgo } from '@/lib/utils';
import type { ApiToken } from '@/types';
import { NeonOrb } from './NeonOrb';

interface TokenCardProps {
  token: ApiToken;
  onRotate?: (tokenId: string) => void;
  onRevoke?: (tokenId: string) => void;
  onSelect?: (tokenId: string) => void;
  isSelected?: boolean;
}

export function TokenCard({ 
  token, 
  onRotate, 
  onRevoke, 
  onSelect,
  isSelected = false,
}: TokenCardProps) {
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const handleToggleVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
  };

  const handleRotate = () => {
    if (onRotate) {
      onRotate(token.id);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    }
  };

  const handleRevoke = () => {
    if (onRevoke) {
      onRevoke(token.id);
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(token.id);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'relative p-6 rounded-xl backdrop-blur-sm border transition-all',
        'bg-black/40',
        isSelected 
          ? 'border-opacity-100' 
          : 'border-opacity-30 hover:border-opacity-60',
      )}
      style={{
        borderColor: token.color,
        boxShadow: isSelected 
          ? `0 0 30px ${token.color}40, inset 0 0 20px ${token.color}10`
          : `0 0 10px ${token.color}20`,
      }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <NeonOrb 
            token={token} 
            size="sm" 
            isActive={isSelected}
            showRipple={showRipple}
          />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {token.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: token.color + '20',
                  color: token.color,
                  border: `1px solid ${token.color}40`,
                }}
                role="status"
                aria-label={`Token status: ${token.status}`}
              >
                {token.status}
              </span>
              {token.metadata?.environment && (
                <span className="text-xs text-gray-400">
                  {token.metadata.environment}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Icons */}
        <div className="flex gap-2">
          {token.status === 'active' && (
            <div 
              className="p-2 rounded-lg"
              style={{
                backgroundColor: token.color + '10',
                color: token.color,
              }}
            >
              <Zap className="w-4 h-4" />
            </div>
          )}
          {token.scope.includes('admin') && (
            <div 
              className="p-2 rounded-lg"
              style={{
                backgroundColor: token.color + '10',
                color: token.color,
              }}
            >
              <Shield className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Token Value */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">
            Token Value
          </label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleVisibility();
            }}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={isTokenVisible ? 'Hide token value' : 'Show token value'}
          >
            {isTokenVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <motion.div
          className="relative p-3 rounded-lg font-mono text-sm overflow-hidden"
          style={{
            backgroundColor: token.color + '10',
            border: `1px solid ${token.color}30`,
          }}
          animate={{
            filter: isTokenVisible ? 'blur(0px)' : 'blur(8px)',
          }}
          transition={{ duration: 0.3 }}
        >
          <span style={{ color: token.color }}>
            {isTokenVisible ? token.token : maskToken(token.token)}
          </span>
        </motion.div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Scope</div>
          <div className="flex flex-wrap gap-1">
            {token.scope.map((scope) => (
              <span
                key={scope}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: token.color + '15',
                  color: token.color,
                }}
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Used
          </div>
          <div className="text-sm text-white">
            {token.lastUsed ? timeAgo(token.lastUsed) : 'Never'}
          </div>
        </div>
      </div>

      {/* Active Endpoints */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Active Endpoints ({token.activeEndpoints.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {token.activeEndpoints.slice(0, 3).map((endpoint) => (
            <div
              key={endpoint.id}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: token.color + '10',
                border: `1px solid ${token.color}20`,
                color: token.color,
              }}
            >
              {endpoint.method} {endpoint.name}
            </div>
          ))}
          {token.activeEndpoints.length > 3 && (
            <span className="text-xs text-gray-400">
              +{token.activeEndpoints.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Rotation Info */}
      {token.metadata?.rotationCount && token.metadata.rotationCount > 0 && (
        <div className="mb-4 text-xs text-gray-400">
          Rotated {token.metadata.rotationCount} time(s)
          {token.metadata.lastRotation && (
            <> · Last rotation {timeAgo(token.metadata.lastRotation)}</>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-700">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleRotate();
          }}
          disabled={token.status !== 'active'}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            token.status === 'active'
              ? 'hover:scale-105'
              : 'opacity-50 cursor-not-allowed'
          )}
          style={{
            backgroundColor: token.color + '20',
            color: token.color,
            border: `1px solid ${token.color}40`,
          }}
          whileHover={token.status === 'active' ? { scale: 1.05 } : {}}
          whileTap={token.status === 'active' ? { scale: 0.95 } : {}}
          aria-label="Rotate token to generate new value"
        >
          <RefreshCw className="w-4 h-4" />
          Rotate
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleRevoke();
          }}
          disabled={token.status === 'revoked'}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'bg-red-500/20 text-red-400 border border-red-500/40',
            token.status === 'revoked' 
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-red-500/30 hover:scale-105'
          )}
          whileHover={token.status !== 'revoked' ? { scale: 1.05 } : {}}
          whileTap={token.status !== 'revoked' ? { scale: 0.95 } : {}}
          aria-label="Revoke token to invalidate it"
        >
          <Trash2 className="w-4 h-4" />
          Revoke
        </motion.button>
      </div>
    </motion.div>
  );
}
