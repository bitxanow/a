import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BitNuke",
  description: "Layer7 / Layer4",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#0d0d0d] text-foreground">
        {children}
      </body>
    </html>
  )
}
