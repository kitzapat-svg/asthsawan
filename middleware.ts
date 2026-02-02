export { default } from "next-auth/middleware"

// กำหนดพื้นที่หวงห้าม (ใครไม่ล็อกอิน ห้ามเข้าหน้านี้)
export const config = { matcher: ["/staff/:path*"] }
