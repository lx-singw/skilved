import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { BottomNav } from "@/components/layout/BottomNav"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Skilved — Trades opportunities across South Africa",
    template: "%s | Skilved",
  },
  description:
    "Apprenticeships, learnerships, bursaries and trade jobs across South Africa. Updated by AI every 4 hours. Apply directly, no signup required.",
  applicationName: "Skilved",
  keywords: [
    "apprenticeship South Africa",
    "learnership",
    "SETA",
    "trade jobs",
    "bursary",
    "artisan jobs",
  ],
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
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}
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
