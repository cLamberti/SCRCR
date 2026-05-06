import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCRCR - Sistema de Control y Registro",
  description: "Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos - Iglesia Bíblica Emanuel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AccessibilityProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
