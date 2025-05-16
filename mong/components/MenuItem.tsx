import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  onDelete?: (id: string) => void;
}

export default function MenuItem({ id, name, description, price, image, available, onDelete }: MenuItemProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name,
    description,
    price,
    available
  });
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот пункт меню?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при удалении');
      }

      if (onDelete) {
        onDelete(id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при обновлении');
      }

      // Обновляем локальные данные
      setIsEditing(false);
      router.reload(); // Перезагружаем страницу для обновления данных
    } catch (err) {
      console.error('Edit error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItemId: id,
          quantity: 1,
          name,
          price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при добавлении в корзину');
      }

      alert('Товар добавлен в корзину!');
    } catch (err) {
      console.error('Cart error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Название</label>
            <input
              type="text"
              value={editedData.name}
              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              value={editedData.description}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Цена</label>
            <input
              type="number"
              value={editedData.price}
              onChange={(e) => setEditedData({ ...editedData, price: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={editedData.available}
              onChange={(e) => setEditedData({ ...editedData, available: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">Доступен</label>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {image && (
        <div className="relative h-48">
          <Image
            src={image}
            alt={name}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600 mt-1">{description}</p>
        <p className="text-lg font-bold mt-2">${price.toFixed(2)}</p>
        
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          {session?.user?.role === 'admin' && (
            <>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Редактировать
              </button>
            </>
          )}

          {available && (
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Добавление...' : 'В корзину'}
            </button>
          )}

          {!available && (
            <span className="text-red-500">Нет в наличии</span>
          )}
        </div>
      </div>
    </div>
  );
} 