import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import MenuItem from '../../../models/MenuItem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const session = await getServerSession(req, res, authOptions);

    // Проверяем наличие сессии и роли админа или модератора
    if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return res.status(403).json({ error: 'Unauthorized: Only admins and moderators can modify menu items' });
    }

    await dbConnect();

    const { id } = req.query;

    switch (method) {
      case 'DELETE':
        try {
          const deletedItem = await MenuItem.findByIdAndDelete(id);

          if (!deletedItem) {
            return res.status(404).json({ error: 'Menu item not found' });
          }

          res.status(200).json({ message: 'Menu item deleted successfully' });
        } catch (error) {
          console.error('Delete menu item error:', error);
          res.status(500).json({ error: 'Error deleting menu item' });
        }
        break;

      case 'PUT':
        try {
          const updatedItem = await MenuItem.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true, runValidators: true }
          );

          if (!updatedItem) {
            return res.status(404).json({ error: 'Menu item not found' });
          }

          res.status(200).json(updatedItem);
        } catch (error) {
          console.error('Update menu item error:', error);
          res.status(500).json({ error: 'Error updating menu item' });
        }
        break;

      default:
        res.setHeader('Allow', ['DELETE', 'PUT']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 