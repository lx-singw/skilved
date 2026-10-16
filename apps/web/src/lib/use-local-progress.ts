"use client"

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { createProgressSession } from "./local-progress-session"

const eventName = "skilved-local-progress-changed"
export function useLocalProgress() {
  const announce = useRef(() => {})
  const session = useMemo(() => createProgressSession(undefined, () => announce.current()), [])
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot)
  useEffect(() => {
    const identity = Symbol(), refresh = () => { void session.refresh() }
    const visible = () => { if (document.visibilityState === "visible") refresh() }
    const local = (event: Event) => { if ((event as CustomEvent).detail !== identity) refresh() }
    let channel: BroadcastChannel | undefined
    try { channel = new BroadcastChannel(eventName); channel.onmessage = refresh } catch { /* Focus/pageshow still refresh. */ }
    announce.current = () => {
      window.dispatchEvent(new CustomEvent(eventName, { detail: identity }))
      try { channel?.postMessage("changed") } catch { /* No personal payload; no retry or replay. */ }
    }
    window.addEventListener(eventName, local); window.addEventListener("focus", refresh); window.addEventListener("pageshow", refresh)
    document.addEventListener("visibilitychange", visible)
    void session.refresh(true)
    return () => {
      announce.current = () => {}; channel?.close()
      window.removeEventListener(eventName, local); window.removeEventListener("focus", refresh); window.removeEventListener("pageshow", refresh)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [session])
  return { ...state, change: session.change, reload: () => session.refresh(true) }
}
