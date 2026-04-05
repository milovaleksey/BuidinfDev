import { useState } from 'react';
import { authService } from '../services/AuthService';
import { buildingService } from '../services/BuildingService';
import { UserRole, SystemType } from '../types';
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
  Key,
  DoorOpen,
  Video,
  Thermometer,
  Lightbulb,
  Wind
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

interface MockUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: {
    rooms: string[];
    systems: SystemType[];
  };
}

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Администратор', description: 'Полный доступ ко всем функциям' },
  { value: 'manager', label: 'Менеджер', description: 'Управление системами и этажами' },
  { value: 'operator', label: 'Оператор', description: 'Базовое управление устройствами' },
  { value: 'viewer', label: 'Наблюдатель', description: 'Только просмотр' },
];

const SYSTEMS: { type: SystemType; label: string; icon: any }[] = [
  { type: 'access_control', label: 'СКУД', icon: DoorOpen },
  { type: 'video', label: 'Видео', icon: Video },
  { type: 'heating', label: 'Отопление', icon: Thermometer },
  { type: 'lighting', label: 'Освещение', icon: Lightbulb },
  { type: 'hvac', label: 'Вентиляция', icon: Wind },
];

export function UserManagement() {
  const building = buildingService.getBuilding();
  const [users, setUsers] = useState<MockUser[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@building.com',
      role: 'admin',
      permissions: { rooms: [], systems: ['access_control', 'video', 'heating', 'lighting', 'hvac', 'sensors'] }
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@building.com',
      role: 'manager',
      permissions: { rooms: ['101', '102', '103'], systems: ['access_control', 'heating', 'lighting'] }
    },
    {
      id: '3',
      username: 'operator',
      email: 'operator@building.com',
      role: 'operator',
      permissions: { rooms: ['101'], systems: ['lighting'] }
    },
  ]);

  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!authService.canManageUsers()) {
    return (
      <div className="p-8">
        <p className="text-red-600">У вас нет прав для управления пользователями</p>
      </div>
    );
  }

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      toast.success('Пользователь обновлен');
    }
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleRoomToggle = (roomId: string, checked: boolean) => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        rooms: checked
          ? [...editingUser.permissions.rooms, roomId]
          : editingUser.permissions.rooms.filter(r => r !== roomId)
      }
    });
  };

  const handleSystemToggle = (systemType: SystemType, checked: boolean) => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        systems: checked
          ? [...editingUser.permissions.systems, systemType]
          : editingUser.permissions.systems.filter(s => s !== systemType)
      }
    });
  };

  const allRooms = building.floors.flatMap(floor => floor.rooms);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Управление пользователями</h1>
          <p className="text-gray-600">Настройка ролей и прав доступа</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
              <UserPlus className="mr-2 size-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>Настройка пользователя</DialogTitle>
              <DialogDescription>
                Настройте роль и права доступа для пользователя
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Имя пользователя</Label>
                    <Input
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Роль</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserRole })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingUser.role !== 'admin' && (
                  <>
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Key className="size-4" />
                        Доступ к системам
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {SYSTEMS.map((system) => {
                          const Icon = system.icon;
                          return (
                            <div key={system.type} className="flex items-center gap-2 p-3 rounded-xl border">
                              <Checkbox
                                checked={editingUser.permissions.systems.includes(system.type)}
                                onCheckedChange={(checked) => handleSystemToggle(system.type, checked as boolean)}
                              />
                              <Icon className="size-4 text-gray-600" />
                              <span className="text-sm">{system.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <DoorOpen className="size-4" />
                        Доступ к помещениям
                      </Label>
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-xl">
                        {allRooms.map((room) => (
                          <div key={room.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                            <Checkbox
                              checked={editingUser.permissions.rooms.includes(room.id)}
                              onCheckedChange={(checked) => handleRoomToggle(room.id, checked as boolean)}
                            />
                            <div className="text-xs">
                              <div className="font-medium">{room.number}</div>
                              <div className="text-gray-500 text-[10px]">{room.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={handleSaveUser} className="w-full rounded-xl">
                  Сохранить изменения
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const roleInfo = ROLES.find(r => r.value === user.role);
          
          return (
            <Card key={user.id} className="rounded-3xl shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                      <Shield className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription className="text-xs">{user.email}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge className="rounded-full">{roleInfo?.label}</Badge>
                </div>

                {user.role !== 'admin' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Системы ({user.permissions.systems.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.systems.map((systemType) => {
                          const system = SYSTEMS.find(s => s.type === systemType);
                          const Icon = system?.icon;
                          return (
                            <Badge key={systemType} variant="outline" className="rounded-full text-xs">
                              {Icon && <Icon className="size-3 mr-1" />}
                              {system?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Помещения ({user.permissions.rooms.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.rooms.slice(0, 5).map((roomId) => (
                          <Badge key={roomId} variant="secondary" className="rounded-full text-xs">
                            {roomId}
                          </Badge>
                        ))}
                        {user.permissions.rooms.length > 5 && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            +{user.permissions.rooms.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'admin' && (
                  <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-xl">
                    Полный доступ ко всем помещениям и системам
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => {
                    setEditingUser(user);
                    setIsDialogOpen(true);
                  }}
                >
                  Редактировать права
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
