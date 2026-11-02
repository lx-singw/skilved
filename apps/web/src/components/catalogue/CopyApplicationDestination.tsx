"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { copyApplicationAddress } from "@/lib/application-clipboard"

export function CopyApplicationDestination({ destination }: { destination:string }) {
  const [message,setMessage] = useState("")
  async function copy() {
    if (message === "Copying address…") return
    setMessage("Copying address…")
    const copied = await copyApplicationAddress(destination,navigator.clipboard)
    setMessage(copied ? "Address copied. You can paste it where you need it." : "Copy could not be confirmed. Select the address above to copy it manually.")
  }
  return <div className="handoff-copy"><button type="button" disabled={message === "Copying address…"} onClick={copy}><Copy size={13} aria-hidden />Copy address</button><p role="status" aria-live="polite">{message}</p></div>
}
