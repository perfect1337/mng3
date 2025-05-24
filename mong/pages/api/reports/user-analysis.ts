import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import User from '../../../models/User';

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

    // Анализ заказов по пользователям
    const userOrderAnalysis = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          orderStatuses: {
            $push: '$status'
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          userName: '$userInfo.name',
          email: '$userInfo.email',
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1,
          orderStatuses: 1,
          lastOrderDate: 1,
          statusCounts: {
            $reduce: {
              input: '$orderStatuses',
              initialValue: {
                pending: 0,
                processing: 0,
                completed: 0,
                cancelled: 0
              },
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$$this', 'pending'] }, then: { pending: { $add: ['$$value.pending', 1] } } },
                        { case: { $eq: ['$$this', 'processing'] }, then: { processing: { $add: ['$$value.processing', 1] } } },
                        { case: { $eq: ['$$this', 'completed'] }, then: { completed: { $add: ['$$value.completed', 1] } } },
                        { case: { $eq: ['$$this', 'cancelled'] }, then: { cancelled: { $add: ['$$value.cancelled', 1] } } }
                      ],
                      default: {}
                    }
                  }
                ]
              }
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // Анализ активности пользователей по времени
    const userActivityTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          dailyOrders: { $sum: 1 },
          dailySpent: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          activityTrend: {
            $push: {
              date: '$_id.date',
              orders: '$dailyOrders',
              spent: '$dailySpent'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userName: '$userInfo.name',
          activityTrend: 1
        }
      }
    ]);

    res.status(200).json({
      userOrderAnalysis,
      userActivityTrends
    });
  } catch (error) {
    console.error('Error in user analysis:', error);
    res.status(500).json({ error: 'Failed to generate user analysis' });
  }
} 