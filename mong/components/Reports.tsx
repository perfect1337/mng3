import React from 'react';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

interface ReportProps {
  orders: Order[];
}

const Reports: React.FC<ReportProps> = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center text-gray-600">
        Нет данных о заказах за выбранный период
      </div>
    );
  }

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate popular items
  const popularItems = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!item?.menuItem?._id || !item.menuItem.name) return;
      
      const itemId = item.menuItem._id;
      if (!acc[itemId]) {
        acc[itemId] = {
          name: item.menuItem.name,
          quantity: 0,
          revenue: 0
        };
      }
      acc[itemId].quantity += item.quantity;
      acc[itemId].revenue += item.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const popularItemsList = Object.values(popularItems)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Общая выручка</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Всего заказов</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {orders.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Средний чек</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${(totalRevenue / orders.length).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Ожидают обработки</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {ordersByStatus['pending'] || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статусы заказов</h3>
          <div className="space-y-2">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ 5 популярных позиций</h3>
          <div className="space-y-2">
            {popularItemsList.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span>{item.name}</span>
                <div className="text-right">
                  <span className="font-semibold">{item.quantity} шт.</span>
                  <p className="text-sm text-gray-500">
                    ${item.revenue.toFixed(2)} выручка
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние заказы</h3>
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
                  Позиций
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 10).map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
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
  );
};

export default Reports; 