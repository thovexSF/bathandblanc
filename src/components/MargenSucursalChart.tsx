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
  ComposedChart,
  Line,
  LineChart
} from 'recharts';
import { MargenPorSucursal } from '@/lib/queries';
import { BarChart3, Table as TableIcon } from 'lucide-react';

interface MargenSucursalChartProps {
  data: MargenPorSucursal[];
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

export default function MargenSucursalChart({ data }: MargenSucursalChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-gray-600 text-xs">{data.empresa}</p>
          <p className="text-blue-600">
            <span className="font-medium">Ventas: </span>
            {formatCurrency(data.total_ventas)}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Margen: </span>
            {formatCurrency(data.total_margen)} ({data.porcentaje_margen}%)
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Con costo: </span>
            {formatCurrency(data.ventas_con_costo)}
          </p>
          <p className="text-red-600">
            <span className="font-medium">Sin costo: </span>
            {formatCurrency(data.ventas_sin_costo)} ({data.porcentaje_sin_costo}%)
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
              Sucursal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Empresa
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas Totales
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Margen Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Margen
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas con Costo
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas sin Costo
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Sin Costo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                {item.sucursal}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600 border-b">
                {item.empresa}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.total_ventas)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.total_margen)}
              </td>
              <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                item.porcentaje_margen >= 25 ? 'text-green-600' : 
                item.porcentaje_margen >= 15 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.porcentaje_margen}%
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.ventas_con_costo)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyTable(item.ventas_sin_costo)}
              </td>
              <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                item.porcentaje_sin_costo <= 10 ? 'text-green-600' : 
                item.porcentaje_sin_costo <= 30 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.porcentaje_sin_costo}%
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
          {data.length} sucursales • Margen promedio: {
            data.length > 0 
              ? (data.reduce((sum, item) => sum + item.porcentaje_margen, 0) / data.length).toFixed(1)
              : 0
          }%
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
          {/* Gráfico de Barras - Ventas y Margen */}
          <div className="h-80">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ventas y Margen por Sucursal</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="sucursal" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  yAxisId="ventas"
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={formatCurrencyTable}
                />
                <YAxis 
                  yAxisId="porcentaje"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  yAxisId="ventas"
                  dataKey="total_ventas"
                  name="Ventas Totales" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="ventas"
                  dataKey="total_margen"
                  name="Margen Total" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Línea - Porcentaje de Margen */}
          <div className="h-80">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Porcentaje de Margen por Sucursal</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="sucursal" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value}%`,
                    name
                  ]}
                  labelFormatter={(label) => `Sucursal: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="porcentaje_margen" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="% Margen"
                />
                <Line 
                  type="monotone" 
                  dataKey="porcentaje_sin_costo" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                  name="% Sin Costo"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 