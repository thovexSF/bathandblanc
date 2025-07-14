'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Package, Archive, BarChart3, Clock, AlertCircle, List } from 'lucide-react';
import InventarioTable from '../InventarioTable';
import ListaPreciosTab from './ListaPreciosTab';

interface StockTabProps {
  dataLoading: boolean;
}

interface ResumenStock {
  total_productos: number;
  valor_total_stock: number;
  productos_stock_bajo: number;
  productos_sin_stock: number;
  rotacion_promedio: number;
}

interface StockPorSucursal {
  sucursal: string;
  empresa: string;
  total_productos: number;
  stock_disponible: number;
  valor_stock: number;
  productos_stock_bajo: number;
  rotacion_promedio: number;
}

interface StockBajo {
  sku: string;
  producto_servicio: string;
  variante: string;
  sucursal: string;
  stock_disponible: number;
  stock_minimo: number;
  dias_sin_stock: number;
  ventas_ultimos_30_dias: number;
}

interface RotacionProductos {
  sku: string;
  producto_servicio: string;
  sucursal: string;
  stock_promedio: number;
  ventas_promedio_diarias: number;
  dias_rotacion: number;
  categoria_rotacion: string;
}

export default function StockTab({ dataLoading }: StockTabProps) {
  const [resumenStock, setResumenStock] = useState<ResumenStock | null>(null);
  const [stockPorSucursal, setStockPorSucursal] = useState<StockPorSucursal[]>([]);
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [rotacionProductos, setRotacionProductos] = useState<RotacionProductos[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [activeView, setActiveView] = useState<'resumen' | 'inventario'>('inventario');
  // Estado para alternar entre inventario y lista de precios
  const [showListaPrecios, setShowListaPrecios] = useState(false);

  // Cargar datos del resumen solo cuando se necesiten
  const fetchResumenData = async () => {
    if (resumenStock) return; // Ya está cargado
    
    try {
      setResumenLoading(true);
      
      const [resumenRes, sucursalRes, stockBajoRes, rotacionRes] = await Promise.all([
        fetch('/api/resumen-stock'),
        fetch('/api/stock-sucursal'),
        fetch('/api/stock-bajo?limite=10'),
        fetch('/api/rotacion-productos?limite=10')
      ]);

      const [resumen, sucursal, stockBajoData, rotacion] = await Promise.all([
        resumenRes.json(),
        sucursalRes.json(),
        stockBajoRes.json(),
        rotacionRes.json()
      ]);

      setResumenStock(resumen);
      setStockPorSucursal(sucursal);
      setStockBajo(stockBajoData);
      setRotacionProductos(rotacion);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setResumenLoading(false);
    }
  };

  // Cargar resumen cuando se cambie a la vista resumen
  useEffect(() => {
    if (activeView === 'resumen') {
      fetchResumenData();
    }
  }, [activeView]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  const getCategoriaColor = (categoria: string): string => {
    switch (categoria) {
      case 'Rápida': return 'text-green-600';
      case 'Normal': return 'text-blue-600';
      case 'Lenta': return 'text-yellow-600';
      case 'Muy Lenta': return 'text-red-600';
      case 'Sin Ventas': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Loading solo para la primera carga cuando está en vista resumen
  if (dataLoading && activeView === 'resumen') {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold">Gestión de Stock</h2>
          <p className="text-blue-100 mt-1">Cargando datos de inventario...</p>
        </div>
        <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
      </div>
    );
  }

  // Eliminar el header de tabs y dejar solo Inventario Consolidado
  return (
    <div className="space-y-8">
      {/* Botón para alternar vista */}
      <div className="flex justify-end mb-4">
          <button
          onClick={() => setShowListaPrecios((prev) => !prev)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border bg-blue-600 text-white hover:bg-blue-700"
        >
          {showListaPrecios ? 'Ver Inventario Consolidado' : 'Ver Lista de Precios'}
          </button>
      </div>
      {/* Mostrar solo una tabla a la vez */}
      {showListaPrecios ? (
        <ListaPreciosTab />
      ) : (
        <InventarioTable consolidado={true} />
      )}
    </div>
  );
} 