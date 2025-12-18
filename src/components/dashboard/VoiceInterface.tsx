'use client';

/**
 * VoiceInterface Component
 * Bauliver voice interaction panel with mode selection and command input
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  MessageCircle,
  Wand2,
  User,
  Bot,
} from 'lucide-react';
import type { VoiceMode, VoiceCommand, VoiceResponse } from '@/types';
import { cn } from '@/lib/utils';
import {
  processVoiceCommand,
  setVoiceMode,
  getVoiceMode,
  getModeInfo,
  getAllVoiceModes,
} from '@/services/voiceService';

interface VoiceInterfaceProps {
  currentMode: VoiceMode;
  onModeChange: (mode: VoiceMode) => void;
  className?: string;
}

const MODE_COLORS: Record<VoiceMode, string> = {
  flirt: '#FF6600',
  calm: '#39FF14',
  executive: '#00FFFF',
  hype: '#FF10F0',
  storyteller: '#B026FF',
};

const MODE_ICONS: Record<VoiceMode, string> = {
  flirt: '💋',
  calm: '🧘',
  executive: '💼',
  hype: '🔥',
  storyteller: '📖',
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  mode?: VoiceMode;
  timestamp: Date;
}

export function VoiceInterface({
  currentMode,
  onModeChange,
  className,
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    const modeInfo = getModeInfo(currentMode);
    setMessages([
      {
        id: 'greeting',
        type: 'assistant',
        text: modeInfo.greeting,
        mode: currentMode,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mode change
  const handleModeChange = (mode: VoiceMode) => {
    onModeChange(mode);
    const response = setVoiceMode(mode);
    
    setMessages(prev => [
      ...prev,
      {
        id: response.id,
        type: 'assistant',
        text: response.text,
        mode: response.mode,
        timestamp: response.timestamp,
      },
    ]);
  };

  // Handle command submission
  const handleSubmit = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const { response } = processVoiceCommand(inputText);

    const assistantMessage: Message = {
      id: response.id,
      type: 'assistant',
      text: response.text,
      mode: response.mode,
      timestamp: response.timestamp,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);

    // Simulate speaking animation
    if (!isMuted) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  // Handle voice input toggle
  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition starting
      setTimeout(() => {
        setIsListening(false);
        setInputText('Kyros, show me hot leads');
      }, 2000);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with Mode Selector */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${MODE_COLORS[currentMode]}20` }}
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5 }}
            >
              <span className="text-2xl">{MODE_ICONS[currentMode]}</span>
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Bauliver
                {isSpeaking && (
                  <motion.div
                    className="flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-3 rounded-full"
                        style={{ backgroundColor: MODE_COLORS[currentMode] }}
                        animate={{ height: ['12px', '4px', '12px'] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                )}
              </h2>
              <p className="text-sm text-gray-400 capitalize">{currentMode} Mode</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'p-2 rounded-lg transition-all',
              isMuted
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            )}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Mode Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {getAllVoiceModes().map((mode) => (
            <motion.button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                currentMode === mode
                  ? 'border'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
              )}
              style={
                currentMode === mode
                  ? {
                      borderColor: MODE_COLORS[mode],
                      color: MODE_COLORS[mode],
                      backgroundColor: `${MODE_COLORS[mode]}15`,
                    }
                  : {}
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{MODE_ICONS[mode]}</span>
              <span className="capitalize">{mode}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'flex gap-3',
                message.type === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.type === 'user'
                    ? 'bg-purple-500/20'
                    : `bg-opacity-20`
                )}
                style={
                  message.type === 'assistant' && message.mode
                    ? { backgroundColor: `${MODE_COLORS[message.mode]}20` }
                    : {}
                }
              >
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-purple-400" />
                ) : (
                  <span className="text-sm">{MODE_ICONS[message.mode || currentMode]}</span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[80%] rounded-xl px-4 py-3',
                  message.type === 'user'
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-gray-800/50 border border-gray-700'
                )}
                style={
                  message.type === 'assistant' && message.mode
                    ? { borderColor: `${MODE_COLORS[message.mode]}30` }
                    : {}
                }
              >
                <p className="text-sm text-white">{message.text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.type === 'assistant' && message.mode && (
                    <span
                      className="text-xs capitalize"
                      style={{ color: MODE_COLORS[message.mode] }}
                    >
                      {message.mode}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing Indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${MODE_COLORS[currentMode]}20` }}
              >
                <span className="text-sm">{MODE_ICONS[currentMode]}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="px-4 py-2 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-2">Quick Commands</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            'Show hot leads',
            'Token status',
            'New permits',
            'Daily summary',
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setInputText(`Kyros, ${cmd.toLowerCase()}`)}
              className="px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 whitespace-nowrap"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          {/* Voice Input Button */}
          <motion.button
            onClick={toggleListening}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all',
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-600'
            )}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a command or say 'Kyros...' "
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            {isListening && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-4 rounded-full bg-red-500"
                      animate={{ height: ['16px', '8px', '16px'] }}
                      transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Send Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all',
              inputText.trim() && !isProcessing
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gray-800/50 text-gray-600 border border-gray-700'
            )}
            whileHover={inputText.trim() ? { scale: 1.05 } : {}}
            whileTap={inputText.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
