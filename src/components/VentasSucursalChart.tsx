'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Table, Download, Copy } from 'lucide-react';
import { VentasPorSucursal } from '@/lib/queries';
import * as XLSX from 'xlsx';

interface VentasSucursalChartProps {
  data: VentasPorSucursal[];
}

export default function VentasSucursalChart({ data }: VentasSucursalChartProps) {
  const [showTable, setShowTable] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportToExcel = () => {
    // Preparar datos para la exportación
    const exportData = data.map((item, index) => ({
      'Ranking': `#${index + 1}`,
      'Sucursal': item.sucursal,
      'Empresa': item.empresa,
      'Total Ventas': formatCurrencyFull(item.total_ventas),
      'Documentos': item.total_documentos,
      'Ticket Promedio': formatCurrencyFull(item.ticket_promedio)
    }));

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Sucursal');

    // Descargar archivo
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    XLSX.writeFile(wb, `Ventas_Sucursales_${fecha}.xlsx`);
  };

  const copyTableToClipboard = async () => {
    const tableData = data.map((item, index) => {
      return [
        `#${index + 1}`,
        item.sucursal,
        formatCurrencyFull(item.total_ventas),
        item.total_documentos.toLocaleString('es-CL'),
        formatCurrencyFull(item.ticket_promedio)
      ].join('\t');
    });

    const headers = ['Ranking', 'Sucursal', 'Total Ventas', 'Documentos', 'Ticket Promedio'].join('\t');
    const tableText = [headers, ...tableData].join('\n');
    
    try {
      await navigator.clipboard.writeText(tableText);
      // Aquí podrías agregar una notificación de éxito si quisieras
    } catch (err) {
      console.error('Error al copiar tabla:', err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Mostrar todas las sucursales (máximo 9)
  const sucursalesToShow = data.slice(0, 9);

  // Preparar datos para el gráfico - ahora con nombres completos
  const chartData = sucursalesToShow.map((item, index) => {
    return {
      name: item.sucursal, // Nombre completo
      fullName: item.sucursal,
      empresa: item.empresa,
      total_ventas: item.total_ventas,
      total_documentos: item.total_documentos,
      ticket_promedio: item.ticket_promedio,
      ranking: index + 1
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">#{data.ranking} - {data.fullName}</p>
            <p className="text-sm text-gray-600">{data.empresa}</p>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Ventas: </span>
                <span className="font-medium">{formatCurrencyFull(data.total_ventas)}</span>
              </div>
              <div>
                <span className="text-gray-600">Documentos: </span>
                <span className="font-medium">{data.total_documentos.toLocaleString('es-CL')}</span>
              </div>
              <div>
                <span className="text-gray-600">Ticket promedio: </span>
                <span className="font-medium">{formatCurrencyFull(data.ticket_promedio)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Función para renderizar los labels de ranking
  const renderRankingLabel = (props: any) => {
    const { x, y, width, payload } = props;
    
    // Validación para evitar errores si payload no está definido
    if (!payload || !payload.ranking) {
      return null;
    }
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="12"
        fontWeight="600"
      >
        #{payload.ranking}
      </text>
    );
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Ranking
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Sucursal
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Total Ventas
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Documentos
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Ticket Promedio
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((sucursal, index) => (
            <tr key={sucursal.sucursal} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                #{index + 1}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 border-b">
                {sucursal.sucursal}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b font-medium">
                {formatCurrencyFull(sucursal.total_ventas)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {sucursal.total_documentos.toLocaleString('es-CL')}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                {formatCurrencyFull(sucursal.ticket_promedio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showTable 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table className="h-4 w-4 mr-1" />
            {showTable ? 'Ver Gráfico' : 'Ver Tabla'}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {showTable && (
            <button
              onClick={copyTableToClipboard}
              className="flex items-center px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-sm font-medium transition-colors"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar Tabla
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Contenido */}
      {showTable ? (
        <TableView />
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name"
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
                dataKey="total_ventas" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              >
                <LabelList content={renderRankingLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 