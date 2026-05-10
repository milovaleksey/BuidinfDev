import { useEffect, useState } from 'react';
import { integratedBuildingService } from '../services/IntegratedBuildingService';
import { Loader2 } from 'lucide-react';

interface DataLoaderProps {
  children: React.ReactNode;
}

/**
 * DataLoader - компонент для загрузки данных из бэкенда при старте приложения
 * Показывает экран загрузки, пока данные загружаются
 */
export function DataLoader({ children }: DataLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await integratedBuildingService.init();
        console.log('✅ Данные загружены успешно');
      } catch (err) {
        console.error('❌ Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные. Используется локальная версия.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-700">Загрузка данных...</h2>
          <p className="text-gray-500">Подключаемся к серверу</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700">Предупреждение</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
