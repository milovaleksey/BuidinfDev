import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../services/AuthService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Lock } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await authService.login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Неверные учетные данные');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Building2 className="size-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Система управления зданием</CardTitle>
          <CardDescription className="text-base">
            Войдите в систему для доступа к панели управления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-2xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-2xl h-12"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-2xl">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <span>Вход...</span>
              ) : (
                <>
                  <Lock className="mr-2 size-4" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm mb-2">Тестовые учетные данные:</p>
            <div className="text-xs space-y-1 text-gray-600">
              <p><strong>admin</strong> / admin123 - полный доступ</p>
              <p><strong>manager</strong> / manager123 - управление системами</p>
              <p><strong>operator</strong> / operator123 - базовое управление</p>
              <p><strong>viewer</strong> / viewer123 - только просмотр</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}