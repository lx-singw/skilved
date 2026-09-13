import { NextResponse } from 'next/server';
import { ApplicationPreFlightEngine } from '../../../../../agents/application/src/pre-flight';
import { SkillsProfileAgent } from '../../../../../agents/skills-profile/src/builder';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, opportunity } = body;

    if (!opportunity || !opportunity.id) {
      return NextResponse.json(
        { success: false, error: 'Missing opportunity payload' },
        { status: 400 }
      );
    }

    // Build/fetch candidate passport
    const profileAgent = new SkillsProfileAgent();
    const passport = profileAgent.buildSkillsPassportFromCV({
      userId: userId || 'usr_demo_123',
      rawCvText: 'N3 Electrical Engineering Certificate holder with 2 years experience in Gauteng.',
    });

    // Run Pre-Flight Check Engine
    const preFlightEngine = new ApplicationPreFlightEngine();
    const result = preFlightEngine.checkPreFlight(passport, opportunity, []);

    return NextResponse.json({
      success: true,
      preFlight: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Pre-flight check failed' },
      { status: 500 }
    );
  }
}
