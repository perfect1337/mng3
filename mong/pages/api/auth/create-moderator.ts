import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Только администраторы могут создавать модераторов
    if (!session?.user?.role || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Only admins can create moderators' });
    }

    await dbConnect();

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create moderator user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'moderator'
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Moderator creation error:', error);
    res.status(500).json({ error: 'Error creating moderator user' });
  }
} 