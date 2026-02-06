import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers"; // <--- Import ที่เราสร้างไว้

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ปรับ Metadata ให้ตรงกับชื่อโปรเจกต์ของคุณ
export const metadata: Metadata = {
  title: "Asthma Care Connect",
  description: "ระบบดูแลผู้ป่วยโรคหืด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 1. เรียกใช้ Providers (Session + IdleTimer) เป็นตัวหุ้มชั้นนอกสุด */}
        <Providers>
            {/* 2. เรียกใช้ ThemeProvider (Dark Mode) หุ้มชั้นถัดมา */}
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
