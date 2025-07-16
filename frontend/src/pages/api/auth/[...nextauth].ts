import NextAuth, { AuthOptions, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.INTERNAL_API_URL || 'http://localhost:5001';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Veuillez fournir un email et un mot de passe.');
        }

        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        });
        
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.message || 'Erreur d\'authentification');
        }
        
        // La réponse de notre backend contient le token
        const user = {
            ...responseData.user,
            token: responseData.token
        };

        return user;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      // Le `user` objet ici est celui retourné par `authorize`
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.credits = user.credits; // Ajouter les crédits au token
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      // Exposer les données du token à la session côté client
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.credits = token.credits; // Exposer les crédits à la session
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);