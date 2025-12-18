/**
 * Kyros Agent Runtime - REST API Routes
 * API contracts between Dashboard ↔ Agent Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentRuntime, 
  initializeAgentRuntime,
  type ApiResponse,
  type Lead,
  type CreateLeadRequest,
  type AgentRuntimeStatus,
} from '@/agent-runtime';

// Initialize runtime on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeAgentRuntime();
    initialized = true;
  }
}

/**
 * GET /api/agent - Get agent runtime status
 */
export async function GET(): Promise<NextResponse<ApiResponse<AgentRuntimeStatus>>> {
  ensureInitialized();
  
  try {
    const runtime = getAgentRuntime();
    const status = runtime.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'RUNTIME_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * POST /api/agent - Control agent runtime
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  ensureInitialized();
  
  try {
    const body = await request.json();
    const runtime = getAgentRuntime();
    
    switch (body.action) {
      case 'start':
        await runtime.start();
        return NextResponse.json({
          success: true,
          data: { status: 'started' },
          timestamp: new Date(),
        });
        
      case 'stop':
        await runtime.stop();
        return NextResponse.json({
          success: true,
          data: { status: 'stopped' },
          timestamp: new Date(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${body.action}`,
          },
          timestamp: new Date(),
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'RUNTIME_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}
