import mongoose, { Document, Model } from 'mongoose';

export interface ICartItem {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);

export default Cart; 