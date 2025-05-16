import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import MenuItem from '../../../models/MenuItem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return res.status(403).json({ error: 'Unauthorized: Only admins and moderators can delete menu items' });
    }

    await dbConnect();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Error deleting menu item' });
  }
} 