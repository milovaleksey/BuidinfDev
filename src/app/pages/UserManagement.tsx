import { useState, useEffect } from 'react';
import { authService } from '../services/AuthService';
import { userManagementService } from '../services/UserManagementService';
import { BackendUser, CreateUserRequest, UpdateUserRequest, RoleData } from '../types/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2,
  Power,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  'ADMIN': { label: 'Администратор', description: 'Полный доступ ко всем функциям', color: 'bg-red-100 text-red-800' },
  'MANAGER': { label: 'Менеджер', description: 'Управление системами и этажами', color: 'bg-blue-100 text-blue-800' },
  'OPERATOR': { label: 'Оператор', description: 'Базовое управление устройствами', color: 'bg-green-100 text-green-800' },
  'VIEWER': { label: 'Наблюдатель', description: 'Только просмотр', color: 'bg-gray-100 text-gray-800' },
};

interface FormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleIds: number[];
}

export function UserManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roleIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userManagementService.getAllUsers(),
        userManagementService.getAllRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  if (!authService.canManageUsers()) {
    return (
      <div className="p-8">
        <p className="text-red-600">У вас нет прав для управления пользователями</p>
      </div>
    );
  }

  const handleOpenCreateDialog = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      roleIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (user: BackendUser) => {
    setIsCreating(false);
    setEditingUser(user);
    
    // Get role IDs for this user
    const userRoleIds = roles
      .filter(role => user.roles.includes(role.name))
      .map(role => role.id);
    
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName || '',
      roleIds: userRoleIds,
    });
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (isCreating) {
        // Create new user
        if (!formData.username || !formData.email || !formData.password) {
          toast.error('Заполните все обязательные поля');
          return;
        }

        const request: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName || undefined,
          roleIds: formData.roleIds,
        };

        await userManagementService.createUser(request);
        toast.success('Пользователь создан');
      } else if (editingUser) {
        // Update existing user
        const request: UpdateUserRequest = {
          email: formData.email !== editingUser.email ? formData.email : undefined,
          fullName: formData.fullName !== (editingUser.fullName || '') ? formData.fullName : undefined,
          password: formData.password || undefined,
          roleIds: formData.roleIds,
        };

        await userManagementService.updateUser(editingUser.id, request);
        toast.success('Пользователь обновлен');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.message || 'Не удалось сохранить пользователя');
    }
  };

  const handleDeleteUser = async (user: BackendUser) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.username}?`)) {
      return;
    }

    try {
      await userManagementService.deleteUser(user.id);
      toast.success('Пользователь удален');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Не удалось удалить пользователя');
    }
  };

  const handleToggleStatus = async (user: BackendUser) => {
    try {
      await userManagementService.toggleUserStatus(user.id);
      toast.success(user.enabled ? 'Пользователь отключен' : 'Пользователь активирован');
      loadData();
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      toast.error(error.message || 'Не удалось изменить статус');
    }
  };

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    setFormData({
      ...formData,
      roleIds: checked
        ? [...formData.roleIds, roleId]
        : formData.roleIds.filter(id => id !== roleId)
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Управление пользователями</h1>
          <p className="text-gray-600">Настройка ролей и прав доступа</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600"
              onClick={handleOpenCreateDialog}
            >
              <UserPlus className="mr-2 size-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? 'Создание пользователя' : 'Редактирование пользователя'}
              </DialogTitle>
              <DialogDescription>
                {isCreating 
                  ? 'Заполните данные нового пользователя' 
                  : 'Измените данные пользователя'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя пользователя *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="rounded-xl"
                    disabled={!isCreating}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Полное имя</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="rounded-xl"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isCreating ? 'Пароль *' : 'Новый пароль (оставьте пустым)'}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="rounded-xl"
                    placeholder={isCreating ? 'Минимум 6 символов' : 'Оставьте пустым для сохранения текущего'}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Роли</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const info = ROLE_LABELS[role.name] || { label: role.name, description: '', color: '' };
                    return (
                      <div key={role.id} className="flex items-start gap-3 p-4 rounded-xl border hover:border-blue-300 transition-colors">
                        <Checkbox
                          checked={formData.roleIds.includes(role.id)}
                          onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{info.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{info.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSaveUser} className="w-full rounded-xl">
                {isCreating ? 'Создать пользователя' : 'Сохранить изменения'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const primaryRole = user.roles[0] || 'VIEWER';
          const roleInfo = ROLE_LABELS[primaryRole] || { label: primaryRole, description: '', color: '' };
          
          return (
            <Card key={user.id} className={`rounded-3xl shadow-lg ${!user.enabled ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                      <Shield className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription className="text-xs">{user.email}</CardDescription>
                      {user.fullName && (
                        <CardDescription className="text-xs mt-1">{user.fullName}</CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((roleName) => {
                      const info = ROLE_LABELS[roleName] || { label: roleName, color: 'bg-gray-100 text-gray-800' };
                      return (
                        <Badge key={roleName} className={`rounded-full ${info.color}`}>
                          {info.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </div>

                {!user.enabled && (
                  <div className="text-sm text-red-600 p-3 bg-red-50 rounded-xl">
                    ⚠️ Пользователь отключен
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => handleOpenEditDialog(user)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => handleToggleStatus(user)}
                    title={user.enabled ? 'Отключить' : 'Активировать'}
                  >
                    <Power className={`size-4 ${user.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
