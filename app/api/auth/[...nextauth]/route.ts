import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 1. ต้อง export authOptions ออกมา เพื่อให้ api/db เรียกใช้เช็คสิทธิ์ได้
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const password = credentials?.password;
        
        // --- แก้ไข: ใส่วงเล็บปิด ) ให้ครบถ้วน ---
        if (password === process.env.ADMIN_PASSWORD) {
          return { id: "1", name: "Staff Admin", email: "staff@hospital.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 ชั่วโมง
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
