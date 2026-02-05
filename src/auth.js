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

        // Check if this is a passkey authentication
        // Format: __PASSKEY_AUTH__:userId
        if (credentials.password.startsWith("__PASSKEY_AUTH__:")) {
          const userId = credentials.password.replace("__PASSKEY_AUTH__:", "");

          // Get user by ID (passkey auth already verified)
          const user = await User.findById(userId);

          if (!user) {
            throw new Error("User tidak ditemukan");
          }

          // Return user object for passkey auth
          return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar || null,
          };
        }

        // Regular password authentication
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

        // Check if user is banned
        if (user.isBanned) {
          throw new Error(`Akun Anda telah dibanned. Alasan: ${user.bannedReason || "Pelanggaran kebijakan platform"}`);
        }

        // Check if user is suspended
        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
          const suspendUntilDate = new Date(user.suspendedUntil).toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
          });
          throw new Error(`Akun Anda disuspend sampai ${suspendUntilDate}. Alasan: ${user.suspensionReason || "Pelanggaran sementara"}`);
        }

        // Periksa apakah akun sudah terverifikasi
        if (!user.isVerified) {
          throw new Error("Akun belum terverifikasi. Silakan cek email Anda untuk link verifikasi.");
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
          avatar: user.avatar || null,
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
        token.avatar = user.avatar;
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
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Ini memungkinkan NextAuth bekerja dengan localhost dan ngrok
});
