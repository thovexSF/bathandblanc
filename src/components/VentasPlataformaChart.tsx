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

// Leyenda personalizada para plataformas
const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center space-x-2">
          <span
            className="inline-block w-4 h-4 rounded"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="text-sm text-gray-700 font-medium">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

// Etiqueta personalizada para el PieChart (monto MM$ y cantidad de documentos)
const renderCustomPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload } = props;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  // Monto en millones
  const millones = payload.total_ventas / 1_000_000;
  // Cantidad de documentos
  const docs = payload.total_documentos;
  return (
    <g>
      <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" fill="#fff" style={{ textShadow: '0 1px 2px #0008' }}>
        {`$${millones.toFixed(1)}M`}
      </text>
      <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#fff" style={{ textShadow: '0 1px 2px #0008' }}>
        {`(${docs.toLocaleString('es-CL')} doc)`}
      </text>
    </g>
  );
};

// Normaliza y agrupa las plataformas Uber
function groupUber(data: VentasPorPlataforma[]): VentasPorPlataforma[] {
  const result: Record<string, VentasPorPlataforma> = {};
  const isUber = (name: string) => name.trim().toLowerCase() === 'uber';

  for (const item of data) {
    const key = isUber(item.plataforma) ? 'UBER' : item.plataforma;
    if (!result[key]) {
      result[key] = { ...item, plataforma: key };
    } else {
      // Sumar los valores
      result[key].total_ventas += item.total_ventas;
      result[key].total_unidades += item.total_unidades;
      result[key].total_documentos += item.total_documentos;
      result[key].margen_total += item.margen_total;
      // Recalcular porcentaje del total y margen después
    }
  }

  // Recalcular porcentajes
  const totalVentas = Object.values(result).reduce((sum, item) => sum + item.total_ventas, 0);
  for (const item of Object.values(result)) {
    item.porcentaje_del_total = totalVentas > 0 ? +(item.total_ventas / totalVentas * 100).toFixed(2) : 0;
    item.porcentaje_margen = item.total_ventas > 0 ? +(item.margen_total / item.total_ventas * 100).toFixed(2) : 0;
  }

  return Object.values(result);
}

export default function VentasPlataformaChart({ data }: VentasPlataformaChartProps) {
  // Vista por defecto: Torta
  const [view, setView] = useState<'pie' | 'bar' | 'table'>('pie');

  // Agrupar Uber
  const groupedData = groupUber(data);

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
          {groupedData.map((item, index) => (
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
      {/* Selector de vista tipo tabs (igual a otros gráficos) */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex rounded-md shadow-sm border border-gray-200 bg-gray-50">
          <button
            onClick={() => setView('bar')}
            className={`px-4 py-1 text-sm font-medium rounded-l-md focus:outline-none transition-colors ${view === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}
          >Barras</button>
          <button
            onClick={() => setView('pie')}
            className={`px-4 py-1 text-sm font-medium focus:outline-none transition-colors border-l border-r border-gray-200 ${view === 'pie' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}
          >Torta</button>
          <button
            onClick={() => setView('table')}
            className={`px-4 py-1 text-sm font-medium rounded-r-md focus:outline-none transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}
          >Tabla</button>
        </div>
      </div>

      {/* Contenido de la vista seleccionada */}
      {view === 'bar' && (
        <div className="w-full h-96 overflow-x-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Ventas por Plataforma (Barras)</h4>
          <ResponsiveContainer width={groupedData.length > 8 ? groupedData.length * 60 : '100%'} height="100%" minWidth={500}>
            <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
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
      )}

      {view === 'pie' && (
        <div className="w-full h-96">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Participación por Plataforma (Torta)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={groupedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomPieLabel}
                outerRadius={110}
                fill="#8884d8"
                dataKey="total_ventas"
                nameKey="plataforma"
              >
                {groupedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  formatCurrency(value),
                  `Ventas - ${props.payload.plataforma}`
                ]}
              />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'table' && <TableView />}
    </div>
  );
} 