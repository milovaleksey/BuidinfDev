import { DeviceType } from '../types';
import { DEVICE_GROUPS } from '../constants/devices';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DeviceTypeToggleIconsProps {
  visibleDeviceTypes: Set<DeviceType>;
  onToggleDeviceType: (deviceType: DeviceType) => void;
  compact?: boolean;
}

export function DeviceTypeToggleIcons({ 
  visibleDeviceTypes, 
  onToggleDeviceType,
  compact = false 
}: DeviceTypeToggleIconsProps) {
  
  // Обработчик клика по группе - переключает видимость всех устройств в группе
  const handleGroupToggle = (deviceTypes: DeviceType[]) => {
    // Проверяем, все ли устройства в группе видимы
    const allVisible = deviceTypes.every(type => visibleDeviceTypes.has(type));
    
    // Переключаем все устройства в группе
    deviceTypes.forEach(type => {
      // Если все видимы - скрываем все, иначе показываем все
      if (allVisible) {
        if (visibleDeviceTypes.has(type)) {
          onToggleDeviceType(type);
        }
      } else {
        if (!visibleDeviceTypes.has(type)) {
          onToggleDeviceType(type);
        }
      }
    });
  };
  
  // Проверка, видна ли группа (хотя бы одно устройство видимо)
  const isGroupVisible = (deviceTypes: DeviceType[]) => {
    return deviceTypes.some(type => visibleDeviceTypes.has(type));
  };
  
  // Проверка, все ли устройства в группе видимы
  const isGroupFullyVisible = (deviceTypes: DeviceType[]) => {
    return deviceTypes.every(type => visibleDeviceTypes.has(type));
  };

  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'flex-wrap'}`}>
      {DEVICE_GROUPS.map((group) => {
        const Icon = group.icon;
        const isVisible = isGroupVisible(group.deviceTypes);
        const isFullyVisible = isGroupFullyVisible(group.deviceTypes);

        return (
          <TooltipProvider key={group.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleGroupToggle(group.deviceTypes)}
                  className={`relative p-2.5 rounded-lg transition-all border-2 ${
                    isFullyVisible
                      ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' 
                      : isVisible
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-400 border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!isVisible && (
                    <>
                      {/* Diagonal line (slash) */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none" 
                        viewBox="0 0 100 100" 
                        preserveAspectRatio="none"
                      >
                        <line 
                          x1="0" 
                          y1="100" 
                          x2="100" 
                          y2="0" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          className="text-red-500"
                        />
                      </svg>
                    </>
                  )}
                  {/* Индикатор частичной видимости */}
                  {isVisible && !isFullyVisible && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-semibold">{group.label}</p>
                  <p className="text-xs text-gray-400">
                    {isFullyVisible 
                      ? 'Все видимы • Клик для скрытия' 
                      : isVisible
                      ? 'Частично видимы • Клик для показа всех'
                      : 'Скрыты • Клик для показа'
                    }
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}