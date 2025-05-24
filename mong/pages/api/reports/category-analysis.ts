import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';

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
    const startDate = start ? new Date(start as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end as string) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Агрегация по категориям
    const categoryAnalysis = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalOrders: { $sum: '$items.quantity' },
          averageOrderValue: { $avg: '$items.price' },
          items: { 
            $push: {
              name: '$items.name',
              quantity: '$items.quantity',
              revenue: { $multiply: ['$items.price', '$items.quantity'] }
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: 1,
          topItems: { $slice: ['$items', 5] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Тренды по времени для категорий
    const categoryTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            category: '$items.category',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          dailyRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          dailyOrders: { $sum: '$items.quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          trends: {
            $push: {
              date: '$_id.date',
              revenue: '$dailyRevenue',
              orders: '$dailyOrders'
            }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      categoryAnalysis,
      categoryTrends
    });
  } catch (error) {
    console.error('Error in category analysis:', error);
    res.status(500).json({ error: 'Failed to generate category analysis' });
  }
} 