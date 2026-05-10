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
  Loader2,
  Lock
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { PermissionEditor } from '../components/permissions/PermissionEditor';

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
  const [permissionEditorUserId, setPermissionEditorUserId] = useState<number | null>(null);
  
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
    const userRoleIds = user.roles.map(r => r.id);
    
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Empty for editing
      fullName: user.fullName || '',
      roleIds: userRoleIds,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (isCreating) {
        // Create new user
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
          password: formData.password ? formData.password : undefined,
          fullName: formData.fullName !== editingUser.fullName ? formData.fullName : undefined,
          roleIds: formData.roleIds,
        };

        await userManagementService.updateUser(editingUser.id, request);
        toast.success('Пользователь обновлен');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.message || 'Ошибка сохранения пользователя');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await userManagementService.deleteUser(id);
      toast.success('Пользователь удален');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Ошибка удаления пользователя');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await userManagementService.toggleUserStatus(id);
      toast.success('Статус пользователя изменен');
      loadData();
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      toast.error(error.message || 'Ошибка изменения статуса');
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Управление пользователями
          </h1>
          <p className="text-gray-600 mt-2">Создание и редактирование пользователей и их ролей</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog} className="gap-2">
              <UserPlus className="w-5 h-5" />
              Новый пользователь
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {isCreating ? 'Создание пользователя' : 'Редактирование пользователя'}
              </DialogTitle>
              <DialogDescription>
                {isCreating ? 'Заполните информацию о новом пользователе' : 'Обновите информацию о пользователе'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isCreating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Пароль {isCreating ? '*' : '(оставьте пустым для неизменения)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Роли *</Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          <Badge className={ROLE_LABELS[role.name]?.color || 'bg-gray-100 text-gray-800'}>
                            {ROLE_LABELS[role.name]?.label || role.name}
                          </Badge>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {ROLE_LABELS[role.name]?.description || role.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.roleIds.length === 0 && (
                  <p className="text-sm text-red-600">Выберите хотя бы одну роль</p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.username || !formData.email || formData.roleIds.length === 0 || (isCreating && !formData.password)}
                >
                  {isCreating ? 'Создать' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{user.username}</h3>
                      {user.enabled ? (
                        <Badge className="bg-green-100 text-green-800">Активен</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Отключен</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {user.email} {user.fullName && `• ${user.fullName}`}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {user.roles.map(role => (
                        <Badge key={role.id} className={ROLE_LABELS[role.name]?.color || 'bg-gray-100 text-gray-800'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {ROLE_LABELS[role.name]?.label || role.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPermissionEditorUserId(user.id)}
                      className="gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Права доступа
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id)}
                      className="gap-2"
                    >
                      <Power className={`w-4 h-4 ${user.enabled ? 'text-red-600' : 'text-green-600'}`} />
                      {user.enabled ? 'Отключить' : 'Включить'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      Изменить
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {users.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Нет пользователей</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Permission Editor Modal */}
      {permissionEditorUserId && (
        <PermissionEditor
          userId={permissionEditorUserId}
          onClose={() => setPermissionEditorUserId(null)}
        />
      )}
    </div>
  );
}
