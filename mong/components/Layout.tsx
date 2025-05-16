import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-800">Restaurant Menu</span>
              </Link>
            </div>
            
            <div className="flex items-center">
              {session ? (
                <>
                  <Link href="/menu" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Menu
                  </Link>
                  <Link href="/cart" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Cart
                  </Link>
                  {session.user?.role === 'admin' && (
                    <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="ml-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Login
                  </Link>
                  <Link href="/auth/register" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 