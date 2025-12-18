/**
 * Kyros Agent Runtime - Single Lead API
 * Operations on a specific lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentRuntime, 
  initializeAgentRuntime,
  getLead,
  type ApiResponse,
  type Lead,
  type WorkflowExecution,
} from '@/agent-runtime';

// Initialize runtime on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeAgentRuntime();
    initialized = true;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/agent/leads/[id] - Get a specific lead
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Lead>>> {
  ensureInitialized();
  
  try {
    const { id } = await params;
    const lead = getLead(id);
    
    if (!lead) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Lead not found: ${id}`,
        },
        timestamp: new Date(),
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: lead,
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'LEAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * POST /api/agent/leads/[id] - Trigger workflow or action on lead
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<WorkflowExecution | { action: string }>>> {
  ensureInitialized();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const runtime = getAgentRuntime();
    
    const lead = getLead(id);
    if (!lead) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Lead not found: ${id}`,
        },
        timestamp: new Date(),
      }, { status: 404 });
    }
    
    switch (body.action) {
      case 'start_workflow':
        const execution = await runtime.startWorkflow(id);
        return NextResponse.json({
          success: true,
          data: execution,
          timestamp: new Date(),
        });
        
      case 'get_workflows':
        const workflows = runtime.getLeadWorkflows(id);
        return NextResponse.json({
          success: true,
          data: workflows as unknown as WorkflowExecution,
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
        code: 'ACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}
