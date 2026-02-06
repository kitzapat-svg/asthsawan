import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers"; // <--- Import ไฟล์ที่เราเพิ่งสร้าง

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AsthSawan",
  description: "Empower your business with cutting-edge solutions. Build faster, scale smarter, grow bigger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* เรียกใช้ Providers เพื่อหุ้มทั้งแอป */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


