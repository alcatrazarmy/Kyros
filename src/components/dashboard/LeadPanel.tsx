'use client';

/**
 * LeadPanel Component
 * Lead control panel with filtering, lead list, and statistics
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Flame,
  FileText,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  RefreshCw,
  X,
} from 'lucide-react';
import type { Lead, LeadStatus, LeadSource, LeadPriority } from '@/types';
import { cn, timeAgo } from '@/lib/utils';

interface LeadPanelProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
  onRefresh?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  hot: '#FF0000',
  new: '#00FFFF',
  warm: '#FF6600',
  cold: '#4D4DFF',
  contacted: '#39FF14',
  converted: '#B026FF',
  lost: '#666666',
};

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  high: '#FF0000',
  medium: '#FF6600',
  low: '#39FF14',
};

type FilterTab = 'all' | 'hot' | 'new' | 'permits';

export function LeadPanel({
  leads,
  selectedLead,
  onSelectLead,
  onRefresh,
  className,
}: LeadPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const hotLeads = leads.filter(l => l.status === 'hot').length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const permits = leads.filter(l => l.source === 'permit').length;
    const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    
    return { hotLeads, newLeads, permits, totalValue, total: leads.length };
  }, [leads]);

  // Filter leads based on active tab and filters
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Tab filters
    switch (activeTab) {
      case 'hot':
        result = result.filter(l => l.status === 'hot');
        break;
      case 'new':
        result = result.filter(l => l.status === 'new');
        break;
      case 'permits':
        result = result.filter(l => l.source === 'permit');
        break;
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter(l => statusFilter.includes(l.status));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      result = result.filter(l => priorityFilter.includes(l.priority));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        l =>
          l.name.toLowerCase().includes(query) ||
          l.email?.toLowerCase().includes(query) ||
          l.location.city.toLowerCase().includes(query) ||
          l.permitNumber?.toLowerCase().includes(query)
      );
    }

    // Sort by priority and recency
    result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return result;
  }, [leads, activeTab, statusFilter, priorityFilter, searchQuery]);

  const toggleStatusFilter = (status: LeadStatus) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: LeadPriority) => {
    setPriorityFilter(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setSearchQuery('');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-800">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: '#00FFFF' },
          { label: 'Hot Leads', value: stats.hotLeads, icon: Flame, color: '#FF0000' },
          { label: 'New Leads', value: stats.newLeads, icon: TrendingUp, color: '#39FF14' },
          { label: 'Pipeline', value: `$${(stats.totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: '#B026FF' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg bg-gray-900/50 border border-gray-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tab Filters */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        {[
          { id: 'all' as FilterTab, label: 'All Leads', count: stats.total },
          { id: 'hot' as FilterTab, label: 'Hot', count: stats.hotLeads },
          { id: 'new' as FilterTab, label: 'New', count: stats.newLeads },
          { id: 'permits' as FilterTab, label: 'Permits', count: stats.permits },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            )}
          >
            {tab.label}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs',
              activeTab === tab.id ? 'bg-cyan-500/30' : 'bg-gray-700'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
              showFilters || statusFilter.length > 0 || priorityFilter.length > 0
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-gray-900/50 text-gray-400 border-gray-700 hover:border-gray-600'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter.length > 0 || priorityFilter.length > 0) && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/30 text-xs">
                {statusFilter.length + priorityFilter.length}
              </span>
            )}
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Status Filters */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status as LeadStatus)}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
                        statusFilter.includes(status as LeadStatus)
                          ? 'border'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      )}
                      style={
                        statusFilter.includes(status as LeadStatus)
                          ? { borderColor: color, color: color, backgroundColor: `${color}20` }
                          : {}
                      }
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Priority</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
                    <button
                      key={priority}
                      onClick={() => togglePriorityFilter(priority as LeadPriority)}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
                        priorityFilter.includes(priority as LeadPriority)
                          ? 'border'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      )}
                      style={
                        priorityFilter.includes(priority as LeadPriority)
                          ? { borderColor: color, color: color, backgroundColor: `${color}20` }
                          : {}
                      }
                    >
                      <span className="capitalize">{priority}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(statusFilter.length > 0 || priorityFilter.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lead List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onSelectLead(lead)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                'bg-gray-900/50 hover:bg-gray-900/80',
                selectedLead?.id === lead.id
                  ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'border-gray-800 hover:border-gray-700'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{lead.name}</h3>
                    {lead.status === 'hot' && (
                      <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        color: STATUS_COLORS[lead.status],
                        borderColor: `${STATUS_COLORS[lead.status]}40`,
                        backgroundColor: `${STATUS_COLORS[lead.status]}10`,
                      }}
                    >
                      {lead.status}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: PRIORITY_COLORS[lead.priority],
                        backgroundColor: `${PRIORITY_COLORS[lead.priority]}20`,
                      }}
                    >
                      {lead.priority}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{lead.source}</span>
                  </div>
                </div>
                {lead.estimatedValue && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      ${(lead.estimatedValue / 1000).toFixed(0)}K
                    </div>
                    {lead.systemSize && (
                      <div className="text-xs text-gray-500">{lead.systemSize} kW</div>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{lead.location.city}, {lead.location.state}</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.permitNumber && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{lead.permitNumber}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Updated {timeAgo(lead.updatedAt)}</span>
                </div>
                {lead.tags.length > 0 && (
                  <div className="flex gap-1">
                    {lead.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{lead.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLeads.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-400 mb-1">No leads found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter.length > 0 || priorityFilter.length > 0
                ? 'Try adjusting your filters'
                : 'No leads available'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
