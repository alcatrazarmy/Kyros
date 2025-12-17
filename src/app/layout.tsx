import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeonGlow - Kyros Memory Core",
  description: "Advanced biometric memory bank for secure API token and project management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased dark">
        {children}
      </body>
    </html>
  );
}
