import { handle } from '@skilved/catalogue'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export function POST(request: Request) { return handle(request) }
