"use client"; // บรรทัดนี้สำคัญมาก! บอกว่าเป็น Client Component

import { SessionProvider } from "next-auth/react";
import { IdleTimer } from "@/components/idle-timer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* ใส่ Timer ไว้ข้างในนี้ เพื่อให้เรียกใช้ session ได้ */}
      <IdleTimer />
      {children}
    </SessionProvider>
  );
}
