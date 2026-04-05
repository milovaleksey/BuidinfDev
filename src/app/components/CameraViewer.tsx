import { useEffect, useState } from 'react';
import { Device } from '../types';
import { mqttService } from '../services/MockMQTTService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Video, VideoOff, Radio, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CameraViewerProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

export function CameraViewer({ device, isOpen, onClose }: CameraViewerProps) {
  const [streamUrl, setStreamUrl] = useState<string | undefined>(device.data?.streamUrl);
  const [recording, setRecording] = useState<boolean>(device.data?.recording || false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !device.mqttTopic) return;

    // Подписываемся на обновления камеры
    const stateTopic = `${device.mqttTopic}/state`;
    
    const handleMessage = (message: any) => {
      if (message.payload.streamUrl) {
        setStreamUrl(message.payload.streamUrl);
      }
      if (typeof message.payload.recording === 'boolean') {
        setRecording(message.payload.recording);
      }
    };

    mqttService.subscribe(stateTopic, handleMessage);

    // Запрашиваем текущее состояние
    mqttService.publish(`${device.mqttTopic}/get`, {});

    return () => {
      mqttService.unsubscribe(stateTopic, handleMessage);
    };
  }, [isOpen, device.mqttTopic]);

  const handleCopyUrl = () => {
    if (streamUrl) {
      navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      toast.success('RTSP URL скопирован');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    if (device.mqttTopic) {
      mqttService.publish(`${device.mqttTopic}/get`, {});
    }
    setTimeout(() => setLoading(false), 500);
  };

  // Конвертируем RTSP URL в HTTP URL для демонстрации
  // В реальности это должен делать медиа-сервер (например, через FFmpeg в HLS/WebRTC)
  const getPreviewUrl = (rtspUrl?: string) => {
    if (!rtspUrl) return null;
    // Для демонстрации используем заглушку
    // В реальности здесь был бы URL медиа-сервера, который транскодирует RTSP в HLS
    return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
  };

  const previewUrl = getPreviewUrl(streamUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {device.name}
          </DialogTitle>
          <DialogDescription>
            Просмотр видеопотока с камеры
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                <Radio className="w-3 h-3 mr-1" />
                {device.status === 'online' ? 'В сети' : 'Не в сети'}
              </Badge>
              {recording && (
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Запись
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>

          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {device.status === 'online' && previewUrl ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-contain"
                onError={() => {
                  toast.error('Ошибка загрузки видео');
                }}
              >
                Ваш браузер не поддерживает видео.
              </video>
            ) : device.status === 'online' && streamUrl ? (
              // Fallback: показываем информацию об RTSP
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                  <VideoOff className="w-16 h-16 mx-auto opacity-50" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">RTSP поток недоступен для прямого просмотра</p>
                    <p className="text-sm text-gray-300">
                      Для просмотра RTSP требуется медиа-сервер (FFmpeg, GStreamer)
                    </p>
                    <p className="text-xs text-gray-400 font-mono bg-black/30 p-2 rounded">
                      {streamUrl}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                  <VideoOff className="w-16 h-16 mx-auto opacity-50" />
                  <p className="text-lg">Камера не в сети</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          {streamUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                RTSP URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                  {streamUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Используйте VLC или другой RTSP-совместимый плеер для просмотра потока
              </p>
            </div>
          )}

          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Идентификатор</p>
              <p className="text-sm font-medium font-mono">{device.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Тип устройства</p>
              <p className="text-sm font-medium">Видеокамера</p>
            </div>
            {device.mqttTopic && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">MQTT Topic</p>
                <p className="text-sm font-medium font-mono text-xs break-all">{device.mqttTopic}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
