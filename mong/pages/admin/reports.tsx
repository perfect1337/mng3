import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Charts from '../../components/Charts';
import Reports from '../../components/Reports';

interface ReportData {
  revenue: {
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
  };
  ordersByStatus: Record<string, number>;
  popularItems: Array<{
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchReportData();
    } else if (status === 'authenticated') {
      router.push('/menu');
    }
  }, [status, session, dateRange]);

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports/stats?start=${dateRange.start}&end=${dateRange.end}`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-500">
          Error: {error}
        </div>
      </Layout>
    );
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

        {reportData && (
          <>
            {/* Графики */}
            <div className="mb-8">
              <Charts data={reportData} />
            </div>

            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Общая выручка</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${reportData.revenue.totalRevenue.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Всего заказов</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {reportData.revenue.totalOrders}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Средний чек</h3>
                <p className="text-3xl font-bold text-purple-600">
                  ${reportData.revenue.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Популярные товары */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Популярные товары</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.popularItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded p-4">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">Количество: {item.totalQuantity}</p>
                    <p className="text-sm text-gray-600">Выручка: ${item.totalRevenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Статусы заказов */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Статусы заказов</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(reportData.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 rounded p-4">
                    <h3 className="font-medium capitalize">{status}</h3>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 