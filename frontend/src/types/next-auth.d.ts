import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      plan: Plan | null;
      credits: number;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User extends DefaultUser {
    role: string;
    plan: Plan | null;
    credits: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    plan: Plan | null;
    credits: number;
    accessToken: string;
  }
}