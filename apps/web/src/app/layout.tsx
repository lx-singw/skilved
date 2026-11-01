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
    "Explore work and study opportunities in South Africa. Browse freely, build a shortlist and find your next step with Skilved.",
  applicationName: "Skilved",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#263b30",
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
        <a className="skip-link" href="#main-content">Skip to content</a>
        <ThemeProvider>
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
