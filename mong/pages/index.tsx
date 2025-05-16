import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Welcome to Our Restaurant
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Discover our delicious menu and place your order online
            </p>
            
            <div className="mt-8 flex justify-center space-x-4">
              {session ? (
                <>
                  <Link
                    href="/menu"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Menu
                  </Link>
                  <Link
                    href="/orders"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
                  >
                    My Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Browse Menu</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Explore our wide selection of dishes and beverages
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Place Orders</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Order your favorite dishes for pickup or delivery
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Track Orders</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Monitor your order status in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 