// lib/auth.ts
import { type NextAuthOptions, type Profile } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

interface AppUser {
  _id?: ObjectId;
  name?: string | null;
  email: string | undefined;
  image?: string | null;
  password?: string;
  cart: string[];
  favorites: string[];
  emailVerified: Date | null;
  role: string;
}

interface GoogleProfile extends Profile {
  picture?: string;
  role?: string;
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text', optional: true },
        image: { label: 'Image URL', type: 'url', optional: true },
        isSignUp: { label: 'Is Sign Up', type: 'hidden' },
        role: { label: 'Role', type: "text", optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const { email, password, name, image } = credentials;
        const isSignUp = credentials.isSignUp === 'true';
        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection<AppUser>('users');

        // Sign-up logic
        if (isSignUp) {
          const existingUser = await usersCollection.findOne({ email });
          if (existingUser) throw new Error('User already exists');

          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser: AppUser = {
            email,
            password: hashedPassword,
            name: name || null,
            image: image || null,
            emailVerified: new Date(),
            cart: [],
            favorites: [],
            role: 'user'
          };

          const result = await usersCollection.insertOne(newUser);
          return { 
            ...newUser,
            id: result.insertedId.toString(),
            password: undefined // Remove password from session
          };
        }

        // Login logic
        const user = await usersCollection.findOne({ email });
        if (!user) throw new Error('User not found');
        if (!user.password) throw new Error('Password not set');
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('Invalid password');

        return { 
          id: user._id?.toString() || '', 
          email: user.email, 
          name: user.name, 
          image: user.image,
          cart: user.cart || [],
          favorites: user.favorites || [],
          role: user.role || 'user'
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const googleProfile = profile as GoogleProfile;
        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection<AppUser>('users');
        const accountsCollection = db.collection('accounts');
        
        // 1. Check for existing email/password account
        const emailUser = await usersCollection.findOne({ 
          email: googleProfile.email,
          password: { $exists: true }
        });
        
        if (emailUser) {
          // Link Google account to existing email/password user
          await accountsCollection.insertOne({
            userId: emailUser._id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
          });
          
          // Update session user with existing account data
          user.id = emailUser._id?.toString() || '';
          user.name = emailUser.name || googleProfile.name;
          user.email = emailUser.email;
          user.image = emailUser.image || googleProfile.picture;
          user.cart = emailUser.cart || [];
          user.favorites = emailUser.favorites || [];
          user.role = emailUser.role || "user"
          
          // Update profile picture if missing
          if (!emailUser.image && googleProfile.picture) {
            await usersCollection.updateOne(
              { _id: emailUser._id },
              { $set: { image: googleProfile.picture } }
            );
          }
          
          return true;
        }
        
        // 2. Check for existing Google account
        const existingUser = await usersCollection.findOne({ 
          email: googleProfile.email,
          password: { $exists: false }
        });
        
        if (existingUser) {
          // Update existing Google user
          const updateData: Partial<AppUser> = {};
          if (googleProfile.picture) updateData.image = googleProfile.picture;
          if (!existingUser.emailVerified) updateData.emailVerified = new Date();
          if (!existingUser.cart) updateData.cart = [];
          if (!existingUser.favorites) updateData.favorites = [];
          if (!existingUser.role) updateData.role = 'user';
          
          if (Object.keys(updateData).length > 0) {
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { $set: updateData }
            );
          }
          
          // Update session user
          user.id = existingUser._id?.toString() || '';
          user.name = existingUser.name || googleProfile.name;
          user.email = existingUser.email;
          user.image = updateData.image || existingUser.image;
          user.cart = updateData.cart || existingUser.cart || [];
          user.favorites = updateData.favorites || existingUser.favorites || [];
          user.role = updateData.role || existingUser.role || 'user'
          
          return true;
        }
        
        // 3. Create new Google user
        const newUser: AppUser = {
          name: googleProfile.name || null,
          email: googleProfile.email,
          image: googleProfile.picture || null,
          emailVerified: new Date(),
          cart: [],
          favorites: [],
          role: 'user'
        };
        
        const result = await usersCollection.insertOne(newUser);
        user.id = result.insertedId.toString();
        user.name = newUser.name;
        user.email = newUser.email;
        user.image = newUser.image;
        user.cart = [];
        user.favorites = [];
        user.role = newUser.role
      }
      return true;
    },
    
    async jwt({ token, user, trigger, session }) {
      // Add user info to token on signin
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.cart = user.cart || [];
        token.favorites = user.favorites || [];
        token.role = user.role || 'user';
      }
      
      // Update token when session is updated (like after profile updates)
      if (trigger === "update" && session?.user) {
        // Fetch the latest user data from database to ensure we have the most current
        const client = await clientPromise;
        const db = client.db();
        const userData = await db.collection('users').findOne({
          _id: new ObjectId(token.id as string)
        });
        
        if (userData) {
          token.name = userData.name;
          token.email = userData.email;
          token.image = userData.image;
          token.cart = userData.cart || [];
          token.favorites = userData.favorites || [];
          token.role = userData.role || 'user';
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null | undefined;
        session.user.email = token.email as string;
        session.user.image = token.image as string | null | undefined;
        session.user.cart = token.cart as string[];
        session.user.favorites = token.favorites as string[];
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;