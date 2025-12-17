'use client';

/**
 * NeonGlow Memory Core - Main Application Page
 * Kyros AI Dashboard for OpenSolar Token Management
 */

import { useState, useEffect } from 'react';
import { TokenVault } from '@/components/neonglow/TokenVault';
import type { ApiToken } from '@/types';
import { 
  getAllTokens, 
  rotateToken as rotateTokenService,
  revokeToken as revokeTokenService,
  createToken as createTokenService,
} from '@/services/tokenService';

export default function Home() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens on mount
  useEffect(() => {
    const loadTokens = () => {
      const allTokens = getAllTokens();
      setTokens(allTokens);
      setIsLoading(false);
    };

    loadTokens();
  }, []);

  const handleRotate = (tokenId: string) => {
    const rotatedToken = rotateTokenService(tokenId);
    if (rotatedToken) {
      setTokens(prevTokens => 
        prevTokens.map(t => t.id === tokenId ? rotatedToken : t)
      );
    }
  };

  const handleRevoke = (tokenId: string) => {
    const success = revokeTokenService(tokenId);
    if (success) {
      setTokens(prevTokens => 
        prevTokens.map(t => 
          t.id === tokenId ? { ...t, status: 'revoked' } : t
        )
      );
    }
  };

  const handleCreate = () => {
    const newToken = createTokenService(
      'New API Token',
      ['read', 'write'],
      365
    );
    setTokens(prevTokens => [newToken, ...prevTokens]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <div className="text-gray-400">Initializing NeonGlow Memory Core...</div>
        </div>
      </div>
    );
  }

  return (
    <TokenVault 
      tokens={tokens}
      onRotate={handleRotate}
      onRevoke={handleRevoke}
      onCreate={handleCreate}
    />
  );
}
