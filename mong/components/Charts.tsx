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

interface RevenueData {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

interface DailyRevenue {
  _id: string;
  revenue: number;
  orders: number;
}

interface PopularItem {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ChartsProps {
  data: {
    revenue: RevenueData;
    dailyRevenue: DailyRevenue[];
    popularItems: PopularItem[];
    ordersByStatus: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Charts: React.FC<ChartsProps> = ({ data }) => {
  if (!data.dailyRevenue.length && !data.popularItems.length && Object.keys(data.ordersByStatus).length === 0) {
    return (
      <div className="text-center text-gray-600">
        Нет данных для отображения графиков за выбранный период
      </div>
    );
  }

  // Подготовка данных для графиков
  const dailyData = data.dailyRevenue.map(item => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders
  }));

  const statusData = Object.entries(data.ordersByStatus).map(([name, value]) => ({
    name,
    value
  }));

  const popularItemsData = data.popularItems
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {dailyData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ежедневная выручка</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Выручка"
                  stroke="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Заказы"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {statusData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статусы заказов</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {popularItemsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ 5 популярных товаров</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularItemsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalRevenue"
                  name="Выручка"
                  fill="#8884d8"
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalQuantity"
                  name="Количество"
                  fill="#82ca9d"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts; 