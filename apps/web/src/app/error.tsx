"use client"

import { useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { RecoveryPanel } from "@/components/catalogue/NoticeRecovery"
import { RefreshCw } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <><Header /><RecoveryPanel kind="error" action={<button type="button" onClick={reset} className="primary-button"><RefreshCw size={16} aria-hidden />Try again</button>} /></>
  )
}
