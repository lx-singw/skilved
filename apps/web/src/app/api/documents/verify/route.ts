import { NextResponse } from 'next/server';
import { DocumentVerificationAgent } from '../../../../agents/document-verification/src/verifier';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.documentId || !body.documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing documentId or documentType' },
        { status: 400 }
      );
    }

    const agent = new DocumentVerificationAgent();
    const result = await agent.verifyDocument({
      documentId: body.documentId,
      userId: body.userId || 'usr_anonymous_123',
      documentType: body.documentType,
      idNumber: body.idNumber,
      certificateNumber: body.certificateNumber,
      saqaId: body.saqaId,
    });

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
