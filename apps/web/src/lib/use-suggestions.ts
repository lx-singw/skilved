"use client"
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { createSuggestionSession } from "./suggestion-session"
const eventName = "skilved-suggestion-access-changed"
export function useSuggestions() {
  const announce = useRef(() => {})
  const session = useMemo(() => createSuggestionSession(undefined, undefined, () => announce.current()), [])
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot)
  useEffect(() => {
    const identity = Symbol(), refresh = () => { void session.refresh() }, visible = () => { if (document.visibilityState === "visible") refresh() }
    const local = (event: Event) => { if ((event as CustomEvent).detail !== identity) refresh() }
    let channel: BroadcastChannel | undefined
    try { channel = new BroadcastChannel(eventName); channel.onmessage = refresh } catch { /* Focus/pageshow remain available. */ }
    announce.current = () => { window.dispatchEvent(new CustomEvent(eventName, { detail: identity })); try { channel?.postMessage("changed") } catch { /* No secret payload or replay. */ } }
    session.start(); void session.refresh(true)
    window.addEventListener(eventName, local); window.addEventListener("focus", refresh); window.addEventListener("pageshow", refresh); document.addEventListener("visibilitychange", visible)
    return () => { session.stop(); announce.current = () => {}; channel?.close(); window.removeEventListener(eventName, local); window.removeEventListener("focus", refresh); window.removeEventListener("pageshow", refresh); document.removeEventListener("visibilitychange", visible) }
  }, [session])
  return { ...state, action: session.action, reload: () => session.refresh(true) }
}
