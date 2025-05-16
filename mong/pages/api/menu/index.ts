import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import MenuItem from '../../../models/MenuItem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const menuItems = await MenuItem.find({ available: true }).exec();
        res.status(200).json(menuItems);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu items' });
      }
      break;

    case 'POST':
      if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
        return res.status(403).json({ error: 'Unauthorized: Only admins and moderators can manage menu items' });
      }

      try {
        const menuItem = await MenuItem.create(req.body);
        res.status(201).json(menuItem);
      } catch (error) {
        res.status(400).json({ error: 'Failed to create menu item' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 