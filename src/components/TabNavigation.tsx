'use client';

import { TrendingUp, Package, Archive } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  {
    id: 'resumen-ventas',
    name: 'Resumen Ventas',
    icon: TrendingUp,
    description: 'Análisis general de ventas y tendencias'
  },
  {
    id: 'analisis-productos',
    name: 'Análisis Productos',
    icon: Package,
    description: 'Productos, categorías y márgenes detallados'
  },
  {
    id: 'stock',
    name: 'Stock',
    icon: Archive,
    description: 'Gestión y análisis de inventario'
  }
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200 mb-0">
      <div className="max-w-full mx-auto">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-center text-sm font-medium focus:z-10 focus:outline-none transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                  <span className="font-medium">{tab.name}</span>
                </div>
                <p className={`mt-1 text-xs ${
                  isActive ? 'text-blue-500' : 'text-gray-400'
                }`}>
                  {tab.description}
                </p>
                
                {/* Indicador de pestaña activa */}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 