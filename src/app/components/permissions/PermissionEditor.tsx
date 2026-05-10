import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Shield, Building, Layers, DoorOpen, Cpu, Lock, Video, Thermometer, Lightbulb, Wind, AlertCircle } from 'lucide-react';

interface Permission {
  id: number;
  subjectType: 'USER' | 'ROLE';
  userId?: number;
  username?: string;
  roleId?: number;
  roleName?: string;
  buildingId?: number;
  buildingName?: string;
  floorId?: number;
  floorName?: string;
  roomId?: number;
  roomName?: string;
  deviceId?: number;
  deviceName?: string;
  systemTypeId?: number;
  systemTypeCode?: string;
  systemTypeName?: string;
  action: 'READ' | 'WRITE' | 'CONTROL' | 'ADMIN';
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface SystemType {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Building {
  id: number;
  name: string;
  address: string;
}

interface Floor {
  id: number;
  buildingId: number;
  name: string;
  level: number;
}

interface Room {
  id: number;
  floorId: number;
  name: string;
  type: string;
}

interface Device {
  id: number;
  roomId: number;
  name: string;
  type: string;
}

const systemIcons: Record<string, React.ReactNode> = {
  'lock': <Lock className="w-4 h-4" />,
  'video': <Video className="w-4 h-4" />,
  'thermometer': <Thermometer className="w-4 h-4" />,
  'lightbulb': <Lightbulb className="w-4 h-4" />,
  'wind': <Wind className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  'READ': 'bg-blue-100 text-blue-800',
  'WRITE': 'bg-green-100 text-green-800',
  'CONTROL': 'bg-yellow-100 text-yellow-800',
  'ADMIN': 'bg-red-100 text-red-800',
};

const actionLabels: Record<string, string> = {
  'READ': 'Чтение',
  'WRITE': 'Запись',
  'CONTROL': 'Управление',
  'ADMIN': 'Администратор',
};

interface PermissionEditorProps {
  userId?: number;
  roleId?: number;
  onClose: () => void;
}

export function PermissionEditor({ userId, roleId, onClose }: PermissionEditorProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [systemTypes, setSystemTypes] = useState<SystemType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Форма добавления права
  const [newPermission, setNewPermission] = useState({
    subjectType: 'ROLE' as 'USER' | 'ROLE',
    userId: undefined as number | undefined,
    roleId: roleId || undefined as number | undefined,
    buildingId: undefined as number | undefined,
    floorId: undefined as number | undefined,
    roomId: undefined as number | undefined,
    deviceId: undefined as number | undefined,
    systemTypeId: undefined as number | undefined,
    action: 'READ' as 'READ' | 'WRITE' | 'CONTROL' | 'ADMIN',
    expiresAt: undefined as string | undefined,
  });

  useEffect(() => {
    loadData();
  }, [userId, roleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Загрузить права
      let permissionsUrl = '/api/permissions';
      if (userId) {
        permissionsUrl = `/api/permissions/user/${userId}`;
      } else if (roleId) {
        permissionsUrl = `/api/permissions/role/${roleId}`;
      }
      
      const [permRes, systemRes, usersRes, rolesRes, buildingsRes] = await Promise.all([
        fetch(permissionsUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/permissions/system-types', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/buildings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!permRes.ok || !systemRes.ok || !usersRes.ok || !rolesRes.ok || !buildingsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [permData, systemData, usersData, rolesData, buildingsData] = await Promise.all([
        permRes.json(),
        systemRes.json(),
        usersRes.json(),
        rolesRes.json(),
        buildingsRes.json(),
      ]);

      setPermissions(permData);
      setSystemTypes(systemData);
      setUsers(usersData);
      setRoles(rolesData);
      setBuildings(buildingsData);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: newPermission.subjectType === 'USER' ? newPermission.userId : null,
          roleId: newPermission.subjectType === 'ROLE' ? newPermission.roleId : null,
          buildingId: newPermission.buildingId || null,
          floorId: newPermission.floorId || null,
          roomId: newPermission.roomId || null,
          deviceId: newPermission.deviceId || null,
          systemTypeId: newPermission.systemTypeId || null,
          action: newPermission.action,
          expiresAt: newPermission.expiresAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create permission');
      }

      setShowAddForm(false);
      setNewPermission({
        subjectType: 'ROLE',
        userId: undefined,
        roleId: roleId || undefined,
        buildingId: undefined,
        floorId: undefined,
        roomId: undefined,
        deviceId: undefined,
        systemTypeId: undefined,
        action: 'READ',
        expiresAt: undefined,
      });
      loadData();
    } catch (err) {
      console.error('Error creating permission:', err);
      setError('Ошибка создания права доступа');
    }
  };

  const handleDeletePermission = async (id: number) => {
    if (!confirm('Удалить это право доступа?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/permissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete permission');
      }

      loadData();
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError('Ошибка удаления права доступа');
    }
  };

  const renderScope = (permission: Permission) => {
    const scopes = [];
    if (permission.buildingName) scopes.push(`🏢 ${permission.buildingName}`);
    if (permission.floorName) scopes.push(`📐 ${permission.floorName}`);
    if (permission.roomName) scopes.push(`🚪 ${permission.roomName}`);
    if (permission.deviceName) scopes.push(`🖥️ ${permission.deviceName}`);
    if (permission.systemTypeName) {
      const icon = systemIcons[permission.systemTypeCode || ''] || <Shield className="w-4 h-4" />;
      scopes.push(<span className="inline-flex items-center gap-1">{icon} {permission.systemTypeName}</span>);
    }
    
    return scopes.length > 0 ? scopes : <span className="text-gray-400">Все объекты</span>;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Редактор прав доступа</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Добавить право доступа
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddPermission} className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Новое право доступа</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Type */}
                {!userId && !roleId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип субъекта
                    </label>
                    <select
                      value={newPermission.subjectType}
                      onChange={(e) => setNewPermission({
                        ...newPermission,
                        subjectType: e.target.value as 'USER' | 'ROLE',
                        userId: undefined,
                        roleId: undefined,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ROLE">Роль</option>
                      <option value="USER">Пользователь</option>
                    </select>
                  </div>
                )}

                {/* User/Role Select */}
                {newPermission.subjectType === 'USER' && !userId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пользователь
                    </label>
                    <select
                      value={newPermission.userId || ''}
                      onChange={(e) => setNewPermission({
                        ...newPermission,
                        userId: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите пользователя</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.fullName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newPermission.subjectType === 'ROLE' && !roleId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Роль
                    </label>
                    <select
                      value={newPermission.roleId || ''}
                      onChange={(e) => setNewPermission({
                        ...newPermission,
                        roleId: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите роль</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Действие
                  </label>
                  <select
                    value={newPermission.action}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      action: e.target.value as any,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="READ">Чтение</option>
                    <option value="WRITE">Запись</option>
                    <option value="CONTROL">Управление</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>

                {/* System Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Система (опционально)
                  </label>
                  <select
                    value={newPermission.systemTypeId || ''}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      systemTypeId: e.target.value ? parseInt(e.target.value) : undefined,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все системы</option>
                    {systemTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Building */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Здание (опционально)
                  </label>
                  <select
                    value={newPermission.buildingId || ''}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      buildingId: e.target.value ? parseInt(e.target.value) : undefined,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все здания</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expires At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок действия (опционально)
                  </label>
                  <input
                    type="datetime-local"
                    value={newPermission.expiresAt || ''}
                    onChange={(e) => setNewPermission({
                      ...newPermission,
                      expiresAt: e.target.value || undefined,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          {/* Permissions List */}
          <div className="space-y-3">
            {permissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Нет прав доступа</p>
              </div>
            ) : (
              permissions.map(permission => (
                <div
                  key={permission.id}
                  className={`p-4 border rounded-lg ${
                    permission.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {permission.subjectType === 'USER' ? (
                            <>👤 {permission.username}</>
                          ) : (
                            <>👥 Роль: {permission.roleName}</>
                          )}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[permission.action]}`}>
                          {actionLabels[permission.action]}
                        </span>
                        {!permission.isActive && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                            Истек срок
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex flex-wrap gap-2">
                        {renderScope(permission)}
                      </div>

                      {permission.expiresAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Истекает: {new Date(permission.expiresAt).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeletePermission(permission.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-4"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
