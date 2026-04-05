import React from 'react';
import type { LucideProps } from 'lucide-react';

// Figma-специфичные пропсы, которые нужно отфильтровать
const FIGMA_PROPS = ['_fgT', '_fgt', '_fgS', '_fgs', '_fgB', '_fgb'];

// Обертка для иконок lucide-react, которая фильтрует Figma пропсы
export function Icon({ 
  component: Component, 
  ...props 
}: { 
  component: React.ComponentType<LucideProps> 
} & LucideProps & Record<string, any>) {
  // Фильтруем Figma пропсы
  const filteredProps = Object.keys(props).reduce((acc, key) => {
    if (!FIGMA_PROPS.includes(key)) {
      acc[key] = props[key];
    }
    return acc;
  }, {} as Record<string, any>);

  return <Component {...filteredProps} />;
}

// Хелпер функция для создания обернутой иконки
export function createIcon(Component: React.ComponentType<LucideProps>) {
  return React.forwardRef<SVGSVGElement, LucideProps & Record<string, any>>((props, ref) => {
    // Фильтруем Figma пропсы
    const filteredProps = Object.keys(props).reduce((acc, key) => {
      if (!FIGMA_PROPS.includes(key)) {
        acc[key] = props[key];
      }
      return acc;
    }, {} as Record<string, any>);

    return <Component {...filteredProps} ref={ref} />;
  });
}
