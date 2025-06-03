'use client';

import React, { useState } from 'react';
import { VentasPorCategoria } from '@/lib/queries';
import { Search, Filter, Package, ShoppingCart } from 'lucide-react';

interface VentasCategoriaTableProps {
  data: VentasPorCategoria[];
}

// Formatear valores de moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Formatear valores para tabla (más compacto)
const formatCurrencyTable = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('es-CL')}`;
};

export default function VentasCategoriaTable({ data }: VentasCategoriaTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'ventas' | 'unidades' | 'margen'>('ventas');
  const [showUnits, setShowUnits] = useState(false);

  // Obtener categorías únicas
  const categories = Array.from(new Set(data.map(item => item.tipo_producto_servicio))).sort();

  // Filtrar y ordenar datos
  const filteredAndSortedData = data
    .filter(item => {
      const matchesSearch = 
        item.producto_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variante.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || item.tipo_producto_servicio === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ventas':
          return b.total_ventas - a.total_ventas;
        case 'unidades':
          return b.total_unidades - a.total_unidades;
        case 'margen':
          return b.total_margen - a.total_margen;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-4">
      {/* Controles y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por producto, SKU o variante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-80"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'ventas' | 'unidades' | 'margen')}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="ventas">Ventas</option>
              <option value="unidades">Unidades</option>
              <option value="margen">Margen</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUnits(false)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                !showUnits 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Ventas</span>
            </button>
            <button
              onClick={() => setShowUnits(true)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                showUnits 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Unidades</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Productos Mostrados</div>
          <div className="text-2xl font-bold text-gray-900">{filteredAndSortedData.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Ventas Totales</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrencyTable(filteredAndSortedData.reduce((sum, item) => sum + item.total_ventas, 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Margen Total</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrencyTable(filteredAndSortedData.reduce((sum, item) => sum + item.total_margen, 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Unidades Totales</div>
          <div className="text-2xl font-bold text-purple-600">
            {filteredAndSortedData.reduce((sum, item) => sum + item.total_unidades, 0).toLocaleString('es-CL')}
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
                  Ranking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
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
                  {showUnits ? 'Unidades' : 'Ventas Netas'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Margen
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documentos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedData.map((item, index) => (
                <tr key={`${item.sku}-${item.variante}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500 border-b">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.tipo_producto_servicio}
                    </span>
                  </td>
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
                    {showUnits 
                      ? item.total_unidades.toLocaleString('es-CL')
                      : formatCurrencyTable(item.total_ventas)
                    }
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                    {formatCurrencyTable(item.total_margen)}
                  </td>
                  <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                    item.porcentaje_margen >= 25 ? 'text-green-600' : 
                    item.porcentaje_margen >= 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.porcentaje_margen}%
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                    {item.total_documentos.toLocaleString('es-CL')}
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
    </div>
  );
} 