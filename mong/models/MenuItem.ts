import mongoose, { Document, Model } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  createdAt: Date;
}

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  image: {
    type: String,
    required: false
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Создаем индексы для часто используемых полей
menuItemSchema.index({ name: 1, category: 1 });
menuItemSchema.index({ price: 1 });

// Добавляем индексы для фильтрации и сортировки
menuItemSchema.index({ category: 1, price: 1 }); // Для фильтрации по категории и сортировки по цене
menuItemSchema.index({ available: 1, category: 1 }); // Для фильтрации доступных товаров по категориям
menuItemSchema.index({ createdAt: -1, category: 1 }); // Для сортировки по дате добавления в меню

const MenuItem: Model<IMenuItem> = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', menuItemSchema);

export default MenuItem; 