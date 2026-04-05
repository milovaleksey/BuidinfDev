import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from '../components/ui/link';
import { Floor, DeviceType, Device } from '../types';
import { buildingService } from '../services/BuildingService';
import { mqttService } from '../services/MockMQTTService';
import { authService } from '../services/AuthService';
import { DEVICE_TYPES } from '../constants/devices';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { FloorPlan } from '../components/FloorPlan';
import { DeviceList } from '../components/DeviceList';
import { DeviceTypeToggleIcons } from '../components/DeviceTypeToggleIcons';
import { ArrowLeft, Edit, ZoomIn, ZoomOut, Maximize2, Eye, Activity, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

export function FloorView() {
  const { id } = useParams<{ id: string }>();
  const [floor, setFloor] = useState<Floor | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [visibleDeviceTypes, setVisibleDeviceTypes] = useState<Set<DeviceType>>(
    new Set(DEVICE_TYPES.map(dt => dt.type))
  );
  const canEdit = authService.canEditFloors();

  useEffect(() => {
    if (id) {
      const loadedFloor = buildingService.getFloor(id);
      setFloor(loadedFloor);
    }
  }, [id]);

  useEffect(() => {
    mqttService.connect();
    return () => mqttService.disconnect();
  }, []);

  // Load visible device types from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('visibleDeviceTypesFloorView');
    if (saved) {
      try {
        const types = JSON.parse(saved);
        setVisibleDeviceTypes(new Set(types));
      } catch (e) {
        console.error('Failed to load visible device types', e);
      }
    }
  }, []);

  // Save visible device types to localStorage
  useEffect(() => {
    localStorage.setItem('visibleDeviceTypesFloorView', JSON.stringify([...visibleDeviceTypes]));
  }, [visibleDeviceTypes]);

  if (!floor) {
    return (
      <div className="p-8">
        <p>Этаж не найден</p>
      </div>
    );
  }

  const toggleDeviceTypeVisibility = (deviceType: DeviceType) => {
    setVisibleDeviceTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceType)) {
        newSet.delete(deviceType);
      } else {
        newSet.add(deviceType);
      }
      return newSet;
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const getDeviceIcon = (type: Device['type']) => {
    const deviceType = DEVICE_TYPES.find(dt => dt.type === type);
    return deviceType?.icon || Activity;
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return CheckCircle;
      case 'offline':
      case 'warning':
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const selectedRoomData = selectedRoom ? floor.rooms.find(r => r.id === selectedRoom) : null;

  // Calculate statistics
  const totalDevices = floor.rooms.reduce((sum, room) => sum + room.devices.length, 0);
  const onlineDevices = floor.rooms.reduce((sum, room) => 
    sum + room.devices.filter(d => d.status === 'online').length, 0
  );
  const offlineDevices = floor.rooms.reduce((sum, room) => 
    sum + room.devices.filter(d => d.status === 'offline').length, 0
  );
  const visibleDeviceCount = floor.rooms.reduce((sum, room) => 
    sum + room.devices.filter(d => visibleDeviceTypes.has(d.type)).length, 0
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/locations">
            <Button variant="ghost" className="rounded-2xl">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">{floor.name}</h1>
            <p className="text-gray-600">План этажа с устройствами</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link to={`/floor/${id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Редактор
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Помещений</p>
                <p className="text-2xl font-bold">{floor.rooms.length}</p>
              </div>
              <Maximize2 className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего устройтв</p>
                <p className="text-2xl font-bold">{totalDevices}</p>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">В сети</p>
                <p className="text-2xl font-bold text-green-600">{onlineDevices}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Не в сети</p>
                <p className="text-2xl font-bold text-red-600">{offlineDevices}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Plan */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle>План этажа</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Eye className="w-3 h-3 mr-1" />
                      {visibleDeviceCount} / {totalDevices} устройств
                    </Badge>
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Уменьшить</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm px-2 font-mono">{Math.round(scale * 100)}%</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Увеличить</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 w-7 p-0">
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Сбросить масштаб</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                {/* Device Type Toggle Icons */}
                <div className="border-t pt-3">
                  <DeviceTypeToggleIcons
                    visibleDeviceTypes={visibleDeviceTypes}
                    onToggleDeviceType={toggleDeviceTypeVisibility}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FloorPlan
                rooms={floor.rooms}
                selectedRoomId={selectedRoom}
                onRoomClick={setSelectedRoom}
                scale={scale}
                visibleDeviceTypes={visibleDeviceTypes}
                showDevices={true}
                backgroundImage={floor.backgroundImage}
                backgroundOpacity={floor.backgroundOpacity}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Room Info */}
          {selectedRoomData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Пмщение</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{selectedRoomData.name}</p>
                  <p className="text-sm text-gray-600">#{selectedRoomData.number}</p>
                  {selectedRoomData.type && (
                    <Badge variant="secondary" className="mt-2">
                      {selectedRoomData.type}
                    </Badge>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">
                    Устройства ({selectedRoomData.devices.length})
                  </p>
                  <div className="max-h-96 overflow-y-auto">
                    <DeviceList
                      devices={selectedRoomData.devices}
                      visibleDeviceTypes={visibleDeviceTypes}
                      grouped={true}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedRoom(null)}
                >
                  Закрыть
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}