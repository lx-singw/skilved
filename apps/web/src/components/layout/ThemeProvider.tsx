"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  // Sync with localStorage and apply class to <html>
  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem("skilved-theme") } catch { /* Browsing works without storage. */ }
    const initial = stored === "dark" ? "dark" : "light"
    setTheme(initial)
    document.documentElement.classList.toggle("dark", initial === "dark")
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light"
      try { localStorage.setItem("skilved-theme", next) } catch { /* Keep the choice for this visit. */ }
      document.documentElement.classList.toggle("dark", next === "dark")
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
