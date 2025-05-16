import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const { itemId } = req.query;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date();

    await cart.save();

    res.status(200).json({ 
      message: 'Item removed from cart successfully',
      cart: cart.items
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Error removing item from cart' });
  }
} 