import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Silence",
  description: "Layer7/Layer4",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen text-foreground">
        {children}
      </body>
    </html>
  )
}
