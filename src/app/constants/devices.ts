import { DeviceType, SystemType } from '../types';
import {
  Lightbulb,
  DoorOpen,
  Video,
  Wind,
  Droplet,
  Thermometer,
  Activity,
  Minimize2,
  Hexagon,
  Projector,
  Tv
} from 'lucide-react';

export const DEVICE_TYPES: { type: DeviceType; label: string; icon: any; systemType: SystemType }[] = [
  // Освещение
  { type: 'light_fixture', label: 'Светильник', icon: Lightbulb, systemType: 'lighting' },
  { type: 'street_light', label: 'Уличный светильник', icon: Lightbulb, systemType: 'lighting' },
  
  // СКУД
  { type: 'door', label: 'Дверь', icon: DoorOpen, systemType: 'access_control' },
  { type: 'turnstile', label: 'Турникет', icon: Hexagon, systemType: 'access_control' },
  { type: 'tripod_turnstile', label: 'Тумбовый турникет', icon: Hexagon, systemType: 'access_control' },
  { type: 'barrier', label: 'Шлагбаум', icon: Minimize2, systemType: 'access_control' },
  { type: 'gate', label: 'Ворота', icon: DoorOpen, systemType: 'access_control' },
  
  // Видеонаблюдение
  { type: 'camera', label: 'Видеокамера', icon: Video, systemType: 'video' },
  { type: 'projector', label: 'Проектор', icon: Projector, systemType: 'video' },
  { type: 'tv', label: 'Телевизор', icon: Tv, systemType: 'video' },
  
  // HVAC (Кондиционирование)
  { type: 'wall_ac', label: 'Настенный кондиционер', icon: Wind, systemType: 'hvac' },
  { type: 'cassette_ac', label: 'Кассетный кондиционер', icon: Wind, systemType: 'hvac' },
  
  // Отопление
  { type: 'radiator', label: 'Батарея отопления', icon: Droplet, systemType: 'heating' },
  { type: 'air_curtain', label: 'Тепловая завеса', icon: Wind, systemType: 'heating' },
  
  // Датчики
  { type: 'temperature_sensor', label: 'Датчик температуры', icon: Thermometer, systemType: 'sensors' },
  { type: 'co2_sensor', label: 'Датчик CO2', icon: Activity, systemType: 'sensors' },
];

// Группы устройств для компактного отображения в фильтрах
export interface DeviceGroup {
  id: string;
  label: string;
  icon: any;
  deviceTypes: DeviceType[];
  systemType: SystemType;
}

export const DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'lighting',
    label: 'Освещение',
    icon: Lightbulb,
    deviceTypes: ['light_fixture', 'street_light'],
    systemType: 'lighting'
  },
  {
    id: 'doors_gates',
    label: 'Двери и ворота',
    icon: DoorOpen,
    deviceTypes: ['door', 'gate'],
    systemType: 'access_control'
  },
  {
    id: 'turnstiles',
    label: 'Турникеты',
    icon: Hexagon,
    deviceTypes: ['turnstile', 'tripod_turnstile'],
    systemType: 'access_control'
  },
  {
    id: 'barriers',
    label: 'Шлагбаумы',
    icon: Minimize2,
    deviceTypes: ['barrier'],
    systemType: 'access_control'
  },
  {
    id: 'cameras',
    label: 'Видеокамеры',
    icon: Video,
    deviceTypes: ['camera'],
    systemType: 'video'
  },
  {
    id: 'projectors',
    label: 'Проекторы',
    icon: Projector,
    deviceTypes: ['projector'],
    systemType: 'video'
  },
  {
    id: 'tv',
    label: 'Телевизоры',
    icon: Tv,
    deviceTypes: ['tv'],
    systemType: 'video'
  },
  {
    id: 'air_conditioning',
    label: 'Кондиционеры',
    icon: Wind,
    deviceTypes: ['wall_ac', 'cassette_ac'],
    systemType: 'hvac'
  },
  {
    id: 'heating',
    label: 'Отопление',
    icon: Droplet,
    deviceTypes: ['radiator', 'air_curtain'],
    systemType: 'heating'
  },
  {
    id: 'sensors',
    label: 'Датчики',
    icon: Activity,
    deviceTypes: ['temperature_sensor', 'co2_sensor'],
    systemType: 'sensors'
  }
];