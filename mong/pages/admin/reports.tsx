import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchOrders();
    } else if (status === 'authenticated') {
      router.push('/menu');
    }
  }, [status, session, dateRange]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?start=${dateRange.start}&end=${dateRange.end}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getPopularItems = () => {
    const itemsMap = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const currentCount = itemsMap.get(item.menuItem._id) || { 
          name: item.menuItem.name,
          quantity: 0,
          revenue: 0
        };
        
        itemsMap.set(item.menuItem._id, {
          name: item.menuItem.name,
          quantity: currentCount.quantity + item.quantity,
          revenue: currentCount.revenue + (item.price * item.quantity)
        });
      });
    });

    return Array.from(itemsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getOrdersByStatus = () => {
    const statusMap = new Map();
    
    orders.forEach(order => {
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
    });

    return Object.fromEntries(statusMap);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          Загрузка...
        </div>
      </Layout>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Отчеты</h1>

        {/* Выбор периода */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Период отчета</h2>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Начало</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Конец</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Общая выручка</h3>
            <p className="text-3xl font-bold text-green-600">
              ${getTotalRevenue().toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Всего заказов</h3>
            <p className="text-3xl font-bold text-blue-600">
              {orders.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Средний чек</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${orders.length ? (getTotalRevenue() / orders.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Популярные товары */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Популярные товары</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getPopularItems().map((item, index) => (
              <div key={index} className="bg-gray-50 rounded p-4">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                <p className="text-sm text-gray-600">Выручка: ${item.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Статусы заказов */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Статусы заказов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(getOrdersByStatus()).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded p-4">
                <h3 className="font-medium capitalize">{status}</h3>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Список заказов */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Последние заказы</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID заказа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 