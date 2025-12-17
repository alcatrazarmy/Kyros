'use client';

/**
 * NeonOrb Component
 * Visual representation of an API token as a pulsing neon orb
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ApiToken } from '@/types';

interface NeonOrbProps {
  token: ApiToken;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showRipple?: boolean;
}

export function NeonOrb({ 
  token, 
  isActive = false, 
  onClick, 
  size = 'md',
  showRipple = false,
}: NeonOrbProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const glowColor = token.status === 'revoked' 
    ? '#FF0000' 
    : token.status === 'expired'
    ? '#FF6600'
    : token.color;

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple effect */}
      {showRipple && (
        <motion.div
          className={cn(
            'absolute rounded-full border-2',
            sizeClasses[size]
          )}
          style={{
            borderColor: glowColor,
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}

      {/* Main orb */}
      <motion.button
        onClick={onClick}
        className={cn(
          'relative rounded-full cursor-pointer transition-all',
          sizeClasses[size],
          isActive && 'scale-110'
        )}
        style={{
          backgroundColor: glowColor + '20',
          boxShadow: `
            0 0 20px ${glowColor}40,
            0 0 40px ${glowColor}30,
            0 0 60px ${glowColor}20,
            inset 0 0 20px ${glowColor}20
          `,
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: `
            0 0 30px ${glowColor}60,
            0 0 60px ${glowColor}40,
            0 0 90px ${glowColor}30,
            inset 0 0 30px ${glowColor}30
          `,
        }}
        whileTap={{ scale: 0.95 }}
        animate={
          token.status === 'active'
            ? {
                boxShadow: [
                  `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}30, 0 0 60px ${glowColor}20, inset 0 0 20px ${glowColor}20`,
                  `0 0 30px ${glowColor}50, 0 0 50px ${glowColor}40, 0 0 70px ${glowColor}30, inset 0 0 30px ${glowColor}30`,
                  `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}30, 0 0 60px ${glowColor}20, inset 0 0 20px ${glowColor}20`,
                ],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner glow */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${glowColor}40, transparent 70%)`,
          }}
        />

        {/* Core */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            backgroundColor: glowColor,
            boxShadow: `0 0 20px ${glowColor}`,
            opacity: 0.8,
          }}
        />

        {/* Status indicator */}
        {token.status === 'rotating' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: glowColor }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </motion.button>

      {/* Floating particles */}
      {token.status === 'active' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: glowColor,
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, (i - 1) * 30],
                y: [0, -40 - i * 10],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
