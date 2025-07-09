'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Package, ShoppingCart } from 'lucide-react';

interface ComparacionCostos {
  sku: string;
  producto_servicio: string;
  variante: string;
  costo_stock_bodega: number;
  costo_ventas_bodega: number;
  diferencia: number;
  porcentaje_diferencia: number;
  stock_disponible_bodega: number;
  ventas_ultimos_30_dias: number;
}

export default function ComparacionCostosTable() {
  const [data, setData] = useState<ComparacionCostos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'diferencia' | 'porcentaje_diferencia' | 'sku'>('diferencia');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/comparacion-costos?limite=100');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching comparación costos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CL');
  };

  const getDiferenciaIcon = (diferencia: number) => {
    if (diferencia > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (diferencia < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia > 0) {
      return 'text-red-600';
    } else if (diferencia < 0) {
      return 'text-green-600';
    } else {
      return 'text-gray-600';
    }
  };

  const getPorcentajeColor = (porcentaje: number) => {
    if (Math.abs(porcentaje) > 20) {
      return 'text-red-600 font-bold';
    } else if (Math.abs(porcentaje) > 10) {
      return 'text-yellow-600 font-semibold';
    } else {
      return 'text-green-600';
    }
  };

  const filteredAndSortedData = data
    .filter(item => 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producto_servicio.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'diferencia':
          comparison = Math.abs(b.diferencia) - Math.abs(a.diferencia);
          break;
        case 'porcentaje_diferencia':
          comparison = Math.abs(b.porcentaje_diferencia) - Math.abs(a.porcentaje_diferencia);
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparación de Costos</h2>
          <p className="text-gray-600">
            Comparación entre costos de stock en bodega vs costos en ventas de bodega
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Package className="h-4 w-4" />
          <span>Stock Bodega</span>
          <ShoppingCart className="h-4 w-4 ml-4" />
          <span>Ventas Bodega</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por SKU o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="diferencia">Ordenar por Diferencia</option>
            <option value="porcentaje_diferencia">Ordenar por % Diferencia</option>
            <option value="sku">Ordenar por SKU</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Productos Analizados</div>
          <div className="text-2xl font-bold text-gray-900">{filteredAndSortedData.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Con Diferencias {'>'}10%</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredAndSortedData.filter(item => Math.abs(item.porcentaje_diferencia) > 10).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Con Diferencias {'>'}20%</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredAndSortedData.filter(item => Math.abs(item.porcentaje_diferencia) > 20).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Diferencia Promedio</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              filteredAndSortedData.reduce((sum, item) => sum + Math.abs(item.diferencia), 0) / 
              Math.max(filteredAndSortedData.length, 1)
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variante
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Ventas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Diferencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Bodega
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas 30d
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedData.map((item, index) => (
                <tr key={`${item.sku}-${item.variante}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-mono text-gray-900 border-b">
                    {item.sku}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b max-w-xs">
                    <div className="truncate" title={item.producto_servicio}>
                      {item.producto_servicio}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b max-w-xs">
                    <div className="truncate" title={item.variante}>
                      {item.variante}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b font-medium">
                    {formatCurrency(item.costo_stock_bodega)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b font-medium">
                    {formatCurrency(item.costo_ventas_bodega)}
                  </td>
                  <td className={`px-4 py-2 text-sm text-right border-b font-medium ${getDiferenciaColor(item.diferencia)}`}>
                    <div className="flex items-center justify-end space-x-1">
                      {getDiferenciaIcon(item.diferencia)}
                      <span>{formatCurrency(Math.abs(item.diferencia))}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-2 text-sm text-right border-b font-medium ${getPorcentajeColor(item.porcentaje_diferencia)}`}>
                    {item.porcentaje_diferencia > 0 ? '+' : ''}{item.porcentaje_diferencia}%
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                    {formatNumber(item.stock_disponible_bodega)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                    {formatNumber(item.ventas_ultimos_30_dias)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pie de tabla */}
      <div className="text-sm text-gray-500 text-center">
        Mostrando {filteredAndSortedData.length} de {data.length} productos
      </div>

      {/* Leyenda */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Leyenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span>Costo en ventas {'>'} Costo en stock</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span>Costo en ventas {'<'} Costo en stock</span>
          </div>
          <div className="flex items-center space-x-2">
            <Minus className="h-4 w-4 text-gray-400" />
            <span>Costos iguales</span>
          </div>
        </div>
      </div>
    </div>
  );
} 