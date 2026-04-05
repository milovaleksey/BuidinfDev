import { DeviceType } from '../types';
import { DEVICE_TYPES } from '../constants/devices';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';

interface DeviceTypeFiltersProps {
  visibleDeviceTypes: Set<DeviceType>;
  onToggleDeviceType: (deviceType: DeviceType) => void;
  compact?: boolean;
}

export function DeviceTypeFilters({ visibleDeviceTypes, onToggleDeviceType, compact = false }: DeviceTypeFiltersProps) {
  const allVisible = DEVICE_TYPES.every(dt => visibleDeviceTypes.has(dt.type));
  const noneVisible = DEVICE_TYPES.every(dt => !visibleDeviceTypes.has(dt.type));

  const toggleAll = () => {
    if (allVisible) {
      // Hide all
      DEVICE_TYPES.forEach(dt => {
        if (visibleDeviceTypes.has(dt.type)) {
          onToggleDeviceType(dt.type);
        }
      });
    } else {
      // Show all
      DEVICE_TYPES.forEach(dt => {
        if (!visibleDeviceTypes.has(dt.type)) {
          onToggleDeviceType(dt.type);
        }
      });
    }
  };

  // Group by system type
  const devicesBySystem = {
    access_control: DEVICE_TYPES.filter(d => d.systemType === 'access_control'),
    video: DEVICE_TYPES.filter(d => d.systemType === 'video'),
    lighting: DEVICE_TYPES.filter(d => d.systemType === 'lighting'),
    heating: DEVICE_TYPES.filter(d => d.systemType === 'heating'),
    hvac: DEVICE_TYPES.filter(d => d.systemType === 'hvac'),
    sensors: DEVICE_TYPES.filter(d => d.systemType === 'sensors'),
  };

  const systemLabels = {
    access_control: 'СКУД',
    video: 'Видеонаблюдение',
    lighting: 'Освещение',
    heating: 'Отопление',
    hvac: 'Кондиционирование',
    sensors: 'Датчики',
  };

  if (compact) {
    return (
      <div className="bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs font-semibold text-gray-700">Видимость устройств</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-6 px-2 text-xs"
          >
            {allVisible ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Скрыть все
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Показать все
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEVICE_TYPES.map((deviceType) => {
            const Icon = deviceType.icon;
            const isVisible = visibleDeviceTypes.has(deviceType.type);

            return (
              <div
                key={deviceType.type}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  isVisible 
                    ? 'bg-indigo-50 border-indigo-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className={`size-3 flex-shrink-0 ${isVisible ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`text-xs truncate ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                    {deviceType.label}
                  </span>
                </div>
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => onToggleDeviceType(deviceType.type)}
                  className="rounded flex-shrink-0"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Видимость устройств</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 px-2"
          >
            {allVisible ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Скрыть все
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Показать все
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(devicesBySystem).map(([systemType, devices]) => {
          if (devices.length === 0) return null;

          return (
            <div key={systemType} className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600">
                {systemLabels[systemType as keyof typeof systemLabels]}
              </Label>
              <div className="space-y-1">
                {devices.map((deviceType) => {
                  const Icon = deviceType.icon;
                  const isVisible = visibleDeviceTypes.has(deviceType.type);

                  return (
                    <div
                      key={deviceType.type}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isVisible 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`size-4 ${isVisible ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`text-xs ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                          {deviceType.label}
                        </span>
                      </div>
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={() => onToggleDeviceType(deviceType.type)}
                        className="rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
