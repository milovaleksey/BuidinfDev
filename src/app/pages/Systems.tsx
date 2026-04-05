import { useState, useEffect } from 'react';
import { buildingService } from '../services/BuildingService';
import { authService } from '../services/AuthService';
import { mqttService } from '../services/MockMQTTService';
import { SystemType, Device } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Video, 
  Thermometer, 
  Lightbulb, 
  Wind, 
  DoorOpen,
  Lock,
  Unlock,
  Power,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

export function Systems() {
  const building = buildingService.getBuilding();
  const [activeSystem, setActiveSystem] = useState<SystemType>('access_control');
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    mqttService.connect().then(() => {
      setMqttConnected(true);
    });

    return () => mqttService.disconnect();
  }, []);

  const getAllDevicesBySystem = (systemType: SystemType): Device[] => {
    const devices: Device[] = [];
    building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (authService.hasRoomAccess(room.id)) {
          room.devices
            .filter(device => device.systemType === systemType)
            .forEach(device => devices.push(device));
        }
      });
    });
    return devices;
  };

  const getSystemStats = (systemType: SystemType): SystemStats => {
    const devices = getAllDevicesBySystem(systemType);
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      warning: devices.filter(d => d.status === 'warning').length,
    };
  };

  const handleDeviceControl = (deviceId: string, action: string) => {
    if (!authService.hasSystemAccess(activeSystem)) {
      toast.error('У вас нет прав для управления этой системой');
      return;
    }

    // Отправка MQTT команды
    mqttService.publish(`building/device/${deviceId}/command`, { action });
    toast.success('Команда отправлена');
  };

  const systems = [
    {
      type: 'access_control' as SystemType,
      label: 'СКУД',
      icon: DoorOpen,
      color: 'from-blue-500 to-blue-600',
      description: 'Система контроля доступа'
    },
    {
      type: 'video' as SystemType,
      label: 'Видеонаблюдение',
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      description: 'Система видеонаблюдения'
    },
    {
      type: 'heating' as SystemType,
      label: 'Отопление',
      icon: Thermometer,
      color: 'from-orange-500 to-red-600',
      description: 'Система отопления'
    },
    {
      type: 'lighting' as SystemType,
      label: 'Освещение',
      icon: Lightbulb,
      color: 'from-yellow-500 to-amber-600',
      description: 'Система освещения'
    },
    {
      type: 'hvac' as SystemType,
      label: 'Вентиляция',
      icon: Wind,
      color: 'from-cyan-500 to-blue-600',
      description: 'Система вентиляции и кондиционирования'
    },
    {
      type: 'sensors' as SystemType,
      label: 'Датчики',
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      description: 'Система мониторинга и датчиков'
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Системы здания</h1>
        <div className="flex items-center gap-2">
          <p className="text-gray-600">Управление инженерными системами</p>
          <Badge variant={mqttConnected ? 'default' : 'secondary'} className="rounded-full">
            MQTT: {mqttConnected ? 'Подключено' : 'Отключено'}
          </Badge>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {systems.map((system) => {
          const stats = getSystemStats(system.type);
          const Icon = system.icon;
          const hasAccess = authService.hasSystemAccess(system.type);

          return (
            <Card
              key={system.type}
              className={`rounded-3xl shadow-lg cursor-pointer transition-all ${
                activeSystem === system.type ? 'ring-4 ring-blue-500 ring-offset-2' : ''
              }`}
              onClick={() => setActiveSystem(system.type)}
            >
              <CardHeader className="pb-3">
                <div className={`p-3 bg-gradient-to-br ${system.color} rounded-2xl w-fit mb-2`}>
                  <Icon className="size-6 text-white" />
                </div>
                <CardTitle className="text-base">{system.label}</CardTitle>
                <CardDescription className="text-xs">{stats.online}/{stats.total} активно</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasAccess && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    Только чтение
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active System Details */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(() => {
                const system = systems.find(s => s.type === activeSystem);
                const Icon = system?.icon || DoorOpen;
                return (
                  <>
                    <div className={`p-3 bg-gradient-to-br ${system?.color} rounded-2xl`}>
                      <Icon className="size-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{system?.label}</CardTitle>
                      <CardDescription>{system?.description}</CardDescription>
                    </div>
                  </>
                );
              })()}
            </div>
            <Badge variant="outline" className="text-sm rounded-full">
              {getAllDevicesBySystem(activeSystem).length} устройств
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAllDevicesBySystem(activeSystem).map((device) => {
              const room = buildingService.getRoom(device.roomId);
              const hasAccess = authService.hasSystemAccess(activeSystem);

              return (
                <Card key={device.id} className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{device.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {room?.name} ({device.roomId})
                        </CardDescription>
                      </div>
                      {device.status === 'online' ? (
                        <CheckCircle className="size-5 text-green-500" />
                      ) : (
                        <AlertCircle className="size-5 text-red-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Device Data */}
                    <div className="text-sm space-y-1">
                      {device.data.temperature !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Температура:</span>
                          <span className="font-medium">{device.data.temperature.toFixed(1)}°C</span>
                        </div>
                      )}
                      {device.data.co2 !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">CO2:</span>
                          <span className="font-medium">{device.data.co2} ppm</span>
                        </div>
                      )}
                      {device.data.humidity !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Влажность:</span>
                          <span className="font-medium">{device.data.humidity.toFixed(0)}%</span>
                        </div>
                      )}
                      {device.data.lightLevel !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Яркость:</span>
                          <span className="font-medium">{device.data.lightLevel.toFixed(0)}%</span>
                        </div>
                      )}
                      {device.data.locked !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Статус:</span>
                          <Badge variant={device.data.locked ? 'default' : 'secondary'} className="rounded-full text-xs">
                            {device.data.locked ? (
                              <>
                                <Lock className="size-3 mr-1" />
                                Закрыт
                              </>
                            ) : (
                              <>
                                <Unlock className="size-3 mr-1" />
                                Открыт
                              </>
                            )}
                          </Badge>
                        </div>
                      )}
                      {device.data.recording !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Запись:</span>
                          <Badge variant={device.data.recording ? 'default' : 'secondary'} className="rounded-full text-xs">
                            {device.data.recording ? 'Активна' : 'Остановлена'}
                          </Badge>
                        </div>
                      )}
                      {device.data.motion !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Движение:</span>
                          <Badge variant={device.data.motion ? 'destructive' : 'secondary'} className="rounded-full text-xs">
                            {device.data.motion ? 'Обнаружено' : 'Нет'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    {hasAccess && device.status === 'online' && (
                      <div className="pt-3 border-t flex gap-2">
                        {/* СКУД устройства */}
                        {(device.type === 'door' || device.type === 'gate' || device.type === 'turnstile' || 
                          device.type === 'tripod_turnstile' || device.type === 'barrier') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeviceControl(device.id, device.data.isOpen ? 'close' : 'open')}
                            className="rounded-xl flex-1"
                          >
                            {device.data.isOpen ? (
                              <>
                                <Lock className="size-3 mr-1" />
                                Закрыть
                              </>
                            ) : (
                              <>
                                <Unlock className="size-3 mr-1" />
                                Открыть
                              </>
                            )}
                          </Button>
                        )}
                        {/* Освещение и HVAC */}
                        {(device.type === 'light_fixture' || device.type === 'street_light' || 
                          device.type === 'wall_ac' || device.type === 'cassette_ac') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeviceControl(device.id, 'toggle')}
                            className="rounded-xl flex-1"
                          >
                            <Power className="size-3 mr-1" />
                            Вкл/Выкл
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {getAllDevicesBySystem(activeSystem).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="size-12 mx-auto mb-4 text-gray-400" />
              <p>Нет доступных устройств в этой системе</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}