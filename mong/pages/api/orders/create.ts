import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import MenuItem from '../../../models/MenuItem';
import { IOrderItem } from '../../../models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!session.user?.id) {
      return res.status(401).json({ error: 'User ID not found in session' });
    }

    await dbConnect();

    const { items } = req.body;

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order items', receivedItems: items });
    }

    // Log the incoming items for debugging
    console.log('Received order items:', items);
    console.log('Session user:', session.user);

    // Validate each item has required fields
    for (const item of items) {
      if (!item.menuItemId || !item.quantity) {
        return res.status(400).json({
          error: 'Invalid item format',
          invalidItem: item,
          requiredFormat: { menuItemId: 'string', quantity: 'number' }
        });
      }
    }

    // Получаем актуальные данные товаров из базы данных
    const itemIds = items.map(item => item.menuItemId);
    console.log('Looking up menu items with IDs:', itemIds);

    const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).lean().exec();
    console.log('Found menu items:', menuItems);

    if (menuItems.length !== itemIds.length) {
      const foundIds = menuItems.map(item => item._id.toString());
      const missingIds = itemIds.filter(id => !foundIds.includes(id.toString()));
      return res.status(400).json({
        error: 'Some menu items not found',
        missingIds,
        requestedIds: itemIds,
        foundIds
      });
    }

    // Создаем мапу товаров для быстрого доступа
    const menuItemsMap = menuItems.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    // Формируем items для заказа с актуальными данными
    const orderItems: IOrderItem[] = items.map(item => {
      const menuItem = menuItemsMap[item.menuItemId];
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      };
    });

    // Рассчитываем общую сумму заказа
    const totalAmount = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Создаем новый заказ с правильным полем userId
    const orderData = {
      userId: session.user.id, // Убедимся, что используем правильное поле
      items: orderItems,
      status: 'pending',
      totalAmount
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);
    console.log('Order created successfully:', order._id);

    const populatedOrder = await Order.findById(order._id).populate('items.menuItem');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    // Send more detailed error information
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 