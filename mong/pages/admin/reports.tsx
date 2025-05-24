import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Charts from '../../components/Charts';
import Reports from '../../components/Reports';
import CategoryAnalysis from '../../components/CategoryAnalysis';
import UserAnalysis from '../../components/UserAnalysis';

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
  orders: Array<{
    _id: string;
    userId: string;
    items: Array<{
      menuItem: {
        _id: string;
        name: string;
        price: number;
      };
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: string;
  }>;
}

interface CategoryData {
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

interface UserData {
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

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchAllReports();
    } else if (status === 'authenticated') {
      router.push('/menu');
    }
  }, [status, session, dateRange]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      // Загрузка общих отчетов
      const reportResponse = await fetch(`/api/reports/stats?start=${dateRange.start}&end=${dateRange.end}`);
      if (!reportResponse.ok) throw new Error('Failed to fetch report data');
      const reportJson = await reportResponse.json();
      setReportData(reportJson);

      // Загрузка анализа по категориям
      const categoryResponse = await fetch(`/api/reports/category-analysis?start=${dateRange.start}&end=${dateRange.end}`);
      if (!categoryResponse.ok) throw new Error('Failed to fetch category analysis');
      const categoryJson = await categoryResponse.json();
      setCategoryData(categoryJson);

      // Загрузка анализа по пользователям
      const userResponse = await fetch(`/api/reports/user-analysis?start=${dateRange.start}&end=${dateRange.end}`);
      if (!userResponse.ok) throw new Error('Failed to fetch user analysis');
      const userJson = await userResponse.json();
      setUserData(userJson);
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

        {/* Табы для переключения между отчетами */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Общая статистика
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Анализ по категориям
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Анализ по пользователям
              </button>
            </nav>
          </div>
        </div>

        {/* Контент отчетов */}
        {activeTab === 'general' && reportData && (
          <>
            <div className="mb-8">
              <Charts data={reportData} />
            </div>
            <Reports orders={reportData.orders} />
          </>
        )}

        {activeTab === 'categories' && categoryData && (
          <CategoryAnalysis
            categoryAnalysis={categoryData.categoryAnalysis}
            categoryTrends={categoryData.categoryTrends}
          />
        )}

        {activeTab === 'users' && userData && (
          <UserAnalysis
            userOrderAnalysis={userData.userOrderAnalysis}
            userActivityTrends={userData.userActivityTrends}
          />
        )}
      </div>
    </Layout>
  );
} 