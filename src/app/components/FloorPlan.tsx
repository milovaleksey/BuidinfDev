import { Room, DeviceType, Device } from '../types';
import { DeviceVisual } from './DeviceVisual';
import { DeviceContextMenu } from './DeviceContextMenu';
import { CameraViewer } from './CameraViewer';
import { useState, useRef, useEffect } from 'react';

interface FloorPlanProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  scale?: number;
  visibleDeviceTypes?: Set<DeviceType>;
  showDevices?: boolean;
  backgroundImage?: string;
  backgroundOpacity?: number;
  onPanOffsetChange?: (offset: { x: number; y: number }) => void;
  externalPanOffset?: { x: number; y: number };
}

export function FloorPlan({ 
  rooms, 
  selectedRoomId, 
  onRoomClick, 
  scale = 1,
  visibleDeviceTypes,
  showDevices = true,
  backgroundImage,
  backgroundOpacity = 0.3,
  onPanOffsetChange,
  externalPanOffset
}: FloorPlanProps) {
  const canvasWidth = 1400;
  const canvasHeight = 800;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState(externalPanOffset || { x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Состояние для контекстного меню
  const [contextMenu, setContextMenu] = useState<{
    device?: any;
    room?: Room;
    position: { x: number; y: number };
  } | null>(null);

  // Состояние для просмотра камеры
  const [selectedCamera, setSelectedCamera] = useState<Device | null>(null);
  
  // Update internal state when external offset changes
  useEffect(() => {
    if (externalPanOffset) {
      setPanOffset(externalPanOffset);
    }
  }, [externalPanOffset]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsPanning(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - startPan.x;
        const dy = e.clientY - startPan.y;
        let newPanOffset = { x: 0, y: 0 };
        setPanOffset(prev => {
          newPanOffset = {
            x: prev.x + dx,
            y: prev.y + dy
          };
          return newPanOffset;
        });
        setStartPan({ x: e.clientX, y: e.clientY });
        if (onPanOffsetChange) {
          onPanOffsetChange(newPanOffset);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPanning, startPan, onPanOffsetChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Right mouse button (button 2) or middle button (button 1)
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
  };
  
  // Обработка правого клика на устройстве
  const handleDeviceContextMenu = (e: React.MouseEvent, device: any, room: Room) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Если это камера - сразу открываем просмотр видео
    if (device.type === 'camera') {
      setSelectedCamera(device);
      return;
    }
    
    // Для остальных устройств показываем контекстное меню
    setContextMenu({
      device,
      room,
      position: { x: e.clientX + 10, y: e.clientY + 10 }
    });
  };
  
  // Обработка правого клика на помещении (пустое место)
  const handleRoomContextMenu = (e: React.MouseEvent, room: Room) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, что кл��к был не по устройству
    const target = e.target as SVGElement;
    if (target.tagName === 'rect' || target.tagName === 'polygon') {
      setContextMenu({
        room,
        position: { x: e.clientX + 10, y: e.clientY + 10 }
      });
    }
  };
  
  // Закрытие контекстного меню
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        // Проверяем, что клик был не внутри контекстного меню
        const target = e.target as HTMLElement;
        const contextMenuElement = document.querySelector('[data-context-menu]');
        
        // Проверяем, не является ли клик частью Radix UI портала (Select, Dialog и т.д.)
        const isRadixPortal = target.closest('[data-radix-popper-content-wrapper]') || 
                              target.closest('[role="listbox"]') ||
                              target.closest('[role="option"]') ||
                              target.closest('[data-radix-select-content]') ||
                              target.closest('[data-radix-portal]');
        
        if (contextMenuElement && !contextMenuElement.contains(target) && !isRadixPortal) {
          setContextMenu(null);
        }
      }
    };
    
    if (contextMenu) {
      // Небольшая задержка, чтобы избежать немедленного закрытия
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const getRoomColor = (room: Room) => {
    switch (room.type) {
      case 'office':
        return 'fill-blue-100 stroke-blue-400';
      case 'meeting':
        return 'fill-purple-100 stroke-purple-400';
      case 'corridor':
        return 'fill-gray-100 stroke-gray-400';
      case 'storage':
        return 'fill-orange-100 stroke-orange-400';
      case 'bathroom':
        return 'fill-cyan-100 stroke-cyan-400';
      case 'kitchen':
        return 'fill-green-100 stroke-green-400';
      case 'lobby':
        return 'fill-yellow-100 stroke-yellow-400';
      case 'technical':
        return 'fill-red-100 stroke-red-400';
      default:
        return 'fill-slate-100 stroke-slate-400';
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-auto bg-gray-50 rounded-lg border"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Hint */}
      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border text-xs text-gray-600">
        💡 ПКМ: перемещение плана | ПКМ по устройству: управление
      </div>
      
      <svg
        width={canvasWidth * scale}
        height={canvasHeight * scale}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="mx-auto"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'top left',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Background image */}
        {backgroundImage && (
          <image
            href={backgroundImage}
            x="0"
            y="0"
            width={canvasWidth}
            height={canvasHeight}
            opacity={backgroundOpacity}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

        {/* Rooms */}
        {rooms.map((room) => {
          const isSelected = selectedRoomId === room.id;
          const colorClass = getRoomColor(room);
          const isLocked = room.locked;

          if (room.polygon && room.polygon.length > 0) {
            // Polygon room
            const points = room.polygon
              .map((p) => `${room.position.x + p.x},${room.position.y + p.y}`)
              .join(' ');

            return (
              <g key={room.id}>
                <polygon
                  points={points}
                  className={`${colorClass} ${isSelected ? 'stroke-[3] opacity-90' : 'stroke-[2] opacity-70'} ${
                    onRoomClick ? 'cursor-pointer hover:opacity-100' : ''
                  } transition-opacity`}
                  onClick={() => onRoomClick?.(room.id)}
                  onContextMenu={(e) => handleRoomContextMenu(e, room)}
                />
                {isLocked && (
                  <text
                    x={room.position.x + 10}
                    y={room.position.y + 20}
                    fontSize="12"
                    fill="red"
                    fontWeight="bold"
                  >
                    🔒
                  </text>
                )}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + (isLocked ? 40 : 20)}
                  fontSize="12"
                  fill="#1f2937"
                  fontWeight="600"
                >
                  {room.name}
                </text>
                <text
                  x={room.position.x + 10}
                  y={room.position.y + (isLocked ? 55 : 35)}
                  fontSize="10"
                  fill="#6b7280"
                >
                  {room.number}
                </text>

                {/* Devices */}
                {showDevices && room.devices.map((device) => {
                  if (visibleDeviceTypes && !visibleDeviceTypes.has(device.type)) {
                    return null;
                  }

                  const deviceX = room.position.x + (device.position?.x || 0);
                  const deviceY = room.position.y + (device.position?.y || 0);

                  return (
                    <g 
                      key={device.id} 
                      transform={`translate(${deviceX}, ${deviceY})`}
                      onContextMenu={(e) => handleDeviceContextMenu(e, device, room)}
                      style={{ cursor: 'pointer' }}
                    >
                      <DeviceVisual
                        device={device}
                        x={0}
                        y={0}
                        interactive={false}
                      />
                    </g>
                  );
                })}
              </g>
            );
          } else {
            // Rectangle room
            const { width, height } = room.dimensions;

            return (
              <g key={room.id}>
                <rect
                  x={room.position.x}
                  y={room.position.y}
                  width={width}
                  height={height}
                  className={`${colorClass} ${isSelected ? 'stroke-[3] opacity-90' : 'stroke-[2] opacity-70'} ${
                    onRoomClick ? 'cursor-pointer hover:opacity-100' : ''
                  } transition-opacity`}
                  rx="8"
                  onClick={() => onRoomClick?.(room.id)}
                  onContextMenu={(e) => handleRoomContextMenu(e, room)}
                />
                {isLocked && (
                  <text
                    x={room.position.x + 10}
                    y={room.position.y + 20}
                    fontSize="12"
                    fill="red"
                    fontWeight="bold"
                  >
                    🔒
                  </text>
                )}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + (isLocked ? 40 : 20)}
                  fontSize="12"
                  fill="#1f2937"
                  fontWeight="600"
                >
                  {room.name}
                </text>
                <text
                  x={room.position.x + 10}
                  y={room.position.y + (isLocked ? 55 : 35)}
                  fontSize="10"
                  fill="#6b7280"
                >
                  {room.number}
                </text>

                {/* Devices */}
                {showDevices && room.devices.map((device) => {
                  if (visibleDeviceTypes && !visibleDeviceTypes.has(device.type)) {
                    return null;
                  }

                  const deviceX = room.position.x + (device.position?.x || 0);
                  const deviceY = room.position.y + (device.position?.y || 0);

                  return (
                    <g 
                      key={device.id} 
                      transform={`translate(${deviceX}, ${deviceY})`}
                      onContextMenu={(e) => handleDeviceContextMenu(e, device, room)}
                      style={{ cursor: 'pointer' }}
                    >
                      <DeviceVisual
                        device={device}
                        x={0}
                        y={0}
                        interactive={false}
                      />
                    </g>
                  );
                })}
              </g>
            );
          }
        })}
      </svg>
      
      {/* Context Menu */}
      {contextMenu && (
        <DeviceContextMenu
          device={contextMenu.device}
          room={contextMenu.room}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}
      
      {/* Camera Viewer */}
      {selectedCamera && (
        <CameraViewer
          device={selectedCamera}
          isOpen={true}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
}