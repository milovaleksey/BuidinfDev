import { Device, DeviceType } from '../types';
import { DEVICE_TYPES } from '../constants/devices';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DeviceListProps {
  devices: Device[];
  visibleDeviceTypes: Set<DeviceType>;
  grouped?: boolean;
}

export function DeviceList({ devices, visibleDeviceTypes, grouped = true }: DeviceListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<DeviceType>>(new Set());

  const toggleGroup = (deviceType: DeviceType) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceType)) {
        newSet.delete(deviceType);
      } else {
        newSet.add(deviceType);
      }
      return newSet;
    });
  };

  const getDeviceIcon = (type: DeviceType) => {
    const deviceType = DEVICE_TYPES.find(dt => dt.type === type);
    return deviceType?.icon || Activity;
  };

  const getDeviceLabel = (type: DeviceType) => {
    const deviceType = DEVICE_TYPES.find(dt => dt.type === type);
    return deviceType?.label || type;
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

  const getStatusText = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'В сети';
      case 'offline':
        return 'Не в сети';
      case 'warning':
        return 'Предупреждение';
      default:
        return 'Неизвестно';
    }
  };

  if (!grouped) {
    // Flat list
    return (
      <div className="space-y-2">
        {devices.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Нет устройств</p>
        ) : (
          devices.map((device) => {
            const Icon = getDeviceIcon(device.type);
            const StatusIcon = getStatusIcon(device.status);
            const isVisible = visibleDeviceTypes.has(device.type);

            return (
              <div
                key={device.id}
                className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                  isVisible ? 'bg-white' : 'bg-gray-50 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-4 h-4 text-gray-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{device.name}</p>
                    <p className="text-xs text-gray-500 truncate">{device.id}</p>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(device.status)}`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getStatusText(device.status)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Grouped list
  const devicesByType = devices.reduce((acc, device) => {
    if (!acc[device.type]) {
      acc[device.type] = [];
    }
    acc[device.type].push(device);
    return acc;
  }, {} as Record<DeviceType, Device[]>);

  const sortedTypes = Object.keys(devicesByType).sort((a, b) => {
    const labelA = getDeviceLabel(a as DeviceType);
    const labelB = getDeviceLabel(b as DeviceType);
    return labelA.localeCompare(labelB);
  }) as DeviceType[];

  if (sortedTypes.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">Нет устройств</p>;
  }

  return (
    <div className="space-y-2">
      {sortedTypes.map((deviceType) => {
        const devicesOfType = devicesByType[deviceType];
        const isExpanded = expandedGroups.has(deviceType);
        const Icon = getDeviceIcon(deviceType);
        const label = getDeviceLabel(deviceType);
        const isVisible = visibleDeviceTypes.has(deviceType);
        
        const onlineCount = devicesOfType.filter(d => d.status === 'online').length;
        const totalCount = devicesOfType.length;

        return (
          <div key={deviceType} className={`border rounded-lg ${isVisible ? 'bg-white' : 'bg-gray-50 opacity-50'}`}>
            {/* Group header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleGroup(deviceType)}
            >
              <div className="flex items-center gap-3 flex-1">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-gray-500">
                    {onlineCount}/{totalCount} в сети
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {totalCount}
              </Badge>
            </div>

            {/* Group devices */}
            {isExpanded && (
              <div className="border-t">
                <div className="p-2 space-y-1">
                  {devicesOfType.map((device) => {
                    const StatusIcon = getStatusIcon(device.status);

                    return (
                      <div
                        key={device.id}
                        className="flex items-start justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{device.name}</p>
                          <p className="text-xs text-gray-400 truncate">{device.id}</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <StatusIcon className={`w-3.5 h-3.5 ${getStatusColor(device.status)} flex-shrink-0 ml-2`} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {getStatusText(device.status)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}