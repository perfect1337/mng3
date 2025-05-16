import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import MenuList from '../../components/MenuList';
import { MenuItem } from '../../types/menu';
import { useRouter } from 'next/router';

interface PopularItem {
  _id: string;
  name: string;
  totalOrders: number;
}

export default function MenuPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = ['all', ...Object.keys(itemsByCategory)];

  useEffect(() => {
    fetchMenuItems();
    if (session?.user?.role === 'admin') {
      fetchPopularItems();
    }
  }, [session]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularItems = async () => {
    try {
      const response = await fetch('/api/analytics/popular-items');
      if (!response.ok) throw new Error('Failed to fetch popular items');
      const data = await response.json();
      setPopularItems(data);
    } catch (err) {
      console.error('Failed to load popular items:', err);
    }
  };

  const handleAddToOrder = async (item: MenuItem) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (addingToCart) return;

    setAddingToCart(true);
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItemId: item._id,
          quantity: 1
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      alert('Товар добавлен в корзину!');
    } catch (err) {
      console.error('Add to cart error:', err);
      setError(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleEdit = async (updatedItem: MenuItem) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Не удалось удалить товар');
      
      setMenuItems(prevItems => prevItems.filter(item => item._id !== id));
    } catch (err) {
      setError('Не удалось удалить товар');
    }
  };

  const handleAddNew = () => {
    // Обновляем список товаров после добавления нового
    fetchMenuItems();
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen">
        Загрузка...
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error: {error}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Меню</h1>
        
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Category selector */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category === 'all' ? 'Все' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Popular items section for admin */}
        {session?.user?.role === 'admin' && popularItems.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Популярные товары</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularItems.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded p-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Количество заказов: {item.totalOrders}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu items by category */}
        {selectedCategory === 'all' ? (
          Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 capitalize">{category}</h2>
              <MenuList
                items={items}
                onAddToOrder={handleAddToOrder}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddNew={handleAddNew}
              />
            </div>
          ))
        ) : (
          <MenuList
            items={itemsByCategory[selectedCategory] || []}
            onAddToOrder={handleAddToOrder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
          />
        )}
      </div>
    </Layout>
  );
} 