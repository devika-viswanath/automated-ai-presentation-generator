import { env } from "@/env";
import { db } from "@/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      hasAccess: boolean;
      location?: string;
      role: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    hasAccess: boolean;
    role: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.hasAccess = user.hasAccess;
        token.name = user.name;
        token.image = user.image;
        token.picture = user.image;
        token.location = (user as Session["user"]).location;
        token.role = user.role;
        token.isAdmin = user.role === "ADMIN";
      }

      // Handle updates
      if (trigger === "update" && (session as Session)?.user) {
        try {
          const user = await db.user.findUnique({
            where: { id: token.id as string },
          });
          if (session) {
            token.name = (session as Session).user.name;
            token.image = (session as Session).user.image;
            token.picture = (session as Session).user.image;
            token.location = (session as Session).user.location;
            token.role = (session as Session).user.role;
            token.isAdmin = (session as Session).user.role === "ADMIN";
          }
          if (user) {
            token.hasAccess = user?.hasAccess ?? false;
            token.role = user.role;
            token.isAdmin = user.role === "ADMIN";
          }
        } catch (error) {
          console.error("Error updating session:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.hasAccess = token.hasAccess as boolean;
      session.user.location = token.location as string;
      session.user.role = token.role as string;
      session.user.isAdmin = token.role === "ADMIN";
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true, hasAccess: true, role: true },
        });

        if (dbUser) {
          user.hasAccess = dbUser.hasAccess;
          user.role = dbUser.role;
        } else {
          user.hasAccess = false;
          user.role = "USER";
        }
      }

      return true;
    },
  },

  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    // Credentials provider for local development
    CredentialsProvider({
      name: "Local Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@local.dev" },
        name: { label: "Name", type: "text", placeholder: "Local User" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string) || "local@local.dev";
        const name = (credentials?.name as string) || "Local User";

        // Find or create a local user
        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
              hasAccess: true,
              role: "ADMIN",
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          hasAccess: user.hasAccess,
          role: user.role,
        };
      },
    }),
    // Google OAuth provider (only if credentials are configured)
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
});
