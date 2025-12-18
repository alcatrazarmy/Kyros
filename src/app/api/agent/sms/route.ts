/**
 * Kyros Agent Runtime - SMS Webhook
 * Handles incoming SMS messages from providers (Twilio)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentRuntime, 
  initializeAgentRuntime,
  type ApiResponse,
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
 * POST /api/agent/sms - Receive incoming SMS
 * This endpoint is called by SMS providers (Twilio) when messages are received
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ action: string }>>> {
  ensureInitialized();
  
  try {
    // Check content type - Twilio sends form data
    const contentType = request.headers.get('content-type') || '';
    
    let from: string;
    let body: string;
    let messageSid: string | undefined;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio webhook format
      const formData = await request.formData();
      from = formData.get('From') as string;
      body = formData.get('Body') as string;
      messageSid = formData.get('MessageSid') as string;
    } else {
      // JSON format (for testing/mock)
      const json = await request.json();
      from = json.from;
      body = json.body;
      messageSid = json.messageSid;
    }
    
    if (!from || !body) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'from and body are required',
        },
        timestamp: new Date(),
      }, { status: 400 });
    }
    
    const runtime = getAgentRuntime();
    const result = await runtime.processIncomingSms(from, body, messageSid);
    
    // Return TwiML-compatible empty response for Twilio
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }
    
    return NextResponse.json({
      success: result.success,
      data: { action: result.action || 'processed' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[SMS Webhook] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/sms - Health check for webhook
 */
export async function GET(): Promise<NextResponse<ApiResponse<{ status: string }>>> {
  return NextResponse.json({
    success: true,
    data: { status: 'webhook_ready' },
    timestamp: new Date(),
  });
}
