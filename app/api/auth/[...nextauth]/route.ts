import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const isValid = credentials?.password === process.env.ADMIN_PASSWORD;

        if (isValid) {
          return { id: "1", name: "Staff Admin", email: "admin@asthma.care" }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin', // เดี๋ยวเราค่อยทำหน้า Login สวยๆ ทีหลัง
  },
  secret: process.env.NEXTAUTH_SECRET,
})
// --- ส่วนที่เพิ่มเข้ามา (Timeout) ---
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 ชั่วโมง (หน่วยเป็นวินาที)
  },
  jwt: {
    maxAge: 8 * 60 * 60, // ต้องตั้งให้เท่ากับ session
  },
  // --------------------------------
});

export { handler as GET, handler as POST }
