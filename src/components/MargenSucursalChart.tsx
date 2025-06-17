'use client';

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
import { useState } from 'react';

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

export default function MargenSucursalChart({ data }: MargenSucursalChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">{data.sucursal}</p>
            <p className="text-sm text-gray-600">{data.empresa}</p>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Ventas: </span>
                <span className="font-medium">{formatCurrency(data.total_ventas)}</span>
              </div>
              <div>
                <span className="text-gray-600">Margen: </span>
                <span className="font-medium">{formatCurrency(data.margen_total)}</span>
              </div>
              <div>
                <span className="text-gray-600">Porcentaje: </span>
                <span className={`font-medium ${
                  data.porcentaje_margen >= 20 ? 'text-green-600' : 
                  data.porcentaje_margen >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {data.porcentaje_margen}%
                </span>
              </div>
            </div>
          </div>
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
              Sucursal
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Empresa
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Margen
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Porcentaje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {item.sucursal}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {item.empresa}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {formatCurrency(item.total_ventas)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {formatCurrency(item.margen_total)}
              </td>
              <td className={`px-4 py-2 text-sm text-right font-medium ${
                item.porcentaje_margen >= 20 ? 'text-green-600' : 
                item.porcentaje_margen >= 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.porcentaje_margen}%
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
          {data.length} sucursales
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
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="sucursal"
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
              <Bar 
                dataKey="margen_total" 
                name="Margen"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 