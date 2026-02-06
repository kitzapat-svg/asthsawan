"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

// ตั้งเวลา Timeout ตรงนี้ (หน่วย: มิลลิวินาที)
const TIMEOUT_MS = 15 * 60 * 1000; // 15 นาที
// const TIMEOUT_MS = 10 * 1000; // (เอาไว้ลองเทส: 10 วินาที)

export function IdleTimer() {
  const { data: session } = useSession();
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // ถ้าไม่ได้ Login ก็ไม่ต้องจับเวลา
    if (!session) return;

    // ฟังก์ชันอัปเดตเวลาล่าสุดที่ขยับ
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // ตัวจับเวลา (Check ทุก 1 วินาที)
    const interval = setInterval(() => {
      const now = Date.now();
      // ถ้าเวลาปัจจุบัน - เวลาล่าสุด > Timeout -> สั่ง Logout
      if (now - lastActivity > TIMEOUT_MS) {
        // แจ้งเตือนก่อนดีดออก (Optional)
        // alert("หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่"); 
        signOut({ callbackUrl: "/auth/signin" });
      }
    }, 1000);

    // ดักจับ Event ต่างๆ
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [session, lastActivity]);

  return null; // Component นี้ทำงานเบื้องหลัง ไม่ต้องแสดงผลอะไร
}
