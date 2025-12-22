'use client';

/**
 * TokenDetails Component
 * Displays detailed information about a selected token including
 * interaction history, linked projects, and audit trail
 */

import { motion } from 'framer-motion';
import { 
  Activity, 
  FolderOpen, 
  FileText, 
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import type { ApiToken } from '@/types';
import { formatDate, timeAgo, cn } from '@/lib/utils';
import { NeonOrb } from './NeonOrb';
import { NeonContainer, EmptyState, NeonBadge } from '@/components/shared';

interface TokenDetailsProps {
  token: ApiToken;
}

export function TokenDetails({ token }: TokenDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-xl border bg-black/40 backdrop-blur-sm overflow-hidden"
      style={{
        borderColor: token.color + '30',
        boxShadow: `0 0 30px ${token.color}20`,
      }}
    >
      {/* Header */}
      <div 
        className="p-6 border-b"
        style={{
          borderColor: token.color + '20',
          background: `linear-gradient(135deg, ${token.color}10, transparent)`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <NeonOrb token={token} size="md" />
          <div>
            <h2 className="text-2xl font-bold text-white">{token.name}</h2>
            <p className="text-sm text-gray-400">
              Created {formatDate(token.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Status</div>
            <div 
              className="text-sm font-semibold"
              style={{ color: token.color }}
            >
              {token.status.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Endpoints</div>
            <div className="text-sm font-semibold text-white">
              {token.activeEndpoints.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Projects</div>
            <div className="text-sm font-semibold text-white">
              {token.linkedProjects.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 space-y-6">
        {/* Active Endpoints Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: token.color }} />
            Active Endpoints
          </h3>
          <div className="space-y-2">
            {token.activeEndpoints.length > 0 ? (
              token.activeEndpoints.map((endpoint) => (
                <NeonContainer
                  key={endpoint.id}
                  color={token.color}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white">{endpoint.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{endpoint.url}</div>
                    </div>
                    <NeonBadge 
                      color={token.color}
                      bgOpacity="20"
                      className="font-mono"
                    >
                      {endpoint.method}
                    </NeonBadge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{endpoint.accessCount.toLocaleString()} calls</span>
                    {endpoint.lastAccessed && (
                      <span>{timeAgo(endpoint.lastAccessed)}</span>
                    )}
                  </div>
                </NeonContainer>
              ))
            ) : (
              <EmptyState message="No active endpoints" />
            )}
          </div>
        </section>

        {/* Linked Projects Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" style={{ color: token.color }} />
            Linked Projects
          </h3>
          <div className="space-y-2">
            {token.linkedProjects.length > 0 ? (
              token.linkedProjects.map((project) => (
                <NeonContainer
                  key={project.id}
                  color={token.color}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                >
                  <div className="font-medium text-white mb-1">{project.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span 
                        className={cn(
                          'w-2 h-2 rounded-full',
                          project.status === 'active' && 'bg-green-400',
                          project.status === 'pending' && 'bg-yellow-400',
                          project.status === 'completed' && 'bg-blue-400',
                          project.status === 'archived' && 'bg-gray-400',
                        )}
                      />
                      {project.status}
                    </span>
                    {project.systemSize && (
                      <span>{project.systemSize} kW</span>
                    )}
                    {project.location && (
                      <span className="truncate max-w-[200px]">
                        {project.location.address}
                      </span>
                    )}
                  </div>
                </NeonContainer>
              ))
            ) : (
              <EmptyState message="No linked projects" />
            )}
          </div>
        </section>

        {/* Interaction History */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: token.color }} />
            Recent Interactions
          </h3>
          <div className="space-y-2">
            {token.interactionHistory.length > 0 ? (
              token.interactionHistory.slice(0, 5).map((interaction) => (
                <NeonContainer
                  key={interaction.id}
                  color={token.color}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {interaction.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-white">
                        {interaction.endpoint.name}
                      </span>
                    </div>
                    <span 
                      className={cn(
                        'text-xs px-2 py-1 rounded',
                        interaction.success 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {interaction.statusCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{interaction.responseTime}ms</span>
                    <span>{timeAgo(interaction.timestamp)}</span>
                  </div>
                </NeonContainer>
              ))
            ) : (
              <EmptyState message="No interaction history" />
            )}
          </div>
        </section>

        {/* Audit Trail */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: token.color }} />
            Audit Trail
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {token.auditTrail.length > 0 ? (
              token.auditTrail.map((entry) => (
                <NeonContainer
                  key={entry.id}
                  color={token.color}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: token.color }}
                      >
                        {entry.action.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  {entry.details && (
                    <div className="text-xs text-gray-400 ml-5">
                      {entry.details}
                    </div>
                  )}
                </NeonContainer>
              ))
            ) : (
              <EmptyState message="No audit entries" />
            )}
          </div>
        </section>

        {/* Token Metadata */}
        {token.metadata && (
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: token.color }} />
              Metadata
            </h3>
            <div 
              className="p-4 rounded-lg bg-black/40 border"
              style={{
                borderColor: token.color + '20',
              }}
            >
              <div className="space-y-2 text-sm">
                {token.metadata.environment && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Environment</span>
                    <span className="text-white">{token.metadata.environment}</span>
                  </div>
                )}
                {token.metadata.rotationCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rotation Count</span>
                    <span className="text-white">{token.metadata.rotationCount}</span>
                  </div>
                )}
                {token.metadata.lastRotation && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Rotation</span>
                    <span className="text-white">{formatDate(token.metadata.lastRotation)}</span>
                  </div>
                )}
                {token.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires At</span>
                    <span className="text-white">{formatDate(token.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
