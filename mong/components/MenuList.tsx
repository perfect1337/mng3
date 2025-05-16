import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MenuItem } from '../types/menu';
import Image from 'next/image';
import MenuItemModal from './MenuItemModal';
import { useRouter } from 'next/router';

interface MenuListProps {
  items: MenuItem[];
  onAddToOrder: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (id: string) => void;
  onAddNew?: () => void;
}

const MenuList: React.FC<MenuListProps> = ({ items, onAddToOrder, onEdit, onDelete, onAddNew }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';
  const canManageMenu = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
    setError(null); // Очищаем ошибки при добавлении в корзину
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item._id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item._id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Корзина пуста');
      return;
    }

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Log the cart data being sent
      console.log('Sending cart data:', cart.map(cartItem => ({
        menuItemId: cartItem.item._id,
        quantity: cartItem.quantity,
      })));

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map(cartItem => ({
            menuItemId: cartItem.item._id,
            quantity: cartItem.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || data.message || 'Ошибка при оформлении заказа');
      }

      setCart([]);
      alert('Заказ успешно оформлен!');
    } catch (error) {
      console.error('Checkout error:', error);
      // Try to extract the most useful error message
      const errorMessage = error.response?.data?.error || error.message || 'Произошла ошибка при оформлении заказа';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = cart.reduce(
    (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
    0
  );

  const handleSave = async (itemData: Partial<MenuItem>) => {
    try {
      if (selectedItem) {
        // Редактирование существующего товара
        const response = await fetch(`/api/menu/${selectedItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) throw new Error('Ошибка при обновлении товара');
        
        if (onEdit) {
          const updatedItem = await response.json();
          onEdit(updatedItem);
        }
      } else {
        // Добавление нового товара
        const response = await fetch('/api/menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) throw new Error('Ошибка при добавлении товара');
        
        if (onAddNew) {
          const newItem = await response.json();
          onAddNew();
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  return (
    <>
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={handleAddNewClick}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Добавить новый товар
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image && (
              <div className="h-48 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <p className="mt-1 text-gray-600">{item.description}</p>
              <p className="mt-2 text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {item.available && (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Добавить в корзину
                  </button>
                )}
                
                {!item.available && (
                  <span className="text-red-500">Нет в наличии</span>
                )}
                
                {canManageMenu && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Изменить
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Корзина */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Корзина</h3>
                <div className="space-y-2">
                  {cart.map(({ item, quantity }) => (
                    <div key={item._id} className="flex items-center gap-4">
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, quantity - 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                      <span>${(item.price * quantity).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveFromCart(item._id)}
                        className="text-red-500"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold">
                  Итого: ${totalAmount.toFixed(2)}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Оформление...' : 'Оформить заказ'}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <MenuItemModal
        item={selectedItem || undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};

export default MenuList; 