import React from 'react';
import { MenuItem } from '../types/menu';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const total = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <p className="text-gray-500 text-center">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.menuItem._id}
            className="flex items-center justify-between border-b pb-4"
          >
            <div>
              <h3 className="font-medium">{item.menuItem.name}</h3>
              <p className="text-gray-600">
                ${item.menuItem.price.toFixed(2)} x {item.quantity}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    onUpdateQuantity(item.menuItem._id, Math.max(0, item.quantity - 1))
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    onUpdateQuantity(item.menuItem._id, item.quantity + 1)
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => onRemoveItem(item.menuItem._id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center font-semibold text-lg mb-4">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart; 