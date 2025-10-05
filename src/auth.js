import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "@/lib/mongodb";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        login: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          throw new Error("Username/Email dan password harus diisi");
        }

        await connectDB();

        // Cari user berdasarkan username atau email
        const user = await User.findOne({
          $or: [
            { username: credentials.login },
            { email: credentials.login },
          ],
        });

        if (!user) {
          throw new Error("User tidak ditemukan");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // Return user object (akan disimpan di session)
        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 hari - token akan expired setelah 7 hari idle
    updateAge: 24 * 60 * 60,  // 1 hari - token akan di-refresh setiap 1 hari (SLIDING SESSION)
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Saat login pertama kali, tambahkan data user ke token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.displayName = user.displayName;
        token.email = user.email;
      }

      // SLIDING SESSION: Setiap kali token di-refresh (setiap 1 hari),
      // update timestamp agar token tetap fresh
      // Ini membuat user yang aktif tidak pernah logout otomatis

      return token;
    },
    async session({ session, token }) {
      // Tambahkan data dari token ke session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
