import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface CartItem {
  menuItem: MenuItem;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchCart();
    }
  }, [status]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart/get');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при загрузке корзины');
      }

      setCartItems(data.cart || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Create order from cart items
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            menuItem: item.menuItem._id,
            quantity: item.quantity,
            price: item.price
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заказа');
      }

      // Clear the cart
      await fetch('/api/cart/clear', {
        method: 'POST',
      });

      // Redirect to orders page
      router.push('/orders');
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">Загрузка...</div>
      </Layout>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">Ваша корзина пуста</p>
            <button
              onClick={() => router.push('/menu')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Вернуться в меню
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Количество
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item.menuItem._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                Итого: ${total.toFixed(2)}
              </div>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/cart')}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Назад в корзину
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Обработка...' : 'Оформить заказ'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 