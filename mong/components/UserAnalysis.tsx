import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface UserAnalysisProps {
  userOrderAnalysis: Array<{
    _id: string;
    userName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string;
    statusCounts: {
      pending: number;
      processing: number;
      completed: number;
      cancelled: number;
    };
  }>;
  userActivityTrends: Array<{
    userName: string;
    activityTrend: Array<{
      date: string;
      orders: number;
      spent: number;
    }>;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const UserAnalysis: React.FC<UserAnalysisProps> = ({
  userOrderAnalysis,
  userActivityTrends
}) => {
  // Подготовка данных для графиков
  const topSpenders = userOrderAnalysis
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Топ покупателей */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Топ покупателей</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSpenders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="userName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSpent" name="Общая сумма покупок" fill="#8884d8" />
              <Bar dataKey="totalOrders" name="Количество заказов" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Детальная информация по пользователям */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Детальная информация по пользователям</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrderAnalysis.map((user) => (
            <div key={user._id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{user.userName}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Всего заказов: {user.totalOrders}
                </p>
                <p className="text-sm text-gray-600">
                  Общая сумма: ${user.totalSpent.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Средний чек: ${user.averageOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Последний заказ: {new Date(user.lastOrderDate).toLocaleDateString()}
                </p>
                
                {/* Статусы заказов пользователя */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Статусы заказов</h4>
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(user.statusCounts).map(([key, value]) => ({
                            name: key,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(user.statusCounts).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Тренды активности пользователей */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Тренды активности пользователей</h2>
        <div className="space-y-8">
          {userActivityTrends.map((userTrend) => (
            <div key={userTrend.userName} className="h-[300px]">
              <h3 className="text-lg font-semibold mb-4">
                Пользователь: {userTrend.userName}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrend.activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spent"
                    name="Сумма покупок"
                    stroke="#8884d8"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Количество заказов"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserAnalysis; 