import { Device } from '../types';

interface DeviceVisualProps {
  device: Device;
  x?: number;
  y?: number;
  scale?: number;
  interactive?: boolean;
}

export function DeviceVisual({ device, x, y, scale = 1, interactive = true }: DeviceVisualProps) {
  const baseSize = 30 * scale;
  const rotation = device.rotation || 0;
  const deviceScale = device.scale || 1; // Индивидуальный масштаб устройства
  const posX = x !== undefined ? x : device.position.x;
  const posY = y !== undefined ? y : device.position.y;

  // Wall AC (настенный кондиционер)
  if (device.type === 'wall_ac') {
    const isPowerOn = device.data?.isPowerOn || false;
    const targetTemp = device.data?.targetTemperature || 22;
    const workMode = device.data?.workMode || 'auto';
    const fanMode = device.data?.fanMode || 'auto';
    
    // Цвета в зависимости от режима работы
    let modeColor = '#9ca3af'; // off
    if (isPowerOn && device.status === 'online') {
      if (workMode === 'cool') modeColor = '#3b82f6'; // blue
      else if (workMode === 'heat') modeColor = '#ef4444'; // red
      else if (workMode === 'dry') modeColor = '#f59e0b'; // orange
      else if (workMode === 'fan') modeColor = '#10b981'; // green
      else modeColor = '#8b5cf6'; // purple for auto
    }
    
    const width = baseSize * 2.5;
    const height = baseSize * 1.2;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* AC body */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={4}
          fill={modeColor}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={isPowerOn ? 0.9 : 0.4}
        />
        
        {/* Ventilation slots */}
        {isPowerOn && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={width * 0.15}
                y1={height * 0.3 + i * 6}
                x2={width * 0.85}
                y2={height * 0.3 + i * 6}
                stroke="#1f2937"
                strokeWidth={1.5}
                opacity={0.6}
              />
            ))}
          </>
        )}
        
        {/* LED indicator */}
        <circle
          cx={width * 0.9}
          cy={height * 0.2}
          r={3}
          fill={isPowerOn ? '#10b981' : '#6b7280'}
        />
        
        {/* Temperature display */}
        {isPowerOn && device.status === 'online' && (
          <text
            x={width * 0.2}
            y={height * 0.75}
            fontSize="10"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
          >
            {targetTemp}°
          </text>
        )}
        
        {/* Fan mode indicator */}
        {isPowerOn && device.status === 'online' && (
          <g transform={`translate(${width * 0.5}, ${height * 0.7})`}>
            {fanMode === 'high' && (
              <>
                <circle cx={0} cy={0} r={2} fill="#ffffff" />
                <circle cx={6} cy={0} r={2} fill="#ffffff" />
                <circle cx={12} cy={0} r={2} fill="#ffffff" />
              </>
            )}
            {fanMode === 'medium' && (
              <>
                <circle cx={0} cy={0} r={2} fill="#ffffff" />
                <circle cx={6} cy={0} r={2} fill="#ffffff" />
              </>
            )}
            {fanMode === 'low' && (
              <circle cx={0} cy={0} r={2} fill="#ffffff" />
            )}
          </g>
        )}
        
        {/* Error indicator */}
        {device.status === 'offline' && (
          <>
            <line x1={5} y1={5} x2={width-5} y2={height-5} stroke="#dc2626" strokeWidth={3} />
            <line x1={width-5} y1={5} x2={5} y2={height-5} stroke="#dc2626" strokeWidth={3} />
          </>
        )}
        
        {device.status === 'warning' && (
          <text x={width/2} y={height/2 + 4} textAnchor="middle" fontSize="18" fill="#f59e0b">!</text>
        )}
      </g>
    );
  }

  // Cassette AC (кассетный кондиционер)
  if (device.type === 'cassette_ac') {
    const isPowerOn = device.data?.isPowerOn || false;
    const targetTemp = device.data?.targetTemperature || 22;
    const workMode = device.data?.workMode || 'auto';
    
    // Цвета в зависимости от режима работы
    let modeColor = '#9ca3af'; // off
    if (isPowerOn && device.status === 'online') {
      if (workMode === 'cool') modeColor = '#3b82f6'; // blue
      else if (workMode === 'heat') modeColor = '#ef4444'; // red
      else if (workMode === 'dry') modeColor = '#f59e0b'; // orange
      else if (workMode === 'fan') modeColor = '#10b981'; // green
      else modeColor = '#8b5cf6'; // purple for auto
    }
    
    const size = baseSize * 2;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size/2})`}>
        {/* Cassette body */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={3}
          fill={modeColor}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={isPowerOn ? 0.9 : 0.4}
        />
        
        {/* Inner grill pattern */}
        <rect
          x={size * 0.15}
          y={size * 0.15}
          width={size * 0.7}
          height={size * 0.7}
          rx={2}
          fill="none"
          stroke="#1f2937"
          strokeWidth={1.5}
          opacity={0.7}
        />
        
        {/* Cross pattern in center */}
        {isPowerOn && (
          <>
            <line
              x1={size * 0.15}
              y1={size * 0.5}
              x2={size * 0.85}
              y2={size * 0.5}
              stroke="#1f2937"
              strokeWidth={1.5}
              opacity={0.6}
            />
            <line
              x1={size * 0.5}
              y1={size * 0.15}
              x2={size * 0.5}
              y2={size * 0.85}
              stroke="#1f2937"
              strokeWidth={1.5}
              opacity={0.6}
            />
          </>
        )}
        
        {/* Diagonal ventilation lines in each quadrant */}
        {isPowerOn && (
          <>
            {/* Top-left quadrant */}
            <line x1={size * 0.2} y1={size * 0.25} x2={size * 0.4} y2={size * 0.25} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            <line x1={size * 0.2} y1={size * 0.35} x2={size * 0.4} y2={size * 0.35} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            
            {/* Top-right quadrant */}
            <line x1={size * 0.6} y1={size * 0.25} x2={size * 0.8} y2={size * 0.25} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            <line x1={size * 0.6} y1={size * 0.35} x2={size * 0.8} y2={size * 0.35} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            
            {/* Bottom-left quadrant */}
            <line x1={size * 0.2} y1={size * 0.65} x2={size * 0.4} y2={size * 0.65} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            <line x1={size * 0.2} y1={size * 0.75} x2={size * 0.4} y2={size * 0.75} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            
            {/* Bottom-right quadrant */}
            <line x1={size * 0.6} y1={size * 0.65} x2={size * 0.8} y2={size * 0.65} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
            <line x1={size * 0.6} y1={size * 0.75} x2={size * 0.8} y2={size * 0.75} stroke="#1f2937" strokeWidth={1} opacity={0.4} />
          </>
        )}
        
        {/* LED indicators in corners */}
        <circle cx={size * 0.9} cy={size * 0.1} r={2} fill={isPowerOn ? '#10b981' : '#6b7280'} />
        
        {/* Temperature display */}
        {isPowerOn && device.status === 'online' && (
          <text
            x={size * 0.5}
            y={size * 0.5 + 4}
            fontSize="12"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
          >
            {targetTemp}°
          </text>
        )}
        
        {/* Error indicator */}
        {device.status === 'offline' && (
          <>
            <line x1={5} y1={5} x2={size-5} y2={size-5} stroke="#dc2626" strokeWidth={3} />
            <line x1={size-5} y1={5} x2={5} y2={size-5} stroke="#dc2626" strokeWidth={3} />
          </>
        )}
        
        {device.status === 'warning' && (
          <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="18" fill="#f59e0b">!</text>
        )}
      </g>
    );
  }

  // Radiator (батарея) - вертикальные секции
  if (device.type === 'radiator') {
    const temp = device.data?.temperature || 20;
    const isHot = temp > 50;
    const color = isHot ? '#ef4444' : device.status === 'online' ? '#f97316' : '#9ca3af';
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, 17, ${baseSize/2})`}>
        {/* Radiator sections */}
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={i * 12}
            y={0}
            width={10}
            height={baseSize}
            rx={2}
            fill={color}
            stroke="#1f2937"
            strokeWidth={1}
          />
        ))}
        {/* Pipes */}
        <line x1={0} y1={5} x2={34} y2={5} stroke="#1f2937" strokeWidth={2} />
        <line x1={0} y1={baseSize - 5} x2={34} y2={baseSize - 5} stroke="#1f2937" strokeWidth={2} />
        
        {device.status === 'offline' && (
          <text x={17} y={baseSize / 2 + 4} textAnchor="middle" fontSize="20" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Door (дверь) - прямоугольник с дугой открывания
  if (device.type === 'door') {
    const isOpen = !device.data?.locked;
    const doorWidth = baseSize * 1.2;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${doorWidth/2}, 2)`}>
        {/* Door frame */}
        <rect
          x={-2}
          y={-2}
          width={doorWidth + 4}
          height={6}
          fill="#64748b"
          rx={1}
        />
        
        {/* Door */}
        <rect
          x={0}
          y={0}
          width={doorWidth}
          height={4}
          fill={isOpen ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={1}
        />
        
        {/* Opening arc */}
        {isOpen && (
          <path
            d={`M ${doorWidth} 2 A ${doorWidth} ${doorWidth} 0 0 1 ${doorWidth} ${doorWidth + 2}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.5}
          />
        )}
        
        {/* Lock indicator */}
        <circle
          cx={doorWidth - 5}
          cy={2}
          r={3}
          fill={isOpen ? '#10b981' : '#dc2626'}
        />
        
        {device.status === 'offline' && (
          <text x={doorWidth / 2} y={8} textAnchor="middle" fontSize="16" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Light fixture (светильник) - квадратик с цветом по интенсивности
  if (device.type === 'light_fixture') {
    const lightLevel = device.data?.lightLevel || 0;
    const size = baseSize * 1.3; // Увеличен с 0.8 до 1.3
    
    // Цвет в зависимости от яркости
    let fillColor = '#9ca3af'; // off
    if (device.status === 'online' && lightLevel > 0) {
      if (lightLevel > 80) {
        fillColor = '#fef08a'; // bright yellow
      } else if (lightLevel > 50) {
        fillColor = '#fde047'; // medium yellow
      } else if (lightLevel > 20) {
        fillColor = '#facc15'; // dim yellow
      } else {
        fillColor = '#eab308'; // very dim
      }
    }
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size/2})`}>
        {/* Light fixture body */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={5}
          fill={fillColor}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={lightLevel > 0 ? 0.9 : 0.5}
        />
        
        {/* Light rays when on */}
        {device.status === 'online' && lightLevel > 20 && (
          <>
            <line x1={size/2} y1={size} x2={size/2} y2={size + 10} stroke={fillColor} strokeWidth={2.5} opacity={0.6} />
            <line x1={size/2 - 8} y1={size} x2={size/2 - 12} y2={size + 10} stroke={fillColor} strokeWidth={2} opacity={0.4} />
            <line x1={size/2 + 8} y1={size} x2={size/2 + 12} y2={size + 10} stroke={fillColor} strokeWidth={2} opacity={0.4} />
          </>
        )}
        
        {/* Brightness indicator */}
        {device.status === 'online' && lightLevel > 0 && (
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="12" fill="#1f2937" fontWeight="bold">
            {Math.round(lightLevel)}
          </text>
        )}
        
        {/* Error cross */}
        {device.status === 'offline' && (
          <>
            <line x1={3} y1={3} x2={size-3} y2={size-3} stroke="#dc2626" strokeWidth={3} />
            <line x1={size-3} y1={3} x2={3} y2={size-3} stroke="#dc2626" strokeWidth={3} />
          </>
        )}
        
        {device.status === 'warning' && (
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="18" fill="#f59e0b">!</text>
        )}
      </g>
    );
  }

  // Temperature sensor - термометр
  if (device.type === 'temperature_sensor') {
    const temp = device.data?.temperature || 20;
    const color = temp > 25 ? '#ef4444' : temp < 18 ? '#3b82f6' : '#10b981';
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, 10, 10)`}>
        <circle cx={10} cy={10} r={8} fill={color} opacity={0.3} />
        <circle cx={10} cy={10} r={5} fill={color} />
        <text x={10} y={24} textAnchor="middle" fontSize="8" fill="#1f2937">
          {temp.toFixed(0)}°
        </text>
      </g>
    );
  }

  // CO2 sensor - датчик CO2
  if (device.type === 'co2_sensor') {
    const co2 = device.data?.co2 || 400;
    // Цвет зависит от уровня CO2
    let color = '#10b981'; // < 800 - отлично (зеленый)
    if (co2 > 2000) color = '#dc2626'; // > 2000 - критично (красный)
    else if (co2 > 1500) color = '#f97316'; // > 1500 - плохо (оранжевый)
    else if (co2 > 1000) color = '#f59e0b'; // > 1000 - удовлетворительно (желтый)
    else if (co2 > 800) color = '#84cc16'; // > 800 - хорошо (желто-зеленый)
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, 12, 12)`}>
        <rect x={0} y={0} width={24} height={24} rx={4} fill={color} opacity={0.3} />
        <rect x={4} y={4} width={16} height={16} rx={2} fill={color} opacity={0.7} />
        <text x={12} y={14} textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">
          CO₂
        </text>
        <text x={12} y={32} textAnchor="middle" fontSize="8" fill="#1f2937">
          {Math.round(co2)}
        </text>
      </g>
    );
  }

  // Street light (уличный светильник)
  if (device.type === 'street_light') {
    const lightLevel = device.data?.lightLevel || 0;
    const size = baseSize * 1.5;
    
    // Цвет в зависимости от яркости
    let fillColor = '#9ca3af'; // off
    if (device.status === 'online' && lightLevel > 0) {
      if (lightLevel > 80) {
        fillColor = '#fef08a'; // bright yellow
      } else if (lightLevel > 50) {
        fillColor = '#fde047'; // medium yellow
      } else if (lightLevel > 20) {
        fillColor = '#facc15'; // dim yellow
      } else {
        fillColor = '#eab308'; // very dim
      }
    }
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size/2})`}>
        {/* Pole */}
        <rect
          x={size/2 - 2}
          y={size}
          width={4}
          height={size * 0.8}
          fill="#64748b"
          stroke="#1f2937"
          strokeWidth={1}
        />
        
        {/* Light head */}
        <circle
          cx={size/2}
          cy={size/2}
          r={size/2}
          fill={fillColor}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={lightLevel > 0 ? 0.9 : 0.5}
        />
        
        {/* Light rays when on */}
        {device.status === 'online' && lightLevel > 20 && (
          <>
            <line x1={size/2} y1={size} x2={size/2} y2={size + 15} stroke={fillColor} strokeWidth={3} opacity={0.6} />
            <line x1={size/2 - 10} y1={size} x2={size/2 - 15} y2={size + 15} stroke={fillColor} strokeWidth={2} opacity={0.4} />
            <line x1={size/2 + 10} y1={size} x2={size/2 + 15} y2={size + 15} stroke={fillColor} strokeWidth={2} opacity={0.4} />
          </>
        )}
        
        {device.status === 'offline' && (
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="20" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Turnstile (полноростовой турникет)
  if (device.type === 'turnstile') {
    const isOpen = device.data?.isOpen || false;
    const size = baseSize * 1.8;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size/2})`}>
        {/* Outer frame */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={4}
          fill={isOpen ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={0.6}
        />
        
        {/* Inner space */}
        <rect
          x={size * 0.15}
          y={size * 0.15}
          width={size * 0.7}
          height={size * 0.7}
          fill="#374151"
          opacity={0.5}
        />
        
        {/* Rotating barriers */}
        {!isOpen && (
          <>
            <line x1={size/2} y1={size * 0.15} x2={size/2} y2={size * 0.85} stroke="#1f2937" strokeWidth={3} />
            <line x1={size * 0.15} y1={size/2} x2={size * 0.85} y2={size/2} stroke="#1f2937" strokeWidth={3} />
          </>
        )}
        
        {/* Status indicator */}
        <circle
          cx={size/2}
          cy={size/2}
          r={4}
          fill={isOpen ? '#10b981' : '#dc2626'}
        />
        
        {device.status === 'offline' && (
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="18" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Tripod turnstile (тумбовый турникет)
  if (device.type === 'tripod_turnstile') {
    const isOpen = device.data?.isOpen || false;
    const size = baseSize * 1.3;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size/2})`}>
        {/* Base */}
        <circle
          cx={size/2}
          cy={size/2}
          r={size/2}
          fill={isOpen ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={0.7}
        />
        
        {/* Tripod arms (when closed) */}
        {!isOpen && (
          <>
            <line x1={size/2} y1={size/2} x2={size/2} y2={size * 0.1} stroke="#1f2937" strokeWidth={2.5} />
            <line x1={size/2} y1={size/2} x2={size * 0.8} y2={size * 0.7} stroke="#1f2937" strokeWidth={2.5} />
            <line x1={size/2} y1={size/2} x2={size * 0.2} y2={size * 0.7} stroke="#1f2937" strokeWidth={2.5} />
          </>
        )}
        
        {/* Center hub */}
        <circle
          cx={size/2}
          cy={size/2}
          r={5}
          fill="#1f2937"
        />
        
        {/* Status LED */}
        <circle
          cx={size/2}
          cy={size/2}
          r={2}
          fill={isOpen ? '#10b981' : '#dc2626'}
        />
        
        {device.status === 'offline' && (
          <text x={size/2} y={size + 10} textAnchor="middle" fontSize="14" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Barrier (шлагбаум)
  if (device.type === 'barrier') {
    const isOpen = device.data?.isOpen || false;
    const width = baseSize * 3;
    const height = baseSize * 1.5;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* Base */}
        <rect
          x={0}
          y={height * 0.5}
          width={width * 0.2}
          height={height * 0.5}
          fill="#64748b"
          stroke="#1f2937"
          strokeWidth={2}
        />
        
        {/* Barrier arm */}
        <g transform={isOpen ? `rotate(-90, ${width * 0.1}, ${height * 0.5})` : ''}>
          <rect
            x={width * 0.1}
            y={height * 0.4}
            width={width * 0.7}
            height={height * 0.2}
            fill={isOpen ? '#10b981' : '#ef4444'}
            stroke="#1f2937"
            strokeWidth={2}
          />
          
          {/* Stripes */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={width * 0.1 + i * (width * 0.175)}
              y={height * 0.4}
              width={width * 0.0875}
              height={height * 0.2}
              fill="#ffffff"
              opacity={0.7}
            />
          ))}
        </g>
        
        {/* Status LED */}
        <circle
          cx={width * 0.1}
          cy={height * 0.7}
          r={3}
          fill={isOpen ? '#10b981' : '#dc2626'}
        />
        
        {device.status === 'offline' && (
          <text x={width/2} y={height + 10} textAnchor="middle" fontSize="16" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Gate (ворота)
  if (device.type === 'gate') {
    const isOpen = device.data?.isOpen || false;
    const width = baseSize * 3.5;
    const height = baseSize * 2;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* Left gate panel */}
        <rect
          x={isOpen ? -width * 0.3 : 0}
          y={0}
          width={width * 0.48}
          height={height}
          fill={isOpen ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={0.8}
        />
        
        {/* Right gate panel */}
        <rect
          x={isOpen ? width * 0.82 : width * 0.52}
          y={0}
          width={width * 0.48}
          height={height}
          fill={isOpen ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={0.8}
        />
        
        {/* Vertical bars on panels */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1={isOpen ? -width * 0.3 + i * (width * 0.12) + width * 0.08 : i * (width * 0.12) + width * 0.08}
              y1={height * 0.1}
              x2={isOpen ? -width * 0.3 + i * (width * 0.12) + width * 0.08 : i * (width * 0.12) + width * 0.08}
              y2={height * 0.9}
              stroke="#1f2937"
              strokeWidth={2}
            />
            <line
              x1={isOpen ? width * 0.82 + i * (width * 0.12) + width * 0.08 : width * 0.52 + i * (width * 0.12) + width * 0.08}
              y1={height * 0.1}
              x2={isOpen ? width * 0.82 + i * (width * 0.12) + width * 0.08 : width * 0.52 + i * (width * 0.12) + width * 0.08}
              y2={height * 0.9}
              stroke="#1f2937"
              strokeWidth={2}
            />
          </g>
        ))}
        
        {/* Status indicator */}
        <circle
          cx={width/2}
          cy={height * 0.1}
          r={4}
          fill={isOpen ? '#10b981' : '#dc2626'}
        />
        
        {device.status === 'offline' && (
          <text x={width/2} y={height/2 + 5} textAnchor="middle" fontSize="18" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Air curtain (тепловая завеса)
  if (device.type === 'air_curtain') {
    const isPowerOn = device.data?.curtainPowerOn || false;
    const curtainTemp = device.data?.curtainTemperature || 25;
    const width = baseSize * 3;
    const height = baseSize * 0.8;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* Curtain body */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={3}
          fill={isPowerOn ? '#f97316' : '#9ca3af'}
          stroke="#1f2937"
          strokeWidth={2}
          opacity={isPowerOn ? 0.9 : 0.5}
        />
        
        {/* Air vents */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={width * 0.1 + i * (width * 0.133)}
            y={height * 0.2}
            width={width * 0.08}
            height={height * 0.6}
            fill="#1f2937"
            opacity={0.4}
          />
        ))}
        
        {/* Air flow indicator (when on) */}
        {isPowerOn && (
          <>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={width * 0.2}
                y1={height + 5 + i * 8}
                x2={width * 0.2}
                y2={height + 10 + i * 8}
                stroke="#f97316"
                strokeWidth={2}
                opacity={0.7 - i * 0.2}
              />
            ))}
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={width * 0.5}
                y1={height + 5 + i * 8}
                x2={width * 0.5}
                y2={height + 10 + i * 8}
                stroke="#f97316"
                strokeWidth={2}
                opacity={0.7 - i * 0.2}
              />
            ))}
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={width * 0.8}
                y1={height + 5 + i * 8}
                x2={width * 0.8}
                y2={height + 10 + i * 8}
                stroke="#f97316"
                strokeWidth={2}
                opacity={0.7 - i * 0.2}
              />
            ))}
          </>
        )}
        
        {/* Temperature indicator */}
        {isPowerOn && device.status === 'online' && (
          <text
            x={width * 0.9}
            y={height * 0.6}
            fontSize="9"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="end"
          >
            {curtainTemp}°
          </text>
        )}
        
        {/* Power LED */}
        <circle
          cx={width * 0.05}
          cy={height * 0.3}
          r={2}
          fill={isPowerOn ? '#10b981' : '#6b7280'}
        />
        
        {device.status === 'offline' && (
          <text x={width/2} y={height/2 + 4} textAnchor="middle" fontSize="14" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Camera - камера
  if (device.type === 'camera') {
    const recording = device.data?.recording || false;
    const size = baseSize * 2;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${size/2}, ${size * 0.5})`}>
        {/* Camera body - корпус */}
        <rect
          x={0}
          y={size * 0.2}
          width={size * 0.65}
          height={size * 0.6}
          rx={8}
          fill={device.status === 'online' ? '#1f2937' : '#6b7280'}
          stroke={device.status === 'online' ? '#374151' : '#9ca3af'}
          strokeWidth={3}
        />
        
        {/* Inner screen/lens area */}
        <rect
          x={size * 0.05}
          y={size * 0.27}
          width={size * 0.55}
          height={size * 0.46}
          rx={6}
          fill={device.status === 'online' ? '#3b82f6' : '#4b5563'}
          opacity={0.4}
        />
        
        {/* Lens triangle - треугольная линза */}
        <path
          d={`
            M ${size * 0.65} ${size * 0.35}
            L ${size * 0.95} ${size * 0.25}
            L ${size * 0.95} ${size * 0.75}
            L ${size * 0.65} ${size * 0.65}
            Z
          `}
          fill={device.status === 'online' ? '#1f2937' : '#6b7280'}
          stroke={device.status === 'online' ? '#374151' : '#9ca3af'}
          strokeWidth={3}
          strokeLinejoin="miter"
        />
        
        {/* Lens triangle inner */}
        <path
          d={`
            M ${size * 0.65} ${size * 0.4}
            L ${size * 0.88} ${size * 0.32}
            L ${size * 0.88} ${size * 0.68}
            L ${size * 0.65} ${size * 0.6}
            Z
          `}
          fill={device.status === 'online' ? '#374151' : '#6b7280'}
          opacity={0.5}
        />
        
        {/* Recording indicator */}
        {recording && device.status === 'online' && (
          <circle
            cx={size * 0.1}
            cy={size * 0.3}
            r={4}
            fill="#ef4444"
          >
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        
        {/* Recording text */}
        {recording && device.status === 'online' && (
          <text
            x={size * 0.1}
            y={size * 0.15}
            fontSize="7"
            fill="#ef4444"
            textAnchor="middle"
            fontWeight="bold"
          >
            REC
          </text>
        )}
        
        {device.status === 'offline' && (
          <text x={size * 0.5} y={size * 0.55} textAnchor="middle" fontSize="18" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Projector (проектор) - вид сверху
  if (device.type === 'projector') {
    const isPowerOn = device.data?.isPowerOn || false;
    const brightness = device.data?.brightness || 50;
    const width = baseSize * 2;
    const height = baseSize * 1.5;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* Main projector body (основной корпус) */}
        <rect
          x={width * 0.1}
          y={0}
          width={width * 0.75}
          height={height}
          rx={3}
          fill={isPowerOn ? '#374151' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
        />
        
        {/* Lens housing (выступающая часть объектива) */}
        <rect
          x={width * 0.85}
          y={height * 0.3}
          width={width * 0.15}
          height={height * 0.4}
          rx={2}
          fill={isPowerOn ? '#374151' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth={2}
        />
        
        {/* Lens glass (стекло объектива) */}
        <rect
          x={width * 0.87}
          y={height * 0.35}
          width={width * 0.11}
          height={height * 0.3}
          rx={1}
          fill={isPowerOn ? '#60a5fa' : '#4b5563'}
          stroke="#1f2937"
          strokeWidth={1}
          opacity={isPowerOn ? 0.8 : 0.4}
        />
        
        {/* Ventilation grilles (вентиляционные решетки сверху) */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`vent-${i}`}
            x1={width * 0.2}
            y1={height * 0.2 + i * (height * 0.15)}
            x2={width * 0.7}
            y2={height * 0.2 + i * (height * 0.15)}
            stroke="#1f2937"
            strokeWidth={1.5}
            opacity={0.4}
          />
        ))}
        
        {/* Power indicator LED */}
        <circle
          cx={width * 0.75}
          cy={height * 0.15}
          r={3}
          fill={isPowerOn ? '#10b981' : '#ef4444'}
        />
        
        {/* Projection cone (конус проекции при включении) */}
        {isPowerOn && device.status === 'online' && (
          <path
            d={`M ${width * 0.93} ${height * 0.4} L ${width * 1.4} ${height * 0.1} L ${width * 1.4} ${height * 0.9} L ${width * 0.93} ${height * 0.6} Z`}
            fill="#fbbf24"
            opacity={brightness / 300}
            stroke="#fbbf24"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        )}
        
        {device.status === 'offline' && (
          <text x={width * 0.5} y={height * 0.6} textAnchor="middle" fontSize="18" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // TV (телевизор) - вид сверху
  if (device.type === 'tv') {
    const isPowerOn = device.data?.isPowerOn || false;
    const volume = device.data?.volume || 50;
    const muted = device.data?.muted || false;
    const input = device.data?.input || 'HDMI1';
    const width = baseSize * 2.5;
    const height = baseSize * 1.6;
    
    return (
      <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, ${width/2}, ${height/2})`}>
        {/* TV back panel (задняя панель) */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={3}
          fill="#1f2937"
          stroke="#000000"
          strokeWidth={2.5}
        />
        
        {/* Screen area (область экрана - тоньше рамка) */}
        <rect
          x={width * 0.08}
          y={height * 0.08}
          width={width * 0.84}
          height={height * 0.84}
          rx={2}
          fill={isPowerOn ? '#3b82f6' : '#374151'}
          opacity={isPowerOn ? 0.7 : 0.3}
        />
        
        {/* Stand base (подставка) */}
        <rect
          x={width * 0.35}
          y={height * 0.88}
          width={width * 0.3}
          height={height * 0.12}
          rx={1}
          fill="#64748b"
          stroke="#1f2937"
          strokeWidth={1}
        />
        
        {/* Power LED */}
        <circle
          cx={width * 0.5}
          cy={height * 0.05}
          r={2.5}
          fill={isPowerOn ? '#10b981' : '#dc2626'}
        />
        
        {/* Input indicator */}
        {isPowerOn && device.status === 'online' && (
          <text
            x={width * 0.2}
            y={height * 0.25}
            fontSize="8"
            fill="#ffffff"
            opacity={0.9}
            fontWeight="bold"
          >
            {input}
          </text>
        )}
        
        {/* Volume indicator */}
        {isPowerOn && device.status === 'online' && (
          <g transform={`translate(${width * 0.8}, ${height * 0.5})`}>
            {muted ? (
              <text x={0} y={4} fontSize="12" fill="#ef4444">🔇</text>
            ) : (
              <>
                <rect x={-6} y={-2} width={2} height={4} fill="#ffffff" opacity={volume > 20 ? 0.9 : 0.3} />
                <rect x={-3} y={-4} width={2} height={8} fill="#ffffff" opacity={volume > 50 ? 0.9 : 0.3} />
                <rect x={0} y={-6} width={2} height={12} fill="#ffffff" opacity={volume > 80 ? 0.9 : 0.3} />
              </>
            )}
          </g>
        )}
        
        {/* Center play icon when on */}
        {isPowerOn && device.status === 'online' && (
          <polygon
            points={`${width * 0.45},${height * 0.4} ${width * 0.45},${height * 0.6} ${width * 0.6},${height * 0.5}`}
            fill="#ffffff"
            opacity={0.4}
          />
        )}
        
        {device.status === 'offline' && (
          <text x={width/2} y={height/2 + 4} textAnchor="middle" fontSize="16" fill="#dc2626">✕</text>
        )}
      </g>
    );
  }

  // Default - simple circle
  return (
    <g transform={`translate(${posX}, ${posY}) scale(${deviceScale}) rotate(${rotation}, 10, 10)`}>
      <circle 
        cx={10} 
        cy={10} 
        r={6} 
        fill={device.status === 'online' ? '#10b981' : '#ef4444'} 
        opacity={0.8}
      />
    </g>
  );
}