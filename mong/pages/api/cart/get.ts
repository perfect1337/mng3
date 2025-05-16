import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId: session.user.id })
      .populate('items.menuItem')
      .exec();

    if (!cart) {
      return res.status(200).json({ cart: [] });
    }

    res.status(200).json({ cart: cart.items });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Error fetching cart' });
  }
} 