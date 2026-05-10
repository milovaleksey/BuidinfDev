import { Device, MQTTMessage } from '../types';

type MessageCallback = (message: MQTTMessage) => void;

class MockMQTTService {
  private subscribers: Map<string, Set<MessageCallback>> = new Map();
  private connected: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.connected = true;
    console.log('MQTT: Connected to broker (mock)');
    this.startMockDataStream();
  }

  disconnect(): void {
    this.connected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('MQTT: Disconnected from broker');
  }

  subscribe(topic: string, callback: MessageCallback): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(callback);
    console.log(`MQTT: Subscribed to ${topic}`);
  }

  unsubscribe(topic: string, callback: MessageCallback): void {
    const callbacks = this.subscribers.get(topic);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(topic);
      }
    }
    console.log(`MQTT: Unsubscribed from ${topic}`);
  }

  publish(topic: string, payload: any): void {
    if (!this.connected) {
      console.warn('MQTT: Not connected, cannot publish');
      return;
    }

    const message: MQTTMessage = {
      topic,
      payload,
      timestamp: Date.now()
    };

    console.log(`MQTT: Publishing to ${topic}`, payload);
    
    // В реальности здесь был бы реальный MQTT publish
    // Для мока просто эмулируем ответ через небольшую задержку
    setTimeout(() => {
      this.notifySubscribers(message);
    }, 100);
  }

  private notifySubscribers(message: MQTTMessage): void {
    // Notify exact topic subscribers
    const callbacks = this.subscribers.get(message.topic);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }

    // Notify wildcard subscribers (simple implementation)
    this.subscribers.forEach((callbacks, subscribedTopic) => {
      if (subscribedTopic.includes('#') || subscribedTopic.includes('+')) {
        const regex = this.topicToRegex(subscribedTopic);
        if (regex.test(message.topic)) {
          callbacks.forEach(callback => callback(message));
        }
      }
    });
  }

  private topicToRegex(topic: string): RegExp {
    const pattern = topic
      .replace(/\+/g, '[^/]+')
      .replace(/#/g, '.*');
    return new RegExp(`^${pattern}$`);
  }

  private startMockDataStream(): void {
    // Симуляция получения данных от датчиков каждые 5 секунд
    this.intervalId = setInterval(() => {
      if (!this.connected) return;

      // Генерация случайных данных для различных устройств
      const floors = [1, 2, 3, 4, 5];
      const rooms = ['01', '02', '03', '04', '05'];

      floors.forEach(floor => {
        rooms.forEach(room => {
          const roomId = `${floor}${room}`;
          
          // Temperature sensor
          this.notifySubscribers({
            topic: `building/floor${floor}/room${roomId}/temperature`,
            payload: {
              value: (20 + Math.random() * 5).toFixed(1),
              unit: '°C',
              deviceId: `temp_${roomId}`
            },
            timestamp: Date.now()
          });

          // CO2 sensor
          this.notifySubscribers({
            topic: `building/floor${floor}/room${roomId}/co2`,
            payload: {
              value: Math.floor(400 + Math.random() * 400),
              unit: 'ppm',
              deviceId: `co2_${roomId}`
            },
            timestamp: Date.now()
          });

          // HVAC (кондиционеры) state
          if (Math.random() > 0.5) {
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/hvac/state`,
              payload: {
                isPowerOn: Math.random() > 0.3,
                workMode: ['cool', 'heat', 'fan', 'dry', 'auto'][Math.floor(Math.random() * 5)],
                fanMode: ['auto', 'low', 'medium', 'high'][Math.floor(Math.random() * 4)],
                targetTemperature: 18 + Math.floor(Math.random() * 12), // 18-30°C
                currentTemperature: (20 + Math.random() * 5).toFixed(1),
                deviceId: `ac_${roomId}`
              },
              timestamp: Date.now()
            });
          }

          // Video devices (проектор, телевизор, камера) state
          if (Math.random() > 0.6) {
            // Projector
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/projector/state`,
              payload: {
                isPowerOn: Math.random() > 0.5,
                brightness: 50 + Math.floor(Math.random() * 50), // 50-100%
                volume: Math.floor(Math.random() * 100),
                input: ['HDMI1', 'HDMI2', 'VGA', 'USB'][Math.floor(Math.random() * 4)],
                muted: Math.random() > 0.8,
                deviceId: `projector_${roomId}`
              },
              timestamp: Date.now()
            });
            
            // TV
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/tv/state`,
              payload: {
                isPowerOn: Math.random() > 0.4,
                volume: Math.floor(Math.random() * 100),
                input: ['HDMI1', 'HDMI2', 'HDMI3', 'AV', 'USB'][Math.floor(Math.random() * 5)],
                muted: Math.random() > 0.7,
                deviceId: `tv_${roomId}`
              },
              timestamp: Date.now()
            });
            
            // Camera
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/camera/state`,
              payload: {
                recording: Math.random() > 0.3,
                streamUrl: `rtsp://192.168.1.${100 + Math.floor(Math.random() * 50)}:554/stream1`,
                deviceId: `camera_${roomId}`
              },
              timestamp: Date.now()
            });
          }

          // Heating (батареи и тепловые завесы) state
          if (Math.random() > 0.6) {
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/heating/state`,
              payload: {
                temperature: (40 + Math.random() * 30).toFixed(1), // 40-70°C для батарей
                thermostatSetting: Math.floor(Math.random() * 5) + 1, // 1-5
                isActive: Math.random() > 0.2,
                deviceId: `radiator_${roomId}`
              },
              timestamp: Date.now()
            });
          }

          // Random motion detection
          if (Math.random() > 0.7) {
            this.notifySubscribers({
              topic: `building/floor${floor}/room${roomId}/motion`,
              payload: {
                detected: true,
                deviceId: `motion_${roomId}`
              },
              timestamp: Date.now()
            });
          }
        });
      });
    }, 5000);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const mqttService = new MockMQTTService();