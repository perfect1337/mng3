import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { Types } from 'mongoose';

interface MenuItem {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
}

interface Order {
  _id: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await dbConnect();

    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    endDate.setHours(23, 59, 59, 999);

    // Получаем все заказы за период
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate<{ items: { menuItem: MenuItem }[] }>('items.menuItem');

    // Общая статистика
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Статистика по дням
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Популярные товары
    const popularItems = new Map<string, { name: string; totalQuantity: number; totalRevenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.menuItem || !item.menuItem.name) return;
        
        const menuItemId = item.menuItem._id.toString();
        const current = popularItems.get(menuItemId) || {
          name: item.menuItem.name,
          totalQuantity: 0,
          totalRevenue: 0
        };
        
        popularItems.set(menuItemId, {
          name: item.menuItem.name,
          totalQuantity: current.totalQuantity + item.quantity,
          totalRevenue: current.totalRevenue + (item.price * item.quantity)
        });
      });
    });

    // Статусы заказов
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      revenue: {
        totalRevenue,
        averageOrderValue,
        totalOrders
      },
      dailyRevenue,
      popularItems: Array.from(popularItems.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 6),
      ordersByStatus
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 