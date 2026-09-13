import { NextResponse } from 'next/server';
import { ScoutRunner } from '../../../../agents/scout/src/runner';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get('trade');
    const province = searchParams.get('province');

    const runner = new ScoutRunner();
    let opportunities = await runner.runDiscoveryCycle();

    // Filter by trade category if requested
    if (trade && trade !== 'all') {
      opportunities = opportunities.filter(o => o.tradeCategory === trade);
    }

    // Filter by province if requested
    if (province && province !== 'all') {
      opportunities = opportunities.filter(o => o.province === province);
    }

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
