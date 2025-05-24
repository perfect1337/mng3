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
  Line
} from 'recharts';

interface CategoryAnalysisProps {
  categoryAnalysis: Array<{
    category: string;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topItems: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
  }>;
  categoryTrends: Array<{
    _id: string;
    trends: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  }>;
}

const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({
  categoryAnalysis,
  categoryTrends
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Анализ по категориям</h2>
        
        {/* График выручки по категориям */}
        <div className="h-[400px] mb-8">
          <h3 className="text-lg font-semibold mb-4">Выручка по категориям</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalRevenue" name="Выручка" fill="#8884d8" />
              <Bar dataKey="totalOrders" name="Количество заказов" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Детальная информация по категориям */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryAnalysis.map((category) => (
            <div
              key={category.category}
              className="bg-gray-50 rounded-lg p-4"
            >
              <h4 className="text-lg font-semibold mb-2">{category.category}</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Выручка: ${category.totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Заказов: {category.totalOrders}
                </p>
                <p className="text-sm text-gray-600">
                  Средний чек: ${category.averageOrderValue.toFixed(2)}
                </p>
                <div className="mt-4">
                  <h5 className="text-sm font-semibold mb-2">Топ позиций:</h5>
                  <ul className="text-sm text-gray-600">
                    {category.topItems.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity} шт.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Тренды по категориям */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Тренды по категориям</h2>
        <div className="space-y-8">
          {categoryTrends.map((categoryTrend) => (
            <div key={categoryTrend._id} className="h-[300px]">
              <h3 className="text-lg font-semibold mb-4">
                Категория: {categoryTrend._id}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryTrend.trends}>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysis; 