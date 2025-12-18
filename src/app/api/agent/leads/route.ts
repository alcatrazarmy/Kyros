/**
 * Kyros Agent Runtime - Leads API
 * CRUD operations for leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentRuntime, 
  initializeAgentRuntime,
  getAllLeads,
  getLeadStats,
  type ApiResponse,
  type Lead,
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
 * GET /api/agent/leads - Get all leads or lead stats
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Lead[] | ReturnType<typeof getLeadStats>>>> {
  ensureInitialized();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const statsOnly = searchParams.get('stats') === 'true';
    
    if (statsOnly) {
      const stats = getLeadStats();
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date(),
      });
    }
    
    const leads = getAllLeads();
    return NextResponse.json({
      success: true,
      data: leads,
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'LEADS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * POST /api/agent/leads - Create a new lead
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Lead>>> {
  ensureInitialized();
  
  try {
    const body = await request.json();
    const runtime = getAgentRuntime();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'firstName, lastName, and phone are required',
        },
        timestamp: new Date(),
      }, { status: 400 });
    }
    
    const lead = runtime.createLead({
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      source: body.source || 'api',
      tokenId: body.tokenId,
      projectId: body.projectId,
      consentVerified: body.consentVerified || false,
      consentMethod: body.consentMethod,
      metadata: body.metadata,
    });
    
    return NextResponse.json({
      success: true,
      data: lead,
      timestamp: new Date(),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}
