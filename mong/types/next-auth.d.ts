import 'next-auth';
import { DefaultSession } from 'next-auth';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'user' | 'moderator' | 'admin';
    } & DefaultSession['user']
    cart: CartItem[];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'moderator' | 'admin';
    image?: string | null;
  }
} 