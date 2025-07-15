import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { api } from "@/lib/api-client"
import { User } from "next-auth"
import { JWT } from "next-auth/jwt"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials) {
          return null;
        }

        try {
          const { email, password } = credentials;
          const response = await api.login(email, password);

          if (response.data && response.data.token) {
            const decodedToken: { id: string } = JSON.parse(atob(response.data.token.split('.')[1]));
            return {
              id: decodedToken.id,
              email: email,
              accessToken: response.data.token
            };
          } else {
            throw new Error(response.error || "Authentication failed");
          }
        } catch (error: any) {
          console.error("Authorize error:", error);
          throw new Error(error.message || "An error occurred during authorization");
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> {
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
}

export default NextAuth(authOptions);