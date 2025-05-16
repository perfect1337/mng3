import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';
import MenuItem, { IMenuItem } from '../../../models/MenuItem';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized: Please login first' });
    }

    await dbConnect();

    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    // Get the menu item to ensure it exists and get its current data
    const menuItem = await MenuItem.findById(menuItemId) as IMenuItem;
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Find or create cart for the user
    let cart = await Cart.findOne({ userId: session.user.id });
    
    if (!cart) {
      cart = new Cart({
        userId: new mongoose.Types.ObjectId(session.user.id),
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === menuItemId
    );
    
    if (existingItemIndex > -1) {
      // If item exists, increase quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // If item doesn't exist, add new item
      cart.items.push({
        menuItem: menuItem._id as unknown as mongoose.Types.ObjectId,
        quantity
      });
    }

    // Update cart timestamp
    cart.updatedAt = new Date();

    // Save cart
    await cart.save();

    // Get populated cart items
    const populatedCart = await Cart.findById(cart._id).populate('items.menuItem');

    res.status(200).json({ 
      message: 'Item added to cart successfully',
      cart: populatedCart.items
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Error adding item to cart' });
  }
} 