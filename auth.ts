import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtCallback, sessionCallback } from "@/lib/auth/callbacks";
import { authenticate } from "@/lib/auth/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await authenticate(credentials);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => jwtCallback({ token, user }),
    session: ({ session, token }) => sessionCallback({ session, token }),
  },
});
