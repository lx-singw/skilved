import { readSavedSummary } from "./saved-summary"

/** Recheck public identity only. Personal annotations never enter either request. */
export async function checkSavedIdentity(fromId: string, toId: string, revision: number, read = readSavedSummary): Promise<boolean> {
  if (fromId === toId) return false
  try {
    const [from, to] = await Promise.all([read(fromId), read(toId)])
    return "id" in from && "id" in to && from.id === toId && to.id === toId && from.revision === revision && to.revision === revision
  } catch { return false }
}
