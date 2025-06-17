'use client';

import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Filter, BarChart3, Table as TableIcon } from 'lucide-react';
import { Filtros } from '@/lib/queries';

interface VentasFiltradasChartProps {
  data: any[];
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
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

export default function VentasFiltradasChart({ data, filtros, onFiltrosChange }: VentasFiltradasChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>(
    Array.from({ length: 31 }, (_, i) => i + 1)
  );

  // Obtener categorías únicas de los datos
  const categorias = Array.from(new Set(data.map(item => item.categoria)));

  // Filtrar datos según las categorías seleccionadas
  const filteredData = selectedCategorias.length > 0
    ? data.filter(item => selectedCategorias.includes(item.categoria))
    : data;

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Vista de tabla
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documentos
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ticket Promedio
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {item.categoria}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {formatCurrency(item.total_ventas)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {item.total_documentos.toLocaleString('es-CL')}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {formatCurrency(item.ticket_promedio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Panel de filtros
  const FilterPanel = () => (
    <div className="bg-gray-50 p-4 rounded-lg border mb-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categorías</h4>
          <div className="flex flex-wrap gap-2">
            {categorias.map(categoria => (
              <label
                key={categoria}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                  selectedCategorias.includes(categoria)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategorias.includes(categoria)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategorias([...selectedCategorias, categoria]);
                    } else {
                      setSelectedCategorias(selectedCategorias.filter(c => c !== categoria));
                    }
                  }}
                  className="sr-only"
                />
                {categoria}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTable(false)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              !showTable 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Gráfico</span>
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showTable 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TableIcon className="h-4 w-4" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && <FilterPanel />}

      {/* Contenido */}
      {showTable ? (
        <TableView />
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="categoria"
                fontSize={10}
                stroke="#6b7280"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                fontSize={11}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="total_ventas" 
                name="Ventas"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 