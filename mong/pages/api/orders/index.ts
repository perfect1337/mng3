import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const { start, end } = req.query;
    let query: any = {};

    // Если указан диапазон дат, добавляем его в запрос
    if (start && end) {
      query.createdAt = {
        $gte: new Date(start as string),
        $lte: new Date(end as string)
      };
    }

    // Для обычных пользователей показываем только их заказы
    if (session.user?.role !== 'admin') {
      query.userId = session.user.id;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
} 