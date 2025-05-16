import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const { menuItemId, quantity } = req.body;

    if (!menuItemId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === menuItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();

    await cart.save();

    res.status(200).json({ 
      message: 'Cart updated successfully',
      cart: cart.items
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Error updating cart' });
  }
} 