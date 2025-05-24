import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Order, { IOrder, IOrderItem } from '../../../models/Order';
import { Types } from 'mongoose';

interface MenuItem {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

// Интерфейс для заказа с заполненными данными о товарах
interface PopulatedOrderItem extends Omit<IOrderItem, 'menuItem'> {
  menuItem: MenuItem | null;
}

interface OrderWithPopulatedItems extends Omit<IOrder, 'items'> {
  items: PopulatedOrderItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    endDate.setHours(23, 59, 59, 999);

    // Получаем все заказы за период с полной информацией о товарах
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate<OrderWithPopulatedItems>('items.menuItem');

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        revenue: {
          totalRevenue: 0,
          averageOrderValue: 0,
          totalOrders: 0
        },
        dailyRevenue: [],
        popularItems: [],
        ordersByStatus: {},
        orders: []
      });
    }

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
        // Пропускаем позиции с отсутствующими данными о товаре
        if (!item?.menuItem?._id || !item.menuItem.name) return;
        
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
      ordersByStatus,
      orders: orders.map(order => ({
        _id: order._id,
        userId: order.userId,
        items: order.items
          .filter(item => item?.menuItem) // Фильтруем позиции с отсутствующими данными
          .map(item => ({
            menuItem: {
              _id: item.menuItem!._id,
              name: item.menuItem!.name,
              price: item.menuItem!.price
            },
            quantity: item.quantity,
            price: item.price
          })),
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 