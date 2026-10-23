import { handleSuggestionRequest } from '@skilved/catalogue/suggestions'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const handle = (request: Request) => handleSuggestionRequest(request)
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS, handle as HEAD }
