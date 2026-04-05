import { Device, DeviceType, Room } from '../types';
import { useState } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { mqttService } from '../services/MockMQTTService';
import { Lightbulb, DoorOpen, Video, Wind, Droplet, Thermometer, Activity, X, Projector, Tv, Volume2, VolumeX, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { CameraViewer } from './CameraViewer';

interface DeviceContextMenuProps {
  device?: Device;
  room?: Room;
  position: { x: number; y: number };
  onClose: () => void;
}

export function DeviceContextMenu({ device, room, position, onClose }: DeviceContextMenuProps) {
  // Состояния для различных типов устройств
  const [lightLevel, setLightLevel] = useState<number>(device?.data?.lightLevel || 100);
  const [doorMode, setDoorMode] = useState<string>(device?.data?.mode || 'control');
  const [recording, setRecording] = useState<boolean>(device?.data?.recording || false);
  const [isPowerOn, setIsPowerOn] = useState<boolean>(device?.data?.isPowerOn || false);
  const [fanMode, setFanMode] = useState<string>(device?.data?.fanMode || 'auto');
  const [workMode, setWorkMode] = useState<string>(device?.data?.workMode || 'cool');
  const [targetTemperature, setTargetTemperature] = useState<number>(device?.data?.targetTemperature || 22);
  const [thermostatSetting, setThermostatSetting] = useState<number>(device?.data?.thermostatSetting || 50);
  const [curtainPowerOn, setCurtainPowerOn] = useState<boolean>(device?.data?.curtainPowerOn || false);
  const [curtainTemperature, setCurtainTemperature] = useState<number>(device?.data?.curtainTemperature || 30);
  const [curtainFanSpeed, setCurtainFanSpeed] = useState<string>(device?.data?.fanSpeed || 'medium');
  const [brightness, setBrightness] = useState<number>(device?.data?.brightness || 100);
  const [volume, setVolume] = useState<number>(device?.data?.volume || 50);
  const [muted, setMuted] = useState<boolean>(device?.data?.muted || false);
  const [input, setInput] = useState<string>(device?.data?.input || 'HDMI1');
  const [showCameraViewer, setShowCameraViewer] = useState(false);

  // Функция отправки команды в MQTT
  const sendCommand = (deviceId: string, deviceType: DeviceType, command: any) => {
    if (device?.mqttTopic) {
      const setTopic = device.mqttTopic.replace('/State', '/Set');
      mqttService.publish(setTopic, command);
    }
  };

  // Функция управления всеми устройствами в помещении
  const controlRoomDevices = (deviceType: DeviceType, command: any) => {
    if (!room) return;
    
    const devicesOfType = room.devices.filter(d => d.type === deviceType);
    devicesOfType.forEach(d => {
      if (d.mqttTopic) {
        const setTopic = d.mqttTopic.replace('/State', '/Set');
        mqttService.publish(setTopic, command);
      }
    });
  };

  // Рендер контролов для светильников
  const renderLightingControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <span className="font-semibold text-sm">
          {device ? device.name : 'Освещение в помещении'}
        </span>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Яркость: {lightLevel}%</Label>
        <Slider
          value={[lightLevel]}
          onValueChange={(value) => setLightLevel(value[0])}
          onValueCommit={(value) => {
            const command = { lightLevel: value[0] };
            if (device) {
              sendCommand(device.id, device.type, command);
            } else if (room) {
              // Управление всеми светильниками в помещен��и
              controlRoomDevices('light_fixture', command);
              controlRoomDevices('street_light', command);
            }
          }}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setLightLevel(0);
              const command = { lightLevel: 0 };
              if (device) {
                sendCommand(device.id, device.type, command);
              } else if (room) {
                controlRoomDevices('light_fixture', command);
                controlRoomDevices('street_light', command);
              }
            }}
          >
            Выкл
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setLightLevel(50);
              const command = { lightLevel: 50 };
              if (device) {
                sendCommand(device.id, device.type, command);
              } else if (room) {
                controlRoomDevices('light_fixture', command);
                controlRoomDevices('street_light', command);
              }
            }}
          >
            50%
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setLightLevel(100);
              const command = { lightLevel: 100 };
              if (device) {
                sendCommand(device.id, device.type, command);
              } else if (room) {
                controlRoomDevices('light_fixture', command);
                controlRoomDevices('street_light', command);
              }
            }}
          >
            100%
          </Button>
        </div>
      </div>
    </div>
  );

  // Рендер контролов для дверей, турникетов, ворот
  const renderAccessControlControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <DoorOpen className="w-4 h-4 text-blue-500" />
        <span className="font-semibold text-sm">{device?.name}</span>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Режим работы</Label>
        <div className="grid grid-cols-2 gap-1">
          {[
            { value: 'office', label: 'Офисный' },
            { value: 'control', label: 'Контроль' },
            { value: 'open', label: 'Открыто' },
            { value: 'closed', label: 'Закрыто' },
          ].map((mode) => (
            <Button
              key={mode.value}
              size="sm"
              variant={doorMode === mode.value ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => {
                setDoorMode(mode.value);
                if (device) {
                  sendCommand(device.id, device.type, { mode: mode.value });
                }
              }}
            >
              {mode.label}
            </Button>
          ))}
        </div>
        <div className="pt-2 space-y-1 text-xs text-gray-600 border-t">
          <p><strong>Офисный:</strong> Свободный вход, контроль выхода</p>
          <p><strong>Контроль:</strong> Авторизация входа и выхода</p>
          <p><strong>Открыто:</strong> Свободный проход</p>
          <p><strong>Закрыто:</strong> Проход заблокирован</p>
        </div>
      </div>
      {device?.data && (
        <div className="flex gap-2 pt-2 border-t">
          <Badge variant={device.data.isOpen ? "default" : "secondary"} className="text-xs">
            {device.data.isOpen ? 'О��крыто' : 'Закрыто'}
          </Badge>
          <Badge variant={device.data.isOnControl ? "default" : "secondary"} className="text-xs">
            {device.data.isOnControl ? 'На контроле' : 'Без контроля'}
          </Badge>
        </div>
      )}
    </div>
  );

  // Рендер контролов для видеокамер
  const renderCameraControls = () => (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-sm">{device?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Запись</Label>
          <Switch
            checked={recording}
            onCheckedChange={(checked) => {
              setRecording(checked);
              if (device) {
                sendCommand(device.id, device.type, { recording: checked });
              }
            }}
          />
        </div>
        {device?.data?.streamUrl && (
          <div className="pt-2 border-t">
            <Label className="text-xs text-gray-600">Поток видео</Label>
            <p className="text-xs text-gray-500 break-all mt-1">{device.data.streamUrl}</p>
          </div>
        )}
        <Badge variant={device?.status === 'online' ? "default" : "secondary"} className="text-xs">
          {device?.status === 'online' ? 'В сети' : 'Не в сети'}
        </Badge>
        {device?.data?.streamUrl && (
          <div className="pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setShowCameraViewer(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Просмотр видео
            </Button>
          </div>
        )}
      </div>
      {device && (
        <CameraViewer
          device={device}
          isOpen={showCameraViewer}
          onClose={() => setShowCameraViewer(false)}
        />
      )}
    </>
  );

  // Рендер контролов для кондиционеров
  const renderACControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Wind className="w-4 h-4 text-cyan-500" />
        <span className="font-semibold text-sm">{device?.name}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <Label className="text-xs">Питание</Label>
        <Switch
          checked={isPowerOn}
          onCheckedChange={(checked) => {
            setIsPowerOn(checked);
            if (device) {
              sendCommand(device.id, device.type, { isPowerOn: checked });
            }
          }}
        />
      </div>

      {isPowerOn && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Режим работы</Label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 'cool', label: 'Охлаждение' },
                { value: 'heat', label: 'Обогрев' },
                { value: 'fan', label: 'Вентиляция' },
                { value: 'dry', label: 'Осушение' },
                { value: 'auto', label: 'Авто' },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  size="sm"
                  variant={workMode === mode.value ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => {
                    setWorkMode(mode.value);
                    if (device) {
                      sendCommand(device.id, device.type, { workMode: mode.value });
                    }
                  }}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Скорость вентилятора</Label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 'auto', label: 'Авто' },
                { value: 'low', label: 'Низкая' },
                { value: 'medium', label: 'Средняя' },
                { value: 'high', label: 'Высокая' },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  size="sm"
                  variant={fanMode === mode.value ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => {
                    setFanMode(mode.value);
                    if (device) {
                      sendCommand(device.id, device.type, { fanMode: mode.value });
                    }
                  }}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Температура: {targetTemperature}°C</Label>
            <Slider
              value={[targetTemperature]}
              onValueChange={(value) => setTargetTemperature(value[0])}
              onValueCommit={(value) => {
                if (device) {
                  sendCommand(device.id, device.type, { targetTemperature: value[0] });
                }
              }}
              min={16}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        </>
      )}

      {device?.data?.currentTemperature && (
        <div className="pt-2 border-t">
          <Badge variant="secondary" className="text-xs">
            Текущая: {device.data.currentTemperature}°C
          </Badge>
        </div>
      )}
    </div>
  );

  // Рендер контролов для радиаторов
  const renderRadiatorControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Droplet className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-sm">{device?.name}</span>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Уставка термоголовки: {thermostatSetting}%</Label>
        <Slider
          value={[thermostatSetting]}
          onValueChange={(value) => setThermostatSetting(value[0])}
          onValueCommit={(value) => {
            if (device) {
              sendCommand(device.id, device.type, { thermostatSetting: value[0] });
            }
          }}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setThermostatSetting(0);
              if (device) sendCommand(device.id, device.type, { thermostatSetting: 0 });
            }}
          >
            Выкл
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setThermostatSetting(50);
              if (device) sendCommand(device.id, device.type, { thermostatSetting: 50 });
            }}
          >
            50%
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setThermostatSetting(100);
              if (device) sendCommand(device.id, device.type, { thermostatSetting: 100 });
            }}
          >
            100%
          </Button>
        </div>
      </div>
      {device?.data?.currentTemperature && (
        <div className="pt-2 border-t">
          <Badge variant="secondary" className="text-xs">
            Температура теплоносителя: {device.data.currentTemperature}°C
          </Badge>
        </div>
      )}
    </div>
  );

  // Рендер контролов для тепловой завесы
  const renderAirCurtainControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Wind className="w-4 h-4 text-red-500" />
        <span className="font-semibold text-sm">{device?.name}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <Label className="text-xs">Питание</Label>
        <Switch
          checked={curtainPowerOn}
          onCheckedChange={(checked) => {
            setCurtainPowerOn(checked);
            if (device) {
              sendCommand(device.id, device.type, { curtainPowerOn: checked });
            }
          }}
        />
      </div>

      {curtainPowerOn && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Скорость вентилятора</Label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'low', label: 'Низкая' },
                { value: 'medium', label: 'Средняя' },
                { value: 'high', label: 'Высокая' },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  size="sm"
                  variant={curtainFanSpeed === mode.value ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => {
                    setCurtainFanSpeed(mode.value);
                    if (device) {
                      sendCommand(device.id, device.type, { fanSpeed: mode.value });
                    }
                  }}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Температура: {curtainTemperature}°C</Label>
            <Slider
              value={[curtainTemperature]}
              onValueChange={(value) => setCurtainTemperature(value[0])}
              onValueCommit={(value) => {
                if (device) {
                  sendCommand(device.id, device.type, { curtainTemperature: value[0] });
                }
              }}
              min={20}
              max={40}
              step={1}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );

  // Рендер контролов для датчиков (только чтение)
  const renderSensorControls = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        {device?.type === 'temperature_sensor' ? (
          <Thermometer className="w-4 h-4 text-blue-500" />
        ) : (
          <Activity className="w-4 h-4 text-purple-500" />
        )}
        <span className="font-semibold text-sm">{device?.name}</span>
      </div>
      <div className="space-y-2">
        {device?.data?.temperature !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Температура:</span>
            <Badge variant="secondary" className="text-xs">{device.data.temperature}°C</Badge>
          </div>
        )}
        {device?.data?.humidity !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Влажность:</span>
            <Badge variant="secondary" className="text-xs">{device.data.humidity}%</Badge>
          </div>
        )}
        {device?.data?.co2 !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">CO2:</span>
            <Badge variant="secondary" className="text-xs">{device.data.co2} ppm</Badge>
          </div>
        )}
        <p className="text-xs text-gray-500 italic pt-2 border-t">
          Датчик работает только в режиме чтения
        </p>
      </div>
    </div>
  );

  // Рендер контролов для проекторов и телевизоров
  const renderMediaControls = () => {
    const inputOptions = device?.type === 'tv' 
      ? [
          { value: 'HDMI1', label: 'HDMI 1' },
          { value: 'HDMI2', label: 'HDMI 2' },
          { value: 'HDMI3', label: 'HDMI 3' },
          { value: 'VGA', label: 'VGA' },
          { value: 'USB', label: 'USB' },
          { value: 'TV', label: 'TV' },
          { value: 'AV', label: 'AV' },
        ]
      : [
          { value: 'HDMI1', label: 'HDMI 1' },
          { value: 'HDMI2', label: 'HDMI 2' },
          { value: 'HDMI3', label: 'HDMI 3' },
          { value: 'VGA', label: 'VGA' },
          { value: 'USB', label: 'USB' },
        ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          {device?.type === 'projector' ? (
            <Projector className="w-4 h-4 text-purple-500" />
          ) : (
            <Tv className="w-4 h-4 text-blue-500" />
          )}
          <span className="font-semibold text-sm">{device?.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Питание</Label>
          <Switch
            checked={isPowerOn}
            onCheckedChange={(checked) => {
              setIsPowerOn(checked);
              if (device) {
                sendCommand(device.id, device.type, { isPowerOn: checked });
              }
            }}
          />
        </div>

        {isPowerOn && (
          <>
            {device?.type === 'projector' && (
              <div className="space-y-2">
                <Label className="text-xs">Яркость: {brightness}%</Label>
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  onValueCommit={(value) => {
                    if (device) {
                      sendCommand(device.id, device.type, { brightness: value[0] });
                    }
                  }}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Громкость: {volume}%</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const newMuted = !muted;
                    setMuted(newMuted);
                    if (device) {
                      sendCommand(device.id, device.type, { muted: newMuted });
                    }
                  }}
                >
                  {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                onValueCommit={(value) => {
                  if (device) {
                    sendCommand(device.id, device.type, { volume: value[0] });
                  }
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
                disabled={muted}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Источник сигнала</Label>
              <div className="grid grid-cols-3 gap-1">
                {inputOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={input === option.value ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => {
                      setInput(option.value);
                      if (device) {
                        sendCommand(device.id, device.type, { input: option.value });
                      }
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Рендер контролов для помещения (управление группами)
  const renderRoomControls = () => {
    if (!room) return null;

    const lightingDevices = room.devices.filter(d => 
      d.type === 'light_fixture' || d.type === 'street_light'
    );
    const accessDevices = room.devices.filter(d => 
      d.type === 'door' || d.type === 'gate' || d.type === 'turnstile' || 
      d.type === 'tripod_turnstile' || d.type === 'barrier'
    );
    const acDevices = room.devices.filter(d => 
      d.type === 'wall_ac' || d.type === 'cassette_ac'
    );
    const heatingDevices = room.devices.filter(d => 
      d.type === 'radiator' || d.type === 'air_curtain'
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <span className="font-semibold text-sm">Управление помещением</span>
          <Badge variant="secondary" className="text-xs">{room.name}</Badge>
        </div>

        {lightingDevices.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-semibold">Освеение ({lightingDevices.length})</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Яркость: {lightLevel}%</Label>
              <Slider
                value={[lightLevel]}
                onValueChange={(value) => setLightLevel(value[0])}
                onValueCommit={(value) => {
                  controlRoomDevices('light_fixture', { lightLevel: value[0] });
                  controlRoomDevices('street_light', { lightLevel: value[0] });
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        )}

        {acDevices.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-semibold">Кондиционеры ({acDevices.length})</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Температура: {targetTemperature}°C</Label>
              <Slider
                value={[targetTemperature]}
                onValueChange={(value) => setTargetTemperature(value[0])}
                onValueCommit={(value) => {
                  controlRoomDevices('wall_ac', { targetTemperature: value[0] });
                  controlRoomDevices('cassette_ac', { targetTemperature: value[0] });
                }}
                min={16}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {heatingDevices.filter(d => d.type === 'radiator').length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold">Радиаторы ({heatingDevices.filter(d => d.type === 'radiator').length})</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Уставка: {thermostatSetting}%</Label>
              <Slider
                value={[thermostatSetting]}
                onValueChange={(value) => setThermostatSetting(value[0])}
                onValueCommit={(value) => {
                  controlRoomDevices('radiator', { thermostatSetting: value[0] });
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        )}

        {lightingDevices.length === 0 && acDevices.length === 0 && heatingDevices.length === 0 && (
          <p className="text-xs text-gray-500 italic text-center py-4">
            В помещении нет управляемых устройств
          </p>
        )}
      </div>
    );
  };

  // Определение, какой тип контролов показать
  const renderControls = () => {
    if (!device && room) {
      return renderRoomControls();
    }

    if (!device) return null;

    switch (device.type) {
      case 'light_fixture':
      case 'street_light':
        return renderLightingControls();
      
      case 'door':
      case 'gate':
      case 'turnstile':
      case 'tripod_turnstile':
      case 'barrier':
        return renderAccessControlControls();
      
      case 'camera':
        return renderCameraControls();
      
      case 'wall_ac':
      case 'cassette_ac':
        return renderACControls();
      
      case 'radiator':
        return renderRadiatorControls();
      
      case 'air_curtain':
        return renderAirCurtainControls();
      
      case 'temperature_sensor':
      case 'co2_sensor':
        return renderSensorControls();
      
      case 'projector':
      case 'tv':
        return renderMediaControls();
      
      default:
        return (
          <div className="text-xs text-gray-500 italic text-center py-4">
            Управление для этого типа устройства не поддерживается
          </div>
        );
    }
  };

  return (
    <div
      data-context-menu
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 z-50 min-w-[280px] max-w-[320px]"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h3 className="font-semibold text-sm">Управление устройством</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {renderControls()}
    </div>
  );
}