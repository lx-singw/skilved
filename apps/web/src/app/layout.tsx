import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
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
  themeColor: "#1A56DB",
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
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
