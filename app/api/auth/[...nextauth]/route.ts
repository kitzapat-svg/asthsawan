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

export { handler as GET, handler as POST }
