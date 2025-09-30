import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PrestaShop Multi-Tenant SaaS Platform",
  description: "Scalable infrastructure for dynamically provisioning isolated PrestaShop e-commerce instances",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}