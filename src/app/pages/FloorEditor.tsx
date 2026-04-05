import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { Link } from '../components/ui/link';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { buildingService } from '../services/BuildingService';
import { authService } from '../services/AuthService';
import { Floor, Room, Device, DeviceType, SystemType } from '../types';
import { DEVICE_TYPES, DEVICE_GROUPS } from '../constants/devices';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DeviceVisual } from '../components/DeviceVisual';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { DeviceTypeToggleIcons } from '../components/DeviceTypeToggleIcons';
import { 
  ArrowLeft, 
  Plus,
  Save,
  Thermometer,
  Video,
  Lock,
  Unlock,
  Lightbulb,
  Wind,
  Activity,
  Trash2,
  Move,
  Maximize2,
  RotateCw,
  Home,
  PenTool,
  MousePointer,
  DoorOpen,
  Droplet,
  Image,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  X,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Eye,
  EyeOff,
  Type,
  Download,
  Upload,
  FileJson,
  Hexagon,
  Minimize2
} from 'lucide-react';

const ROOM_TYPES = [
  { value: 'room', label: 'Комната', defaultSize: { width: 150, height: 120 } },
  { value: 'corridor', label: 'Коридор', defaultSize: { width: 300, height: 80 } },
  { value: 'office', label: 'Офис', defaultSize: { width: 180, height: 140 } },
  { value: 'meeting', label: 'Переговорная', defaultSize: { width: 200, height: 150 } },
  { value: 'storage', label: 'Склад', defaultSize: { width: 160, height: 160 } },
  { value: 'bathroom', label: 'Санузел', defaultSize: { width: 100, height: 100 } },
];

type EditorMode = 'select' | 'draw' | 'polygon';

