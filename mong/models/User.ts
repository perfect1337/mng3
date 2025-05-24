import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Добавляем индексы для управления пользователями
userSchema.index({ role: 1, createdAt: -1 }); // Для фильтрации пользователей по роли и дате регистрации
userSchema.index({ email: 1, role: 1 }); // Для поиска пользователей по email с учетом роли

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User; 