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
      return res.status(403).json({ error: 'Unauthorized: Only admins can view analytics' });
    }

    await dbConnect();

    // Get popular items based on order history
    const popularItems = await Order.aggregate([
      // Only consider non-cancelled orders
      { $match: { status: { $ne: 'cancelled' } } },
      // Unwind the items array to treat each item separately
      { $unwind: '$items' },
      // Group by menuItem and count occurrences
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalOrders: { $sum: '$items.quantity' }
        }
      },
      // Sort by total orders in descending order
      { $sort: { totalOrders: -1 } },
      // Limit to top 10 items
      { $limit: 10 },
      // Project the fields we want to return
      {
        $project: {
          _id: 1,
          name: 1,
          totalOrders: 1
        }
      }
    ]);

    res.status(200).json(popularItems);
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ error: 'Failed to fetch popular items' });
  }
} 