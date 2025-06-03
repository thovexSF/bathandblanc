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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { VentasPorPlataforma } from '@/lib/queries';
import { BarChart3, Table as TableIcon } from 'lucide-react';

interface VentasPlataformaChartProps {
  data: VentasPorPlataforma[];
}

// Colores para el gráfico de pie
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

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

export default function VentasPlataformaChart({ data }: VentasPlataformaChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">Ventas: </span>
            {formatCurrency(data.total_ventas)}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Margen: </span>
            {formatCurrency(data.margen_total)} ({data.porcentaje_margen}%)
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Participación: </span>
            {data.porcentaje_del_total}%
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Documentos: </span>
            {data.total_documentos.toLocaleString('es-CL')}
          </p>
        </div>
      );
    }
    return null;
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plataforma
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas Netas
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Margen
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Margen
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Participación
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documentos
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unidades
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                {item.plataforma}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.total_ventas)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.margen_total)}
              </td>
              <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                item.porcentaje_margen >= 20 ? 'text-green-600' : 
                item.porcentaje_margen >= 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.porcentaje_margen}%
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b font-medium">
                {item.porcentaje_del_total}%
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {item.total_documentos.toLocaleString('es-CL')}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {item.total_unidades.toLocaleString('es-CL')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {data.length} plataformas • Total: {formatCurrency(data.reduce((sum, item) => sum + item.total_ventas, 0))}
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

      {/* Contenido */}
      {showTable ? (
        <TableView />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Barras - Ventas */}
          <div className="h-80">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ventas por Plataforma</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="plataforma" 
                  stroke="#6b7280"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={formatCurrencyTable}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total_ventas"
                  name="Ventas Netas" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Pie - Participación */}
          <div className="h-80">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Participación por Plataforma</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plataforma, porcentaje_del_total }) => 
                    `${plataforma}: ${porcentaje_del_total}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_ventas"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value),
                    `Ventas - ${props.payload.plataforma}`
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 