interface RoomEditorProps {
  room: Room;
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => void;
  onAddDevice: (roomId: string, deviceType: DeviceType) => void;
  onRemoveDevice: (deviceId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onUpdateDevice: (deviceId: string, updates: Partial<Device>) => void;
  onUpdateMultipleDevices: (deviceIds: string[], updates: Partial<Device>) => void;
  selectedDeviceIds?: string[];
  onOpenAutoPlace?: () => void;
  defaultDeviceScale?: number;
  onDefaultScaleChange?: (scale: number) => void;
  visibleDeviceTypes?: Set<DeviceType>;
}

function RoomEditor({ room, onUpdateRoom, onAddDevice, onRemoveDevice, onDeleteRoom, onUpdateDevice, onUpdateMultipleDevices, selectedDeviceIds = [], onOpenAutoPlace, defaultDeviceScale = 1, onDefaultScaleChange, visibleDeviceTypes }: RoomEditorProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('radiator');

  const selectedDeviceObjs = room.devices.filter(d => selectedDeviceIds.includes(d.id));

  const generateMqttTopic = () => {
    const floorNum = room.floorId.replace('floor_', '');
    return `building/floor${floorNum}/room${room.id}`;
  };

  return (
    <Card className="rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle>Помещение {room.number}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input
            value={room.name}
            onChange={(e) => onUpdateRoom(room.id, { name: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>MQTT топик помещения</Label>
          <div className="flex gap-2">
            <Input
              value={room.mqttTopic || ''}
              onChange={(e) => onUpdateRoom(room.id, { mqttTopic: e.target.value })}
              placeholder="building/floor1/room101"
              className="rounded-xl"
            />
            <Button
              variant="outline"
              onClick={() => onUpdateRoom(room.id, { mqttTopic: generateMqttTopic() })}
              className="rounded-xl"
            >
              Авто
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Ширина (px)</Label>
            <Input
              type="number"
              value={room.dimensions.width}
              onChange={(e) => onUpdateRoom(room.id, { 
                dimensions: { ...room.dimensions, width: parseFloat(e.target.value) }
              })}
              className="rounded-xl"
              min="50"
              max="500"
            />
          </div>
          <div className="space-y-2">
            <Label>Высота (px)</Label>
            <Input
              type="number"
              value={room.dimensions.height}
              onChange={(e) => onUpdateRoom(room.id, { 
                dimensions: { ...room.dimensions, height: parseFloat(e.target.value) }
              })}
              className="rounded-xl"
              min="50"
              max="500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Добавить устройство</Label>
          <div className="flex gap-2">
            <Select value={selectedDevice} onValueChange={(val) => setSelectedDevice(val as DeviceType)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map((dt) => (
                  <SelectItem key={dt.type} value={dt.type}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => onAddDevice(room.id, selectedDevice)}
              className="rounded-xl"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {selectedDevice === 'door' && (
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              💡 Двери можно размещать на границе помещения
            </p>
          )}
          {onOpenAutoPlace && (
            <Button
              onClick={onOpenAutoPlace}
              variant="outline"
              className="rounded-xl w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Lightbulb className="size-4 mr-2" />
              Авто-расстановка светильников
            </Button>
          )}
        </div>

        {onDefaultScaleChange && (
          <div className="space-y-2">
            <Label>Масштаб устройств по умолчанию</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <Lightbulb 
                  className="text-yellow-600" 
                  style={{ 
                    width: `${16 * defaultDeviceScale}px`, 
                    height: `${16 * defaultDeviceScale}px`,
                    transition: 'all 0.2s'
                  }} 
                />
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={defaultDeviceScale}
                onChange={(e) => onDefaultScaleChange(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{defaultDeviceScale.toFixed(1)}x</span>
            </div>
            <p className="text-xs text-gray-500">
              Новые устройства будут добавляться с этим масштабом
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Устройства ({room.devices.length})
            {visibleDeviceTypes && room.devices.filter(d => !visibleDeviceTypes.has(d.type)).length > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                ({room.devices.filter(d => visibleDeviceTypes.has(d.type)).length} видимых)
              </span>
            )}
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {room.devices.map((device) => {
              const deviceType = DEVICE_TYPES.find(d => d.type === device.type);
              const Icon = deviceType?.icon || Activity;
              const isHidden = visibleDeviceTypes && !visibleDeviceTypes.has(device.type);
              
              return (
                <div
                  key={device.id}
                  className={`flex items-start justify-between p-3 rounded-xl transition-all ${
                    isHidden ? 'bg-gray-100 opacity-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isHidden && <EyeOff className="size-3 text-gray-400" />}
                      <Icon className={`size-4 ${isHidden ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${isHidden ? 'text-gray-400' : ''}`}>{device.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{device.mqttTopic}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveDevice(device.id)}
                    className="rounded-xl hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Rotation and Scale Controls - appears when devices are selected */}
        {selectedDeviceObjs.length > 0 && (() => {
          // Calculate average rotation and scale
          const avgRotation = selectedDeviceObjs.reduce((sum, d) => sum + (d.rotation || 0), 0) / selectedDeviceObjs.length;
          const avgScale = selectedDeviceObjs.reduce((sum, d) => sum + (d.scale || 1), 0) / selectedDeviceObjs.length;
          const deviceCount = selectedDeviceObjs.length;
          
          return (
            <div className="space-y-3">
              {/* Selection Info */}
              <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-violet-600" />
                  <span className="text-sm font-medium text-violet-900">
                    Выбрано устройств: {deviceCount}
                  </span>
                </div>
                {deviceCount === 1 && (
                  <p className="text-xs text-violet-700 mt-1">{selectedDeviceObjs[0].name}</p>
                )}
              </div>

              {/* Rotation Control */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl space-y-3 border-2 border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCw className="size-5 text-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-indigo-900">Поворот {deviceCount > 1 ? 'устройств' : 'устройства'}</span>
                      <p className="text-xs text-indigo-700">
                        {deviceCount > 1 ? `Средний угол` : selectedDeviceObjs[0].name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-indigo-700">
                    Угол: {Math.round(avgRotation)}°
                  </Label>
                  <Slider
                    min={0}
                    max={360}
                    step={15}
                    value={[avgRotation]}
                    onValueChange={(vals) => onUpdateMultipleDevices(selectedDeviceIds, { rotation: vals[0] })}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { rotation: 0 })}
                      className="rounded-xl flex-1"
                    >
                      0°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { rotation: 90 })}
                      className="rounded-xl flex-1"
                    >
                      90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { rotation: 180 })}
                      className="rounded-xl flex-1"
                    >
                      180°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { rotation: 270 })}
                      className="rounded-xl flex-1"
                    >
                      270°
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scale Control */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl space-y-3 border-2 border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="size-5 text-emerald-600" />
                    <div>
                      <span className="text-sm font-medium text-emerald-900">Масштаб {deviceCount > 1 ? 'устройств' : 'устройства'}</span>
                      <p className="text-xs text-emerald-700">
                        {deviceCount > 1 ? `Средний размер` : selectedDeviceObjs[0].name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">
                    Размер: {(avgScale * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={[avgScale]}
                    onValueChange={(vals) => onUpdateMultipleDevices(selectedDeviceIds, { scale: vals[0] })}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { scale: 0.5 })}
                      className="rounded-xl flex-1"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { scale: 1 })}
                      className="rounded-xl flex-1"
                    >
                      100%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { scale: 1.5 })}
                      className="rounded-xl flex-1"
                    >
                      150%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMultipleDevices(selectedDeviceIds, { scale: 2 })}
                      className="rounded-xl flex-1"
                    >
                      200%
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Lock/Unlock Room Section */}
        <div className="space-y-2">
          {room.locked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800">
                🔒 Помещение заблокировано от перемещения и изменения размера
              </p>
            </div>
          )}
          <Button
            variant={room.locked ? 'default' : 'outline'}
            className="w-full rounded-xl"
            onClick={() => onUpdateRoom(room.id, { locked: !room.locked })}
          >
            {room.locked ? (
              <>
                <Lock className="mr-2 size-4" />
                Разблокировать помещение
              </>
            ) : (
              <>
                <Unlock className="mr-2 size-4" />
                Заблокировать помещение
              </>
            )}
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full rounded-xl"
          onClick={() => onDeleteRoom(room.id)}
        >
          <Trash2 className="mr-2 size-4" />
          Удалить помещение
        </Button>
      </CardContent>
    </Card>
  );
}

export function FloorEditor() {
  const { id } = useParams<{ id: string }>();
  const [floor, setFloor] = useState<Floor | undefined>();
  const [updateKey, setUpdateKey] = useState(0); // Force re-render key
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [draggingRoom, setDraggingRoom] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [newRoomType, setNewRoomType] = useState('room');
  const [newRoomName, setNewRoomName] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]); // Multiple device selection
  const [draggingDevice, setDraggingDevice] = useState<string | null>(null);
  const [resizingCorner, setResizingCorner] = useState<{ roomId: string; corner: 'nw' | 'ne' | 'sw' | 'se' } | null>(null);
  const [draggingVertex, setDraggingVertex] = useState<{ roomId: string; index: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number; roomId?: string }[]>([]);
  const [virtualGuides, setVirtualGuides] = useState<{ id: string; type: 'horizontal' | 'vertical'; position: number; roomId: string }[]>([]);
  const [guideMode, setGuideMode] = useState<'horizontal' | 'vertical' | null>(null);
  const [isAutoPlaceDialogOpen, setIsAutoPlaceDialogOpen] = useState(false);
  const [autoPlaceConfig, setAutoPlaceConfig] = useState({ countX: 3, countY: 3, marginX: 50, marginY: 50 });
  const [defaultDeviceScale, setDefaultDeviceScale] = useState(1);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [roomFontSize, setRoomFontSize] = useState(14);
  const [visibleDeviceTypes, setVisibleDeviceTypes] = useState<Set<DeviceType>>(new Set(DEVICE_TYPES.map(dt => dt.type)));

  useEffect(() => {
    if (id) {
      const loadedFloor = buildingService.getFloor(id);
      setFloor(loadedFloor);
      
      // Load virtual guides from localStorage
      const savedGuides = localStorage.getItem(`virtualGuides-${id}`);
      if (savedGuides) {
        try {
          setVirtualGuides(JSON.parse(savedGuides));
        } catch (error) {
          console.error('Error loading virtual guides:', error);
        }
      }

      // Load default device scale from localStorage
      const savedScale = localStorage.getItem('defaultDeviceScale');
      if (savedScale) {
        try {
          setDefaultDeviceScale(parseFloat(savedScale));
        } catch (error) {
          console.error('Error loading default scale:', error);
        }
      }

      // Load visible device types from localStorage
      const savedVisibleTypes = localStorage.getItem('visibleDeviceTypes');
      if (savedVisibleTypes) {
        try {
          setVisibleDeviceTypes(new Set(JSON.parse(savedVisibleTypes)));
        } catch (error) {
          console.error('Error loading visible device types:', error);
        }
      }
    }
  }, [id]);

  // Save virtual guides to localStorage when they change
  useEffect(() => {
    if (id && virtualGuides.length >= 0) {
      localStorage.setItem(`virtualGuides-${id}`, JSON.stringify(virtualGuides));
    }
  }, [id, virtualGuides]);

  // Save default device scale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('defaultDeviceScale', defaultDeviceScale.toString());
  }, [defaultDeviceScale]);

  // Save visible device types to localStorage when they change
  useEffect(() => {
    localStorage.setItem('visibleDeviceTypes', JSON.stringify([...visibleDeviceTypes]));
  }, [visibleDeviceTypes]);

  // Helper function to toggle device type visibility
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

  // Helper function to show all device types
  const showAllDeviceTypes = () => {
    setVisibleDeviceTypes(new Set(DEVICE_TYPES.map(dt => dt.type)));
  };

  // Helper function to hide all device types
  const hideAllDeviceTypes = () => {
    setVisibleDeviceTypes(new Set());
  };

  if (!authService.canEditFloors()) {
    return (
      <div className="p-8">
        <p className="text-red-600">У вас нет прав для редактирования планов этажей</p>
      </div>
    );
  }

  if (!floor) {
    return (
      <div className="p-8">
        <p>Этаж не найден</p>
      </div>
    );
  }

  const generateDeviceMqttTopic = (room: Room, deviceType: DeviceType, deviceId: string): string => {
    if (!floor) return `building/room${room.id}/${deviceType}/${deviceId}`;
    const roomTopic = room.mqttTopic || `building/floor${floor.number}/room${room.id}`;
    return `${roomTopic}/${deviceType}/${deviceId}`;
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<Room>) => {
    buildingService.updateRoom(roomId, updates);
    if (id) {
      const updatedFloor = buildingService.getFloor(id);
      setFloor(updatedFloor);
    }
    // Auto-save to localStorage
    buildingService.saveToLocalStorage();
  };

  const handleUpdateDevice = (deviceId: string, updates: Partial<Device>) => {
    if (!floor) return;
    
    // Find device and update it
    for (const room of floor.rooms) {
      const deviceIndex = room.devices.findIndex(d => d.id === deviceId);
      if (deviceIndex !== -1) {
        room.devices[deviceIndex] = { ...room.devices[deviceIndex], ...updates };
        setFloor({ ...floor });
        // Auto-save to localStorage
        buildingService.saveToLocalStorage();
        return;
      }
    }
  };

  const handleUpdateMultipleDevices = (deviceIds: string[], updates: Partial<Device>) => {
    if (!floor) return;
    
    let updated = false;
    // Find and update all devices
    for (const room of floor.rooms) {
      for (const deviceId of deviceIds) {
        const deviceIndex = room.devices.findIndex(d => d.id === deviceId);
        if (deviceIndex !== -1) {
          room.devices[deviceIndex] = { ...room.devices[deviceIndex], ...updates };
          updated = true;
        }
      }
    }
    
    if (updated) {
      setFloor({ ...floor });
      // Auto-save to localStorage
      buildingService.saveToLocalStorage();
    }
  };

  const handleAddDevice = (roomId: string, deviceType: DeviceType) => {
    if (!floor) return;
    
    const room = floor.rooms.find(r => r.id === roomId);
    if (!room) return;

    const deviceTypeInfo = DEVICE_TYPES.find(d => d.type === deviceType);
    if (!deviceTypeInfo) return;

    const deviceId = `${Date.now()}`;
    // Doors are placed near the edge, other devices have padding
    const initialPosition = deviceType === 'door' 
      ? { x: 0, y: Math.floor(room.dimensions.height / 2) - 20 } // Place door on left wall, centered vertically
      : { x: 20, y: 20 };

    // Doors start with 90 degree rotation for vertical placement on wall
    const initialRotation = deviceType === 'door' ? 90 : 0;

    const newDevice: Device = {
      id: deviceId,
      name: deviceTypeInfo.label,
      type: deviceType,
      status: 'online',
      roomId,
      position: initialPosition,
      rotation: initialRotation,
      scale: defaultDeviceScale, // Apply default scale
      data: {
        temperature: deviceType === 'temperature_sensor' || deviceType === 'radiator' ? 22 : undefined,
        lightLevel: deviceType === 'light_fixture' ? 75 : undefined,
        locked: deviceType === 'door' ? false : undefined,
      },
      systemType: deviceTypeInfo.systemType,
      mqttTopic: generateDeviceMqttTopic(room, deviceType, deviceId)
    };

    buildingService.addDevice(roomId, newDevice);
    
    // Force update by incrementing key and refreshing floor
    if (id) {
      const updatedFloor = buildingService.getFloor(id);
      setFloor(updatedFloor);
      setUpdateKey(prev => prev + 1);
    }
    
    // Auto-save to localStorage
    buildingService.saveToLocalStorage();
    
    toast.success(`${deviceTypeInfo.label} добавлен с топиком: ${newDevice.mqttTopic}`);
  };

  const handleRemoveDevice = (deviceId: string) => {
    buildingService.removeDevice(deviceId);
    if (id) {
      const updatedFloor = buildingService.getFloor(id);
      setFloor(updatedFloor);
    }
    toast.success('Устройство удалено');
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!floor) return;
    
    const updatedRooms = floor.rooms.filter(r => r.id !== roomId);
    floor.rooms = updatedRooms;
    setFloor({ ...floor });
    setSelectedRoom(null);
    toast.success('Помещение удалено');
  };

  const handleAddRoom = () => {
    if (!floor || !newRoomName.trim()) {
      toast.error('Введите название помещения');
      return;
    }

    const roomType = ROOM_TYPES.find(rt => rt.value === newRoomType);
    if (!roomType) return;

    const newRoomNumber = `${floor.number}${String(floor.rooms.length + 1).padStart(2, '0')}`;
    const newRoom: Room = {
      id: newRoomNumber,
      number: newRoomNumber,
      name: newRoomName,
      floorId: floor.id,
      area: (roomType.defaultSize.width * roomType.defaultSize.height) / 100,
      position: { x: 100, y: 100 },
      dimensions: roomType.defaultSize,
      devices: [],
      mqttTopic: `building/floor${floor.number}/room${newRoomNumber}`
    };

    floor.rooms.push(newRoom);
    setFloor({ ...floor });
    setIsAddRoomDialogOpen(false);
    setNewRoomName('');
    toast.success('Помещение добавлено');
  };

  const handleSave = () => {
    buildingService.saveToLocalStorage();
    toast.success('Изменения сохранены в локальное хранилище');
  };

  const handleExportFloor = () => {
    if (!id) return;
    buildingService.exportFloorToJSON(id);
    toast.success('План этажа экспортирован');
  };

  const handleImportFloor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await buildingService.importFloorFromJSON(file);
      const updatedFloor = buildingService.getFloor(id!);
      setFloor(updatedFloor);
      toast.success('План этажа импортирован');
    } catch (error) {
      toast.error((error as Error).message);
    }
    
    // Reset input
    e.target.value = '';
  };

  // Snap to grid helper function
  const snapToGridValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const getSVGPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // Apply inverse zoom and pan transformations
    const adjustedX = (svgP.x - (1000 * (1 - zoomLevel) + panX)) / zoomLevel;
    const adjustedY = (svgP.y - (600 * (1 - zoomLevel) + panY)) / zoomLevel;
    
    return { x: adjustedX, y: adjustedY };
  };

  // Calculate position constraints based on device type
  const calculateDevicePositionConstraints = (device: Device, roomWidth: number, roomHeight: number, newPos: { x: number; y: number }) => {
    // Doors can be placed on the edges - allow placement right at the boundaries or even slightly outside
    if (device.type === 'door') {
      return {
        x: Math.max(-10, Math.min(roomWidth + 10, newPos.x)),
        y: Math.max(-10, Math.min(roomHeight + 10, newPos.y))
      };
    }
    
    // Other devices need to stay inside with padding
    return {
      x: Math.max(10, Math.min(roomWidth - 30, newPos.x)),
      y: Math.max(10, Math.min(roomHeight - 30, newPos.y))
    };
  };

  // Calculate snapping guides for light fixtures alignment
  const calculateSnapGuides = (
    currentDevice: Device, 
    currentRoom: Room, 
    newPos: { x: number; y: number }, 
    disableSnap: boolean
  ): { snappedPos: { x: number; y: number }; guides: { x?: number; y?: number; roomId?: string }[] } => {
    const guides: { x?: number; y?: number; roomId?: string }[] = [];
    let snappedPos = { ...newPos };
    
    // Only snap light fixtures (unless snap is disabled with Shift key)
    if (disableSnap || currentDevice.type !== 'light_fixture') {
      return { snappedPos, guides };
    }

    const SNAP_THRESHOLD = 15; // pixels - increased for easier snapping
    let closestX: { distance: number; value: number; roomId: string } | null = null;
    let closestY: { distance: number; value: number; roomId: string } | null = null;

    // Check all light fixtures in the same room
    for (const device of currentRoom.devices) {
      if (device.id === currentDevice.id || device.type !== 'light_fixture') continue;

      // Both devices have positions relative to their room
      const distX = Math.abs(newPos.x - device.position.x);
      const distY = Math.abs(newPos.y - device.position.y);

      // Check X alignment (vertical line)
      if (distX < SNAP_THRESHOLD && (!closestX || distX < closestX.distance)) {
        closestX = { distance: distX, value: device.position.x, roomId: currentRoom.id };
      }

      // Check Y alignment (horizontal line)
      if (distY < SNAP_THRESHOLD && (!closestY || distY < closestY.distance)) {
        closestY = { distance: distY, value: device.position.y, roomId: currentRoom.id };
      }
    }

    // Check virtual guides in the same room
    for (const guide of virtualGuides) {
      if (guide.roomId !== currentRoom.id) continue;

      if (guide.type === 'vertical') {
        // Vertical guide - snap X position
        const distX = Math.abs(newPos.x - guide.position);
        if (distX < SNAP_THRESHOLD && (!closestX || distX < closestX.distance)) {
          closestX = { distance: distX, value: guide.position, roomId: currentRoom.id };
        }
      } else {
        // Horizontal guide - snap Y position
        const distY = Math.abs(newPos.y - guide.position);
        if (distY < SNAP_THRESHOLD && (!closestY || distY < closestY.distance)) {
          closestY = { distance: distY, value: guide.position, roomId: currentRoom.id };
        }
      }
    }

    // Apply snapping
    if (closestX) {
      snappedPos.x = closestX.value;
      guides.push({ x: closestX.value, roomId: closestX.roomId });
    }

    if (closestY) {
      snappedPos.y = closestY.value;
      guides.push({ y: closestY.value, roomId: closestY.roomId });
    }

    return { snappedPos, guides };
  };

  // Distribute selected light fixtures evenly
  const handleDistributeDevices = (direction: 'horizontal' | 'vertical') => {
    if (!floor || selectedDevices.length < 3) return;

    // Get all selected devices with their rooms
    const devicesWithRooms: { device: Device; room: Room }[] = [];
    for (const deviceId of selectedDevices) {
      for (const room of floor.rooms) {
        const device = room.devices.find(d => d.id === deviceId);
        if (device && device.type === 'light_fixture') {
          devicesWithRooms.push({ device, room });
          break;
        }
      }
    }

    if (devicesWithRooms.length < 3) {
      toast.error('Выберите минимум 3 светильника для распределения');
      return;
    }

    // Check if all devices are in the same room
    const roomIds = new Set(devicesWithRooms.map(d => d.room.id));
    if (roomIds.size > 1) {
      toast.error('Все светильники должны быть в одном помещении');
      return;
    }

    // Sort devices by position
    const sorted = [...devicesWithRooms].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.device.position.x - b.device.position.x;
      } else {
        return a.device.position.y - b.device.position.y;
      }
    });

    // Calculate spacing
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalDistance = direction === 'horizontal'
      ? last.device.position.x - first.device.position.x
      : last.device.position.y - first.device.position.y;
    
    const spacing = totalDistance / (sorted.length - 1);

    // Update positions
    sorted.forEach((item, index) => {
      if (index === 0 || index === sorted.length - 1) return; // Keep first and last in place

      const newPos = direction === 'horizontal'
        ? { 
            x: first.device.position.x + spacing * index,
            y: item.device.position.y 
          }
        : { 
            x: item.device.position.x,
            y: first.device.position.y + spacing * index 
          };

      handleUpdateDevice(item.device.id, { position: newPos });
    });

    toast.success(`Светильники распределены равномерно по ${direction === 'horizontal' ? 'горизонтали' : 'вертикали'}`);
  };

  // Auto-place light fixtures in a grid pattern
  const handleAutoPlaceLights = () => {
    if (!selectedRoom || !floor) {
      toast.error('Выберите помещение для автоматического размещения');
      return;
    }

    const room = floor.rooms.find(r => r.id === selectedRoom);
    if (!room) return;

    if (room.locked) {
      toast.error('Помещение заблокировано. Разблокируйте его для редактирования.');
      return;
    }

    const { countX, countY, marginX, marginY } = autoPlaceConfig;

    // Calculate available space
    const availableWidth = room.dimensions.width - (marginX * 2);
    const availableHeight = room.dimensions.height - (marginY * 2);

    if (availableWidth <= 0 || availableHeight <= 0) {
      toast.error('Недостаточно места для размещения светильников с заданными отступами');
      return;
    }

    // Calculate cell dimensions - divide available area into cells
    const cellWidth = availableWidth / countX;
    const cellHeight = availableHeight / countY;

    // Remove existing light fixtures if user confirms
    const existingLights = room.devices.filter(d => d.type === 'light_fixture');
    if (existingLights.length > 0) {
      if (!confirm(`В помещении уже есть ${existingLights.length} светильников. Удалить их и создать новые?`)) {
        return;
      }
      // Remove existing lights
      room.devices = room.devices.filter(d => d.type !== 'light_fixture');
    }

    // Calculate the actual size of a light fixture with current scale
    // baseSize = 30, light size multiplier = 1.3, then multiplied by deviceScale
    const lightSize = 30 * 1.3 * defaultDeviceScale; // Full size of the light fixture
    const halfLightSize = lightSize / 2; // Half size to center the light

    // Create grid of light fixtures - place in center of each cell
    const newDevices: Device[] = [];
    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        // Calculate center of the cell
        const cellCenterX = marginX + (x + 0.5) * cellWidth;
        const cellCenterY = marginY + (y + 0.5) * cellHeight;
        
        // Position light so its center is at the cell center (not top-left corner)
        // Since position refers to top-left of the device, subtract half the light size
        const posX = cellCenterX - halfLightSize;
        const posY = cellCenterY - halfLightSize;

        const newDevice: Device = {
          id: `light-${Date.now()}-${x}-${y}`,
          type: 'light_fixture',
          name: `Светильник ${x + 1}-${y + 1}`,
          position: { x: posX, y: posY },
          status: 'active',
          roomId: room.id,
          scale: defaultDeviceScale, // Apply default scale to auto-placed lights
          data: {
            lightLevel: 75 // Default brightness for new lights
          },
          mqttTopic: `${room.mqttTopic}/light/${x}-${y}`
        };

        newDevices.push(newDevice);
      }
    }

    // Add devices to room
    room.devices.push(...newDevices);
    setFloor({ ...floor });
    setIsAutoPlaceDialogOpen(false);
    toast.success(`Размещено ${newDevices.length} светильников (${countX}×${countY})`);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgP = getSVGPoint(e);
    if (!svgP) return;

    // Right click for panning
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (editorMode === 'select') {
      // Deselect devices when clicking on empty canvas (unless Ctrl is pressed)
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedDevices([]);
      }
    }

    if (editorMode === 'draw') {
      setDrawStart({ x: svgP.x, y: svgP.y });
      setDrawRect({ x: svgP.x, y: svgP.y, width: 0, height: 0 });
    }

    // Polygon mode - add point on click
    if (editorMode === 'polygon' && e.button === 0) {
      const newPoint = { x: svgP.x, y: svgP.y };
      
      // Check if clicking on first point to close polygon (within 15px)
      if (polygonPoints.length >= 3) {
        const firstPoint = polygonPoints[0];
        const distance = Math.sqrt(
          Math.pow(newPoint.x - firstPoint.x, 2) + Math.pow(newPoint.y - firstPoint.y, 2)
        );
        
        if (distance < 15) {
          // Close polygon and create room
          handleCreatePolygonRoom();
          return;
        }
      }
      
      // Add new point
      setPolygonPoints(prev => [...prev, newPoint]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgP = getSVGPoint(e);
    if (!svgP) return;

    if (editorMode === 'draw' && drawStart) {
      const width = svgP.x - drawStart.x;
      const height = svgP.y - drawStart.y;
      setDrawRect({
        x: width > 0 ? drawStart.x : svgP.x,
        y: height > 0 ? drawStart.y : svgP.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    }

    // Handle corner resizing
    if (editorMode === 'select' && resizingCorner && dragStart) {
      const room = floor.rooms.find(r => r.id === resizingCorner.roomId);
      if (!room) return;

      const dx = svgP.x - dragStart.x;
      const dy = svgP.y - dragStart.y;

      let newPos = { ...room.position };
      let newDim = { ...room.dimensions };

      switch (resizingCorner.corner) {
        case 'nw': // Top-left
          newPos.x = room.position.x + dx;
          newPos.y = room.position.y + dy;
          newDim.width = Math.max(50, room.dimensions.width - dx);
          newDim.height = Math.max(50, room.dimensions.height - dy);
          break;
        case 'ne': // Top-right
          newPos.y = room.position.y + dy;
          newDim.width = Math.max(50, room.dimensions.width + dx);
          newDim.height = Math.max(50, room.dimensions.height - dy);
          break;
        case 'sw': // Bottom-left
          newPos.x = room.position.x + dx;
          newDim.width = Math.max(50, room.dimensions.width - dx);
          newDim.height = Math.max(50, room.dimensions.height + dy);
          break;
        case 'se': // Bottom-right
          newDim.width = Math.max(50, room.dimensions.width + dx);
          newDim.height = Math.max(50, room.dimensions.height + dy);
          break;
      }

      handleUpdateRoom(resizingCorner.roomId, {
        position: newPos,
        dimensions: newDim
      });

      setDragStart({ x: svgP.x, y: svgP.y });
      return;
    }

    // Handle vertex dragging for polygons
    if (editorMode === 'select' && draggingVertex && dragStart) {
      const room = floor.rooms.find(r => r.id === draggingVertex.roomId);
      if (!room || !room.polygon) return;

      const dx = svgP.x - dragStart.x;
      const dy = svgP.y - dragStart.y;

      const newPolygon = [...room.polygon];
      newPolygon[draggingVertex.index] = {
        x: room.polygon[draggingVertex.index].x + dx,
        y: room.polygon[draggingVertex.index].y + dy
      };

      handleUpdateRoom(draggingVertex.roomId, { polygon: newPolygon });
      setDragStart({ x: svgP.x, y: svgP.y });
      return;
    }

    if (editorMode === 'select' && draggingRoom && dragStart && !draggingDevice && !resizingCorner) {
      const room = floor.rooms.find(r => r.id === draggingRoom);
      if (!room) return;

      const dx = svgP.x - dragStart.x;
      const dy = svgP.y - dragStart.y;

      handleUpdateRoom(draggingRoom, {
        position: {
          x: Math.max(0, Math.min(2000 - room.dimensions.width, room.position.x + dx)),
          y: Math.max(0, Math.min(1200 - room.dimensions.height, room.position.y + dy))
        }
      });

      setDragStart({ x: svgP.x, y: svgP.y });
    }

    // Handle device dragging (single or multiple)
    if (editorMode === 'select' && draggingDevice && dragStart) {
      const dx = svgP.x - dragStart.x;
      const dy = svgP.y - dragStart.y;

      // If dragging device is in selected devices, move all selected devices
      if (selectedDevices.includes(draggingDevice)) {
        // Move all selected devices
        for (const deviceId of selectedDevices) {
          let foundDevice: Device | null = null;
          let deviceRoom: Room | null = null;

          for (const room of floor.rooms) {
            const device = room.devices.find(d => d.id === deviceId);
            if (device) {
              foundDevice = device;
              deviceRoom = room;
              break;
            }
          }

          if (foundDevice && deviceRoom) {
            const newPos = calculateDevicePositionConstraints(
              foundDevice,
              deviceRoom.dimensions.width,
              deviceRoom.dimensions.height,
              { x: foundDevice.position.x + dx, y: foundDevice.position.y + dy }
            );

            handleUpdateDevice(deviceId, {
              position: newPos
            });
          }
        }
      } else {
        // Move only the dragging device
        let foundDevice: Device | null = null;
        let deviceRoom: Room | null = null;

        for (const room of floor.rooms) {
          const device = room.devices.find(d => d.id === draggingDevice);
          if (device) {
            foundDevice = device;
            deviceRoom = room;
            break;
          }
        }

        if (foundDevice && deviceRoom) {
          const constrainedPos = calculateDevicePositionConstraints(
            foundDevice,
            deviceRoom.dimensions.width,
            deviceRoom.dimensions.height,
            { x: foundDevice.position.x + dx, y: foundDevice.position.y + dy }
          );

          // Apply snapping for light fixtures (Shift to disable)
          const { snappedPos, guides } = calculateSnapGuides(
            foundDevice,
            deviceRoom,
            constrainedPos,
            e.shiftKey
          );

          setSnapGuides(guides);

          handleUpdateDevice(draggingDevice, {
            position: snappedPos
          });
        }
      }

      setDragStart({ x: svgP.x, y: svgP.y });
    }

    // Handle panning (with right mouse button)
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);

      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editorMode === 'draw' && drawRect && drawRect.width > 30 && drawRect.height > 30 && floor) {
      // Create new room from drawn rectangle
      const newRoomNumber = `${floor.number}${String(floor.rooms.length + 1).padStart(2, '0')}`;
      const newRoom: Room = {
        id: newRoomNumber,
        number: newRoomNumber,
        name: newRoomName,
        floorId: floor.id,
        area: (drawRect.width * drawRect.height) / 100,
        position: { x: drawRect.x, y: drawRect.y },
        dimensions: { width: drawRect.width, height: drawRect.height },
        devices: [],
        mqttTopic: `building/floor${floor.number}/room${newRoomNumber}`
      };

      floor.rooms.push(newRoom);
      setFloor({ ...floor });
      setSelectedRoom(newRoom.id);
      toast.success('Помещение создано');
    }

    setDrawStart(null);
    setDrawRect(null);
    setDraggingRoom(null);
    setDraggingDevice(null);
    setResizingCorner(null);
    setDraggingVertex(null);
    setDragStart(null);
    setIsPanning(false);
    setSnapGuides([]); // Clear snap guides
  };

  const handleRoomMouseDown = (roomId: string, e: React.MouseEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    
    const svgP = getSVGPoint(e as any);
    if (!svgP) return;

    // Check if room is locked
    const room = floor?.rooms.find(r => r.id === roomId);
    if (room?.locked && editorMode === 'select') {
      toast.info('Помещение заблокировано. Разблокируйте его для редактирования.');
      e.stopPropagation();
      return;
    }

    // Handle guide creation mode
    if (guideMode && room) {
      const relativeX = svgP.x - room.position.x;
      const relativeY = svgP.y - room.position.y;
      
      const newGuide = {
        id: `guide-${Date.now()}`,
        type: guideMode,
        position: guideMode === 'vertical' ? relativeX : relativeY,
        roomId: room.id
      };
      
      setVirtualGuides(prev => [...prev, newGuide]);
      toast.success(`${guideMode === 'vertical' ? 'Вертикальная' : 'Горизонтальная'} направляющая создана`);
      e.stopPropagation();
      return;
    }

    if (editorMode !== 'select') return;

    // Deselect devices when clicking on room (unless Ctrl is pressed)
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedDevices([]);
    }
    
    setDraggingRoom(roomId);
    setDragStart({ x: svgP.x, y: svgP.y });
    e.stopPropagation();
  };

  const handleDeviceMouseDown = (deviceId: string, e: React.MouseEvent<SVGGElement>) => {
    if (editorMode !== 'select') return;
    if (e.button !== 0) return;
    
    const svgP = getSVGPoint(e as any);
    if (!svgP) return;

    // Multiple selection with Ctrl key
    if (e.ctrlKey || e.metaKey) {
      setSelectedDevices(prev => {
        if (prev.includes(deviceId)) {
          // Deselect if already selected
          return prev.filter(id => id !== deviceId);
        } else {
          // Add to selection
          return [...prev, deviceId];
        }
      });
      e.stopPropagation();
      return; // Don't start dragging with Ctrl
    } else {
      // Single selection (replace previous selection)
      setSelectedDevices([deviceId]);
    }
    
    setDraggingDevice(deviceId);
    setDragStart({ x: svgP.x, y: svgP.y });
    e.stopPropagation();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!floor) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, загрузите изображение');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      floor.backgroundImage = imageData;
      floor.backgroundOpacity = backgroundOpacity;
      setFloor({ ...floor });
      toast.success('Подложка загружена');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    if (!floor) return;
    
    floor.backgroundImage = undefined;
    setFloor({ ...floor });
    toast.success('Подложка удалена');
  };

  const handleOpacityChange = (value: number) => {
    if (!floor) return;
    
    setBackgroundOpacity(value);
    floor.backgroundOpacity = value;
    setFloor({ ...floor });
  };

  const handleCornerMouseDown = (roomId: string, corner: 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    if (editorMode !== 'select') return;
    e.stopPropagation();
    
    const svgP = getSVGPoint(e as any);
    if (!svgP) return;

    // Check if room is locked
    const room = floor?.rooms.find(r => r.id === roomId);
    if (room?.locked) {
      toast.info('Помещение заблокировано. Разблокируйте его для редактирования.');
      return;
    }

    setResizingCorner({ roomId, corner });
    setDragStart({ x: svgP.x, y: svgP.y });
  };

  const handleVertexMouseDown = (roomId: string, index: number, e: React.MouseEvent) => {
    if (editorMode !== 'select') return;
    e.stopPropagation();
    
    const svgP = getSVGPoint(e as any);
    if (!svgP) return;

    // Check if room is locked
    const room = floor?.rooms.find(r => r.id === roomId);
    if (room?.locked) {
      toast.info('Помещение заблокировано. Разблокируйте его для редактирования.');
      return;
    }

    setDraggingVertex({ roomId, index });
    setDragStart({ x: svgP.x, y: svgP.y });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    // Only zoom when Ctrl or Cmd is pressed
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // deltaY is negative when scrolling up (zoom in), positive when scrolling down (zoom out)
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      
      setZoomLevel(prev => {
        const newZoom = prev + zoomDelta;
        return Math.max(0.5, Math.min(2, newZoom)); // Clamp between 0.5 and 2
      });
    }
  };

  const handleToggleGrid = () => {
    setIsGridVisible(prev => !prev);
  };

  const handleToggleBackground = () => {
    setIsBackgroundVisible(prev => !prev);
  };

  const handleCreatePolygonRoom = () => {
    if (!floor || polygonPoints.length < 3) return;

    // Calculate bounding box
    const minX = Math.min(...polygonPoints.map(p => p.x));
    const minY = Math.min(...polygonPoints.map(p => p.y));
    const maxX = Math.max(...polygonPoints.map(p => p.x));
    const maxY = Math.max(...polygonPoints.map(p => p.y));

    // Convert absolute coordinates to relative coordinates
    const relativePolygon = polygonPoints.map(p => ({
      x: p.x - minX,
      y: p.y - minY
    }));

    const newRoomNumber = `${floor.number}${String(floor.rooms.length + 1).padStart(2, '0')}`;
    const newRoom: Room = {
      id: newRoomNumber,
      number: newRoomNumber,
      name: newRoomName || 'Полигон',
      floorId: floor.id,
      area: calculatePolygonArea(polygonPoints) / 100,
      position: { x: minX, y: minY },
      dimensions: { width: maxX - minX, height: maxY - minY },
      devices: [],
      mqttTopic: `building/floor${floor.number}/room${newRoomNumber}`,
      polygon: relativePolygon // Store relative coordinates
    };

    floor.rooms.push(newRoom);
    setFloor({ ...floor });
    setSelectedRoom(newRoom.id);
    toast.success('Помещение создано');
    setPolygonPoints([]);
  };

  const calculatePolygonArea = (points: { x: number; y: number }[]): number => {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="rounded-2xl">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">Редактор: {floor.name}</h1>
              <p className="text-gray-600">Создавайте помещения и добавляйте устройства</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsAddRoomDialogOpen(true)} 
              className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Plus className="mr-2 size-4" />
              Добавить
            </Button>
            <Button onClick={handleSave} className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
              <Save className="mr-2 size-4" />
              Сохранить
            </Button>
            <Button onClick={handleExportFloor} className="rounded-2xl bg-gradient-to-r from-gray-500 to-gray-700">
              <Download className="mr-2 size-4" />
              Экспорт
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFloor}
              className="hidden"
            />
            <Button
              onClick={() => importInputRef.current?.click()}
              variant="outline"
              className="rounded-2xl border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Upload className="mr-2 size-4" />
              Импорт
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Floor Plan Editor */}
          <div className="lg:col-span-2">
            <Card className="rounded-3xl shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>План этажа</CardTitle>
                  
                  {/* Mode selector */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant={editorMode === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditorMode('select')}
                        className="rounded-xl"
                      >
                        <MousePointer className="size-4 mr-2" />
                        Выбор
                      </Button>
                      <Button
                        variant={editorMode === 'draw' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditorMode('draw')}
                        className="rounded-xl"
                      >
                        <PenTool className="size-4 mr-2" />
                        Рисовать
                      </Button>
                      <Button
                        variant={editorMode === 'polygon' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setEditorMode('polygon');
                          setPolygonPoints([]);
                        }}
                        className="rounded-xl"
                      >
                        <Hexagon className="size-4 mr-2" />
                        Полигон
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant={guideMode === 'horizontal' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setGuideMode(guideMode === 'horizontal' ? null : 'horizontal')}
                          className="rounded-xl"
                        >
                          <AlignHorizontalDistributeCenter className="size-4 mr-2" />
                          {guideMode === 'horizontal' ? 'Отменить' : 'Гориз. линия'}
                        </Button>
                        <Button
                          variant={guideMode === 'vertical' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setGuideMode(guideMode === 'vertical' ? null : 'vertical')}
                          className="rounded-xl"
                        >
                          <AlignVerticalDistributeCenter className="size-4 mr-2" />
                          {guideMode === 'vertical' ? 'Отменить' : 'Верт. линия'}
                        </Button>
                        {virtualGuides.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVirtualGuides([]);
                              toast.success('Все направляющие удалены');
                            }}
                            className="rounded-xl"
                          >
                            <X className="size-4 mr-2" />
                            Очистить линии ({virtualGuides.length})
                          </Button>
                        )}
                      </div>
                      {guideMode && (
                        <div className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                          📏 <strong>Режим направляющих:</strong> кликните на помещении, чтобы создать {guideMode === 'horizontal' ? 'горизонтальную' : 'вертикальную'} линию. Светильники будут автоматически привязываться к ней.
                        </div>
                      )}
                    </div>
                    {editorMode === 'select' && selectedDevices.length > 0 && (() => {
                      // Check if any selected device is a light fixture
                      const hasLightFixtures = floor?.rooms.some(room => 
                        room.devices.some(device => 
                          selectedDevices.includes(device.id) && device.type === 'light_fixture'
                        )
                      );
                      
                      return (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                            💡 Удерживайте <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl</kbd> для выделения нескольких устройств
                            {hasLightFixtures && (
                              <>
                                {' • '}
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Shift</kbd> отключает привязку светильников
                              </>
                            )}
                          </div>
                          {selectedDevices.length >= 3 && (
                            <div className="space-y-2">
                              <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                💡 <strong>Помощни�� размещения светильников:</strong> перетаскивайте светильники — они автоматически выравниваются по другим
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDistributeDevices('horizontal')}
                                  className="rounded-xl text-xs"
                                >
                                  <AlignHorizontalDistributeCenter className="size-3 mr-1" />
                                  Распределить по горизонтали
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDistributeDevices('vertical')}
                                  className="rounded-xl text-xs"
                                >
                                  <AlignVerticalDistributeCenter className="size-3 mr-1" />
                                  Распределить по вертикали
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-[800px] border-2 border-dashed border-gray-300">
                  <svg 
                    ref={svgRef}
                    width="100%" 
                    height="800" 
                    viewBox="0 0 2000 1200"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                    className="select-none"
                    style={{ cursor: isPanning ? 'grabbing' : (guideMode ? 'crosshair' : editorMode === 'draw' ? 'crosshair' : 'default') }}
                  >
                    {/* Grid pattern */}
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    
                    {/* Main content group with zoom transformation */}
                    <g transform={`translate(${1000 * (1 - zoomLevel) + panX}, ${600 * (1 - zoomLevel) + panY}) scale(${zoomLevel})`}>
                      {isGridVisible && <rect width="2000" height="1200" fill="url(#grid)" />}

                      {/* Background Image */}
                      {floor.backgroundImage && isBackgroundVisible && (
                        <image
                          href={floor.backgroundImage}
                          x="0"
                          y="0"
                          width="2000"
                          height="1200"
                          opacity={floor.backgroundOpacity || backgroundOpacity}
                          preserveAspectRatio="none"
                        />
                      )}

                      {/* Drawing rectangle */}
                      {drawRect && editorMode === 'draw' && (
                        <rect
                          x={drawRect.x}
                          y={drawRect.y}
                          width={drawRect.width}
                          height={drawRect.height}
                          fill="#3b82f6"
                          fillOpacity="0.2"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          rx="20"
                        />
                      )}

                      {/* Drawing polygon */}
                      {polygonPoints.length > 0 && editorMode === 'polygon' && (
                        <g>
                          {/* Polygon outline */}
                          <polyline
                            points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          {/* Points */}
                          {polygonPoints.map((point, index) => (
                            <circle
                              key={index}
                              cx={point.x}
                              cy={point.y}
                              r={index === 0 ? "10" : "6"}
                              fill={index === 0 ? "#10b981" : "#2563eb"}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          ))}
                          {/* Preview polygon if we have 3+ points */}
                          {polygonPoints.length >= 3 && (
                            <polygon
                              points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                              fill="#3b82f6"
                              fillOpacity="0.2"
                              stroke="none"
                            />
                          )}
                        </g>
                      )}

                      {/* Rooms */}
                      {floor.rooms.map((room) => {
                        const isSelected = selectedRoom === room.id;
                        const isDragging = draggingRoom === room.id;

                        return (
                          <g
                            key={room.id}
                            transform={`translate(${room.position.x}, ${room.position.y})`}
                            onMouseDown={(e) => handleRoomMouseDown(room.id, e)}
                            onClick={(e) => {
                              if (editorMode === 'select') {
                                e.stopPropagation();
                                setSelectedRoom(room.id);
                              }
                            }}
                            style={{ cursor: editorMode === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                            opacity={isDragging ? 0.7 : 1}
                          >
                            {/* Render polygon or rectangle based on room type */}
                            {room.polygon ? (
                              <polygon
                                points={room.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                                fill={isSelected ? '#3b82f6' : '#ffffff'}
                                stroke={room.locked ? '#f59e0b' : (isSelected ? '#2563eb' : '#94a3b8')}
                                strokeWidth={room.locked ? '3' : (isSelected ? '4' : '2')}
                                strokeDasharray={room.locked ? '8,4' : (isSelected ? '10,5' : '0')}
                                className="transition-all"
                                filter={isDragging ? 'url(#shadow)' : ''}
                              />
                            ) : (
                              <rect
                                width={room.dimensions.width}
                                height={room.dimensions.height}
                                rx="20"
                                ry="20"
                                fill={isSelected ? '#3b82f6' : '#ffffff'}
                                stroke={room.locked ? '#f59e0b' : (isSelected ? '#2563eb' : '#94a3b8')}
                                strokeWidth={room.locked ? '3' : (isSelected ? '4' : '2')}
                                strokeDasharray={room.locked ? '8,4' : (isSelected ? '10,5' : '0')}
                                className="transition-all"
                                filter={isDragging ? 'url(#shadow)' : ''}
                              />
                            )}
                              
                              <text
                                x={room.polygon ? room.dimensions.width / 2 : room.dimensions.width / 2}
                                y={25}
                                textAnchor="middle"
                                className="text-sm font-bold pointer-events-none"
                                fill={isSelected ? '#ffffff' : '#1f2937'}
                              >
                                {room.number}
                              </text>
                              
                              <text
                                x={room.polygon ? room.dimensions.width / 2 : room.dimensions.width / 2}
                                y={42}
                                textAnchor="middle"
                                className="text-xs pointer-events-none"
                                fill={isSelected ? '#e0e7ff' : '#6b7280'}
                              >
                                {room.name}
                              </text>

                              {/* Lock indicator */}
                              {room.locked && (
                                <g transform={`translate(${room.dimensions.width - 30}, 10)`}>
                                  <circle cx={12} cy={12} r={12} fill="#f59e0b" opacity={0.9} />
                                  <text
                                    x={12}
                                    y={17}
                                    textAnchor="middle"
                                    className="text-xs pointer-events-none"
                                    fill="#ffffff"
                                    fontSize="14"
                                  >
                                    🔒
                                  </text>
                                </g>
                              )}

                            {/* Devices */}
                            {room.devices.filter(device => visibleDeviceTypes.has(device.type)).map((device) => {
                              const isDeviceSelected = selectedDevices.includes(device.id);
                              const isSnapped = draggingDevice === device.id && snapGuides.length > 0;
                              return (
                                <g key={`${device.id}-${updateKey}`} onMouseDown={(e) => handleDeviceMouseDown(device.id, e)}>
                                  {/* Selection highlight for device */}
                                  {isDeviceSelected && (
                                    <circle
                                      cx={device.position.x + 20}
                                      cy={device.position.y + 20}
                                      r="25"
                                      fill="none"
                                      stroke={isSnapped ? "#10b981" : "#6366f1"}
                                      strokeWidth={isSnapped ? "4" : "3"}
                                      strokeDasharray="5,5"
                                      opacity={isSnapped ? "0.8" : "0.6"}
                                    />
                                  )}
                                  {/* Snap indicator */}
                                  {isSnapped && device.type === 'light_fixture' && (
                                    <g transform={`translate(${device.position.x + 40}, ${device.position.y - 5})`}>
                                      <circle cx={0} cy={0} r={8} fill="#10b981" />
                                      <text
                                        x={0}
                                        y={4}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill="white"
                                        fontWeight="bold"
                                      >
                                        ✓
                                      </text>
                                    </g>
                                  )}
                                  <DeviceVisual device={device} />
                                </g>
                              );
                            })}

                            {isSelected && !isDragging && !room.locked && (
                              <>
                                {/* Polygon vertices or rectangle corners - only shown when not locked */}
                                {room.polygon ? (
                                  // Render vertex points for polygon
                                  room.polygon.map((point, index) => (
                                    <circle
                                      key={index}
                                      cx={point.x}
                                      cy={point.y}
                                      r="8"
                                      fill="#2563eb"
                                      style={{ cursor: 'move' }}
                                      onMouseDown={(e) => handleVertexMouseDown(room.id, index, e)}
                                    />
                                  ))
                                ) : (
                                  // Render corner points for rectangle
                                  <>
                                    <circle 
                                      cx="0" 
                                      cy="0" 
                                      r="8" 
                                      fill="#2563eb" 
                                      style={{ cursor: 'nwse-resize' }}
                                      onMouseDown={(e) => handleCornerMouseDown(room.id, 'nw', e)}
                                    />
                                    <circle 
                                      cx={room.dimensions.width} 
                                      cy="0" 
                                      r="8" 
                                      fill="#2563eb"
                                      style={{ cursor: 'nesw-resize' }}
                                      onMouseDown={(e) => handleCornerMouseDown(room.id, 'ne', e)}
                                    />
                                    <circle 
                                      cx="0" 
                                      cy={room.dimensions.height} 
                                      r="8" 
                                      fill="#2563eb"
                                      style={{ cursor: 'nesw-resize' }}
                                      onMouseDown={(e) => handleCornerMouseDown(room.id, 'sw', e)}
                                    />
                                    <circle 
                                      cx={room.dimensions.width} 
                                      cy={room.dimensions.height} 
                                      r="8" 
                                      fill="#2563eb"
                                      style={{ cursor: 'nwse-resize' }}
                                      onMouseDown={(e) => handleCornerMouseDown(room.id, 'se', e)}
                                    />
                                  </>
                                )}
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Snap guides - visual alignment helpers */}
                      {snapGuides.map((guide, index) => {
                        const room = floor.rooms.find(r => r.id === guide.roomId);
                        if (!room) return null;

                        return (
                          <g key={`guide-${index}`} transform={`translate(${room.position.x}, ${room.position.y})`}>
                            {guide.x !== undefined && (
                              <line
                                x1={guide.x}
                                y1={0}
                                x2={guide.x}
                                y2={room.dimensions.height}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.7"
                                pointerEvents="none"
                              />
                            )}
                            {guide.y !== undefined && (
                              <line
                                x1={0}
                                y1={guide.y}
                                x2={room.dimensions.width}
                                y2={guide.y}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.7"
                                pointerEvents="none"
                              />
                            )}
                          </g>
                        );
                      })}

                      {/* Virtual guides - permanent alignment guides */}
                      {virtualGuides.map((guide) => {
                        const room = floor.rooms.find(r => r.id === guide.roomId);
                        if (!room) return null;

                        return (
                          <g 
                            key={guide.id} 
                            transform={`translate(${room.position.x}, ${room.position.y})`}
                          >
                            {guide.type === 'vertical' ? (
                              <>
                                <line
                                  x1={guide.position}
                                  y1={0}
                                  x2={guide.position}
                                  y2={room.dimensions.height}
                                  stroke="#10b981"
                                  strokeWidth="2"
                                  strokeDasharray="8,4"
                                  opacity="0.6"
                                  style={{ cursor: 'pointer' }}
                                />
                                {/* Delete button */}
                                <g 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVirtualGuides(prev => prev.filter(g => g.id !== guide.id));
                                    toast.success('Направляющая удалена');
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <circle
                                    cx={guide.position}
                                    cy={10}
                                    r="8"
                                    fill="#10b981"
                                  />
                                  <text
                                    x={guide.position}
                                    y={14}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="white"
                                    fontWeight="bold"
                                  >
                                    ×
                                  </text>
                                </g>
                              </>
                            ) : (
                              <>
                                <line
                                  x1={0}
                                  y1={guide.position}
                                  x2={room.dimensions.width}
                                  y2={guide.position}
                                  stroke="#10b981"
                                  strokeWidth="2"
                                  strokeDasharray="8,4"
                                  opacity="0.6"
                                  style={{ cursor: 'pointer' }}
                                />
                                {/* Delete button */}
                                <g 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVirtualGuides(prev => prev.filter(g => g.id !== guide.id));
                                    toast.success('Направляющая удалена');
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <circle
                                    cx={10}
                                    cy={guide.position}
                                    r="8"
                                    fill="#10b981"
                                  />
                                  <text
                                    x={10}
                                    y={guide.position + 4}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="white"
                                    fontWeight="bold"
                                  >
                                    ×
                                  </text>
                                </g>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  </svg>

                  {floor.rooms.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center text-gray-400">
                        <Home className="size-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">План этажа пуст</p>
                        <p className="text-sm mt-2">
                          {editorMode === 'draw' 
                            ? 'Нарисуйте помещение мышью' 
                            : 'Нажмите "Добавить" или переключитесь в режим рисования'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-start gap-3">
                    {editorMode === 'select' && (
                      <>
                        <Maximize2 className="size-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium">Режим выбора</p>
                          <p className="text-xs mt-1">Перетаскивайте помещения и устройства. Тяните за синие точки в углах для изменения размеров. Выделенное помещение редактируется в правой панели. <strong>Правая кнопка мыши</strong> - перемещение по канвасу.</p>
                        </div>
                      </>
                    )}
                    {editorMode === 'draw' && (
                      <>
                        <PenTool className="size-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium">Режим рисования</p>
                          <p className="text-xs mt-1">Нажмите и тяните мышью для содания нового помещения. Минимальный размер 30×30 пикселей. <strong>Правая кнопка мыши</strong> - перемещение по канвасу.</p>
                        </div>
                      </>
                    )}
                    {editorMode === 'polygon' && (
                      <>
                        <Hexagon className="size-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium">Режим полигона</p>
                          <p className="text-xs mt-1">Кликайте мышью для добавления точек многоугольника. <strong className="text-green-600">Зелёная точка</strong> - первая точка (клик на неё завершит фигуру). Минимум 3 точки. <strong>Правая кнопка мыши</strong> - перемещение по канвасу.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Background Image Controls */}
                <div className="mt-4 p-4 bg-purple-50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="size-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Подложка плана</span>
                    </div>
                    {floor.backgroundImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBackground}
                        className="rounded-xl hover:bg-purple-100 hover:text-red-600"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  
                  {!floor.backgroundImage ? (
                    <>
                      <p className="text-xs text-purple-700">
                        Загрузите план этажа для точного построения помещений
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full rounded-xl border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <Image className="mr-2 size-4" />
                        Загрузить изображение
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-700">
                          Прозрачность: {Math.round((floor.backgroundOpacity || backgroundOpacity) * 100)}%
                        </Label>
                        <Slider
                          min={0}
                          max={1}
                          step={0.05}
                          value={[floor.backgroundOpacity || backgroundOpacity]}
                          onValueChange={(vals) => handleOpacityChange(vals[0])}
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-purple-700">
                        ✓ Подложка загружена. Рисуйте помещения поверх изображения.
                      </p>
                    </>
                  )}
                </div>

                {/* Zoom Controls */}
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ZoomIn className="size-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Масштаб: {Math.round(zoomLevel * 100)}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        className="rounded-xl"
                      >
                        <ZoomIn className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        className="rounded-xl"
                      >
                        <ZoomOut className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Используйте <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Колесико</kbd> для масштабирования
                  </p>
                </div>

                {/* Grid and Background Visibility Controls */}
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="size-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Сетка</span>
                    </div>
                    <Checkbox
                      checked={isGridVisible}
                      onCheckedChange={handleToggleGrid}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="size-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Подложка</span>
                    </div>
                    <Checkbox
                      checked={isBackgroundVisible}
                      onCheckedChange={handleToggleBackground}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Device Type Visibility Controls */}
                <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="size-5 text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-900">Видимость устройств</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={showAllDeviceTypes}
                        className="h-7 px-2 text-xs rounded-lg hover:bg-indigo-100"
                        title="Показать все"
                      >
                        Все
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={hideAllDeviceTypes}
                        className="h-7 px-2 text-xs rounded-lg hover:bg-indigo-100"
                        title="Скрыть все"
                      >
                        Нет
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3 px-2 py-1.5 bg-white/60 rounded-lg">
                    <p className="text-xs text-indigo-700">
                      <span className="font-semibold">{DEVICE_GROUPS.filter(g => g.deviceTypes.every(t => visibleDeviceTypes.has(t))).length}</span> из <span className="font-semibold">{DEVICE_GROUPS.length}</span> групп видимы
                      {DEVICE_GROUPS.filter(g => g.deviceTypes.every(t => visibleDeviceTypes.has(t))).length < DEVICE_GROUPS.length && (
                        <span className="ml-1 text-amber-600">
                          • {DEVICE_GROUPS.length - DEVICE_GROUPS.filter(g => g.deviceTypes.every(t => visibleDeviceTypes.has(t))).length} скрыто
                        </span>
                      )}
                    </p>
                  </div>
                  <DeviceTypeToggleIcons
                    visibleDeviceTypes={visibleDeviceTypes}
                    onToggleDeviceType={toggleDeviceTypeVisibility}
                  />
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-700 text-center">
                      ℹ️ Скрытые устройства не удаляются, только не отображаются на плане
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Editor Panel */}
          <div>
            {selectedRoom ? (
              <RoomEditor
                room={floor.rooms.find(r => r.id === selectedRoom)!}
                onUpdateRoom={handleUpdateRoom}
                onAddDevice={handleAddDevice}
                onRemoveDevice={handleRemoveDevice}
                onDeleteRoom={handleDeleteRoom}
                onUpdateDevice={handleUpdateDevice}
                onUpdateMultipleDevices={handleUpdateMultipleDevices}
                selectedDeviceIds={selectedDevices}
                onOpenAutoPlace={() => setIsAutoPlaceDialogOpen(true)}
                defaultDeviceScale={defaultDeviceScale}
                onDefaultScaleChange={setDefaultDeviceScale}
                visibleDeviceTypes={visibleDeviceTypes}
              />
            ) : (
              <Card className="rounded-3xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500 py-12">
                    <Activity className="size-12 mx-auto mb-4 text-gray-400" />
                    <p>Выберите помещение</p>
                    <p className="text-sm mt-2">для редактирования</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Room Dialog */}
        <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Добавить помещение</DialogTitle>
              <DialogDescription>
                Создайте новое помещение на плане этажа
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Тип помещения</Label>
                <Select value={newRoomType} onValueChange={setNewRoomType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        <div>
                          <div>{rt.label}</div>
                          <div className="text-xs text-gray-500">
                            {rt.defaultSize.width}×{rt.defaultSize.height} px
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Введите название помещения"
                  className="rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRoom();
                    }
                  }}
                />
              </div>
              <Button onClick={handleAddRoom} className="w-full rounded-xl">
                <Plus className="mr-2 size-4" />
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Auto Place Lights Dialog */}
        <Dialog open={isAutoPlaceDialogOpen} onOpenChange={setIsAutoPlaceDialogOpen}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Автоматическая расстановка светильников</DialogTitle>
              <DialogDescription>
                Создайте равномерную сетку светильников в выбранном помещении
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <Label className="text-xs text-gray-600 mb-2 block">Предпросмотр сетки</Label>
                <div className="bg-white rounded-lg p-4 aspect-video flex items-center justify-center">
                  <svg width="200" height="120" viewBox="0 0 200 120">
                    {/* Room outline */}
                    <rect x="0" y="0" width="200" height="120" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                    {/* Margin guides */}
                    <rect 
                      x={autoPlaceConfig.marginX * 0.4} 
                      y={autoPlaceConfig.marginY * 0.4} 
                      width={200 - (autoPlaceConfig.marginX * 0.8)} 
                      height={120 - (autoPlaceConfig.marginY * 0.8)} 
                      fill="none" 
                      stroke="#60a5fa" 
                      strokeWidth="1" 
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                    {/* Light fixtures grid */}
                    {(() => {
                      const availableWidth = 200 - (autoPlaceConfig.marginX * 0.8);
                      const availableHeight = 120 - (autoPlaceConfig.marginY * 0.8);
                      // Calculate cell dimensions for even distribution
                      const cellWidth = availableWidth / autoPlaceConfig.countX;
                      const cellHeight = availableHeight / autoPlaceConfig.countY;
                      const lights = [];
                      
                      for (let y = 0; y < autoPlaceConfig.countY; y++) {
                        for (let x = 0; x < autoPlaceConfig.countX; x++) {
                          // Calculate center of the cell
                          const cellCenterX = autoPlaceConfig.marginX * 0.4 + (x + 0.5) * cellWidth;
                          const cellCenterY = autoPlaceConfig.marginY * 0.4 + (y + 0.5) * cellHeight;
                          lights.push(
                            <g key={`${x}-${y}`}>
                              <circle cx={cellCenterX} cy={cellCenterY} r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
                              <circle cx={cellCenterX} cy={cellCenterY} r="6" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.5" />
                            </g>
                          );
                        }
                      }
                      return lights;
                    })()}
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Количество по горизонтали</Label>
                  <Input
                    type="number"
                    value={autoPlaceConfig.countX}
                    onChange={(e) => setAutoPlaceConfig({ ...autoPlaceConfig, countX: parseInt(e.target.value) || 1 })}
                    className="rounded-xl"
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Количество по вертикали</Label>
                  <Input
                    type="number"
                    value={autoPlaceConfig.countY}
                    onChange={(e) => setAutoPlaceConfig({ ...autoPlaceConfig, countY: parseInt(e.target.value) || 1 })}
                    className="rounded-xl"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Отступ слева/справа (px)</Label>
                  <Input
                    type="number"
                    value={autoPlaceConfig.marginX}
                    onChange={(e) => setAutoPlaceConfig({ ...autoPlaceConfig, marginX: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                    min="0"
                    max="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Отступ сверху/снизу (px)</Label>
                  <Input
                    type="number"
                    value={autoPlaceConfig.marginY}
                    onChange={(e) => setAutoPlaceConfig({ ...autoPlaceConfig, marginY: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                    min="0"
                    max="200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Быстрые пресеты</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 2, countY: 2, marginX: 60, marginY: 60 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    2×2
                  </Button>
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 3, countY: 3, marginX: 50, marginY: 50 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    3×3
                  </Button>
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 4, countY: 4, marginX: 40, marginY: 40 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    4×4
                  </Button>
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 2, countY: 4, marginX: 60, marginY: 40 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    2×4
                  </Button>
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 3, countY: 2, marginX: 50, marginY: 60 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    3×2
                  </Button>
                  <Button
                    onClick={() => setAutoPlaceConfig({ countX: 1, countY: 1, marginX: 0, marginY: 0 })}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    Центр
                  </Button>
                </div>
              </div>
              {selectedRoom && (() => {
                const room = floor?.rooms.find(r => r.id === selectedRoom);
                if (!room) return null;
                
                // Auto-calculate optimal grid based on room size (one light per ~100x100 area)
                const optimalX = Math.max(1, Math.round(room.dimensions.width / 100));
                const optimalY = Math.max(1, Math.round(room.dimensions.height / 100));
                
                return (
                  <Button
                    onClick={() => setAutoPlaceConfig({ 
                      countX: optimalX, 
                      countY: optimalY, 
                      marginX: 50, 
                      marginY: 50 
                    })}
                    variant="outline"
                    className="w-full rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    ✨ Автоматический расчет ({optimalX}×{optimalY})
                  </Button>
                );
              })()}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                <p className="font-medium mb-1">
                  💡 Будет создано: {autoPlaceConfig.countX * autoPlaceConfig.countY} светильников
                </p>
                <p className="text-xs">
                  Существующие светильники в помещении будут удалены
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAutoPlaceLights}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  <Lightbulb className="mr-2 size-4" />
                  Разместить светильники
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}