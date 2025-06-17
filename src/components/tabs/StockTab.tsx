'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Package, Archive, BarChart3, Clock, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        
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
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

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

  if (loading || dataLoading) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Gestión de Stock</h2>
        <p className="text-blue-100 mt-1">Sistema de inventario y análisis de stock</p>
        <div className="mt-4 text-sm text-blue-100">
          Análisis en tiempo real del inventario, alertas de stock bajo, rotación de productos y proyecciones de reposición.
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Stock Bajo</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Productos con inventario crítico (≤10 unidades)
          </p>
          <div className="text-2xl font-bold text-red-600">
            {resumenStock?.productos_stock_bajo || 0}
          </div>
          <p className="text-sm text-gray-500">Productos en riesgo</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Rotación</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Días promedio de rotación de inventario
          </p>
          <div className="text-2xl font-bold text-yellow-600">
            {resumenStock?.rotacion_promedio || 0}
          </div>
          <p className="text-sm text-gray-500">Días promedio</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Productos</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Total de productos en inventario
          </p>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(resumenStock?.total_productos || 0)}
          </div>
          <p className="text-sm text-gray-500">SKUs únicos</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Archive className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Sin Stock</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Productos agotados (0 unidades)
          </p>
          <div className="text-2xl font-bold text-blue-600">
            {resumenStock?.productos_sin_stock || 0}
          </div>
          <p className="text-sm text-gray-500">Productos agotados</p>
        </div>
      </div>

      {/* Stock por Sucursal y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stock por Sucursal */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Stock por Sucursal</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Sucursal</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Productos</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Stock</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Rotación</th>
                </tr>
              </thead>
              <tbody>
                {stockPorSucursal.slice(0, 8).map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-sm text-gray-900">{item.sucursal}</td>
                    <td className="py-2 text-sm text-gray-600 text-right">{item.total_productos}</td>
                    <td className="py-2 text-sm text-gray-600 text-right">{formatNumber(item.stock_disponible)}</td>
                    <td className="py-2 text-sm text-gray-600 text-right">{item.rotacion_promedio} días</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de Stock Crítico */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Alertas de Stock Crítico</h2>
          </div>
          <div className="space-y-3">
            {stockBajo.length > 0 ? (
              stockBajo.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.producto_servicio}</p>
                    <p className="text-xs text-gray-600">{item.sucursal} • SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.stock_disponible} unidades</p>
                    <p className="text-xs text-gray-500">{item.dias_sin_stock} días restantes</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay productos con stock crítico</p>
            )}
          </div>
        </div>
      </div>

      {/* Análisis de Rotación */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Análisis de Rotación de Productos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Producto</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Sucursal</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Stock</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Ventas/día</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Rotación</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {rotacionProductos.slice(0, 10).map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">{item.producto_servicio}</td>
                  <td className="py-2 text-sm text-gray-600">{item.sucursal}</td>
                  <td className="py-2 text-sm text-gray-600 text-right">{item.stock_promedio}</td>
                  <td className="py-2 text-sm text-gray-600 text-right">{item.ventas_promedio_diarias}</td>
                  <td className="py-2 text-sm text-gray-600 text-right">{item.dias_rotacion} días</td>
                  <td className="py-2 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoriaColor(item.categoria_rotacion)}`}>
                      {item.categoria_rotacion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 