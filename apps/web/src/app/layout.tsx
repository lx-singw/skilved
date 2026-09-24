import type { Metadata, Viewport } from "next"
import { BottomNav } from "@/components/layout/BottomNav"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Skilved — Find your next opportunity",
    template: "%s | Skilved",
  },
  description:
    "Skilved is preparing a free work and study opportunity catalogue for South Africa. Public listings are not available yet.",
  applicationName: "Skilved",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-ZA"
      suppressHydrationWarning
      className="bg-background"
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
