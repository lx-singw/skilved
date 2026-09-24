import { NextResponse } from 'next/server';
import { SkillsProfileAgent } from '../../../../../agents/skills-profile/src/builder';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cvText, fileName, primaryTrade, province } = body;

    if (!cvText) {
      return NextResponse.json(
        { success: false, error: 'Missing cvText payload' },
        { status: 400 }
      );
    }

    const agent = new SkillsProfileAgent();
    const passport = agent.buildSkillsPassportFromCV({
      userId: userId || `usr_${Date.now()}`,
      rawCvText: cvText,
      fileName,
      primaryTrade,
      province,
    });

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'CV ingestion failed' },
      { status: 500 }
    );
  }
}
