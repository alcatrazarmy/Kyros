'use client';

/**
 * LeadManager Component
 * Displays and manages leads in the Agent Runtime
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  MessageSquare,
  Calendar,
  Play,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  state: string;
  consentVerified: boolean;
  contactAttempts: Array<{
    id: string;
    type: string;
    direction: string;
    timestamp: string;
    status: string;
  }>;
  appointmentSlot?: {
    date: string;
    startTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LeadStats {
  total: number;
  byState: Record<string, number>;
  consentVerified: number;
  optedOut: number;
  appointmentsScheduled: number;
}

const STATE_COLORS: Record<string, string> = {
  new: '#4D4DFF',
  consent_pending: '#FF6600',
  consent_verified: '#39FF14',
  contact_scheduled: '#00FFFF',
  initial_contact_sent: '#B026FF',
  awaiting_response: '#FF10F0',
  response_received: '#00FFFF',
  interested: '#39FF14',
  appointment_proposed: '#B026FF',
  appointment_confirmed: '#39FF14',
  appointment_completed: '#00FFFF',
  not_interested: '#FF6600',
  opted_out: '#FF0000',
  failed: '#FF0000',
  escalated: '#FF6600',
};

export function LeadManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const [leadsResponse, statsResponse] = await Promise.all([
        fetch('/api/agent/leads'),
        fetch('/api/agent/leads?stats=true'),
      ]);
      
      const leadsData = await leadsResponse.json();
      const statsData = await statsResponse.json();
      
      if (leadsData.success) {
        setLeads(leadsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async (leadId: string) => {
    try {
      const response = await fetch(`/api/agent/leads/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_workflow' }),
      });
      
      if (response.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.error('Failed to start workflow:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-gray-400">Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-black/40 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Total Leads</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-green-800/30">
            <div className="text-xs text-gray-400 mb-1">Consent Verified</div>
            <div className="text-2xl font-bold text-green-400">{stats.consentVerified}</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-purple-800/30">
            <div className="text-xs text-gray-400 mb-1">Appointments</div>
            <div className="text-2xl font-bold text-purple-400">{stats.appointmentsScheduled}</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-red-800/30">
            <div className="text-xs text-gray-400 mb-1">Opted Out</div>
            <div className="text-2xl font-bold text-red-400">{stats.optedOut}</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-cyan-800/30">
            <div className="text-xs text-gray-400 mb-1">States</div>
            <div className="text-2xl font-bold text-cyan-400">
              {Object.keys(stats.byState).length}
            </div>
          </div>
        </div>
      )}

      {/* Lead Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Leads ({leads.length})
          </h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {leads.map((lead) => {
              const stateColor = STATE_COLORS[lead.state] || '#4D4DFF';
              
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-4 rounded-lg border backdrop-blur-sm cursor-pointer transition-all',
                    selectedLead?.id === lead.id
                      ? 'border-opacity-100'
                      : 'border-opacity-30 hover:border-opacity-60'
                  )}
                  style={{
                    borderColor: stateColor,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  }}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        {lead.firstName} {lead.lastName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: stateColor + '20',
                          color: stateColor,
                          border: `1px solid ${stateColor}40`,
                        }}
                      >
                        {lead.state.replace(/_/g, ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {lead.consentVerified && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Consent
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {lead.contactAttempts.length} contacts
                    </span>
                    {lead.appointmentSlot && (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Calendar className="w-3 h-3" />
                        Scheduled
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {leads.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No leads found
              </div>
            )}
          </div>
        </div>

        {/* Lead Details */}
        <div>
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div
                key={selectedLead.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-xl border bg-black/40 backdrop-blur-sm overflow-hidden"
                style={{
                  borderColor: (STATE_COLORS[selectedLead.state] || '#4D4DFF') + '30',
                }}
              >
                {/* Header */}
                <div 
                  className="p-6 border-b"
                  style={{
                    borderColor: (STATE_COLORS[selectedLead.state] || '#4D4DFF') + '20',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h3>
                      <p className="text-sm text-gray-400">ID: {selectedLead.id}</p>
                    </div>
                    
                    {selectedLead.state === 'consent_verified' && (
                      <motion.button
                        onClick={() => startWorkflow(selectedLead.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4" />
                        Start Workflow
                      </motion.button>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.address && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedLead.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* State & Details */}
                <div className="p-6 space-y-6">
                  {/* Current State */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Current State</h4>
                    <div 
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: (STATE_COLORS[selectedLead.state] || '#4D4DFF') + '20',
                        color: STATE_COLORS[selectedLead.state] || '#4D4DFF',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-pulse" 
                        style={{ backgroundColor: STATE_COLORS[selectedLead.state] || '#4D4DFF' }}
                      />
                      <span className="font-medium capitalize">
                        {selectedLead.state.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Consent Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Consent</h4>
                    <div className={cn(
                      'flex items-center gap-2',
                      selectedLead.consentVerified ? 'text-green-400' : 'text-yellow-400'
                    )}>
                      {selectedLead.consentVerified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>
                        {selectedLead.consentVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Appointment */}
                  {selectedLead.appointmentSlot && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Appointment</h4>
                      <div className="flex items-center gap-2 text-purple-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(selectedLead.appointmentSlot.date).toLocaleDateString()} 
                          {' at '}
                          {selectedLead.appointmentSlot.startTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact History */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Contact History ({selectedLead.contactAttempts.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedLead.contactAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="p-3 rounded-lg bg-black/40 border border-gray-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              {attempt.type.toUpperCase()} - {attempt.direction}
                            </span>
                            <span className={cn(
                              'text-xs px-2 py-1 rounded',
                              attempt.status === 'sent' || attempt.status === 'responded'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            )}>
                              {attempt.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(attempt.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      {selectedLead.contactAttempts.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No contact history
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  Select a Lead
                </h3>
                <p className="text-sm text-gray-600">
                  Click on a lead to view details and manage workflows
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
