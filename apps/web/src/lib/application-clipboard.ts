/** A clipboard permission request may remain pending; keep the public-address action bounded. */
export async function copyApplicationAddress(destination:string, clipboard:Pick<Clipboard,"writeText"> | undefined, timeoutMs=3000) {
  if (!clipboard) return false
  let timer:ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<boolean>(resolve => { timer=setTimeout(()=>resolve(false),timeoutMs) })
    const write = Promise.resolve().then(()=>clipboard.writeText(destination)).then(()=>true,()=>false)
    return await Promise.race([write,timeout])
  } finally { if (timer !== undefined) clearTimeout(timer) }
}
