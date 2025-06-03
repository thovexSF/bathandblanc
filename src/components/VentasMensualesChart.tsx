'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, BarChart3, TrendingUp, Table, Copy, Calendar } from 'lucide-react';
import { VentasMensuales } from '@/lib/queries';
import * as XLSX from 'xlsx';

interface VentasMensualesChartProps {
  data: VentasMensuales[];
}

interface VentasAcumuladas {
  mes: number;
  mes_nombre: string;
  ventas_2024: number;
  ventas_2025: number;
  diferencia: number;
  crecimiento_porcentual: number;
  ventas_2024_acum: number;
  ventas_2025_acum: number;
  diferencia_acum: number;
  crecimiento_porcentual_acum: number;
}

export default function VentasMensualesChart({ data }: VentasMensualesChartProps) {
  const [showAccumulated, setShowAccumulated] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [maxMonth, setMaxMonth] = useState<number>(12);

  // Helper function para conversión segura
  const toNumber = (value: string | number): number => {
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
  };

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

  const formatCurrencyTable = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular datos acumulados
  const dataWithAccumulated = useMemo((): VentasAcumuladas[] => {
    // Primero ordenar los datos por mes para asegurar el cálculo correcto del acumulado
    const sortedData = [...data].sort((a, b) => a.mes - b.mes);
    
    // Encontrar el último mes con datos reales para cada año
    const lastMonthWith2024Data = sortedData.findLast(item => toNumber(item.ventas_2024) > 0)?.mes || 0;
    const lastMonthWith2025Data = sortedData.findLast(item => toNumber(item.ventas_2025) > 0)?.mes || 0;
    const lastMonthWithData = Math.max(lastMonthWith2024Data, lastMonthWith2025Data);
    
    let acum2024 = 0;
    let acum2025 = 0;
    
    const result = sortedData.map((item) => {
      // Convertir strings a números de forma segura
      const ventas2024 = toNumber(item.ventas_2024);
      const ventas2025 = toNumber(item.ventas_2025);
      const diferencia = toNumber(item.diferencia);
      const crecimiento_porcentual = toNumber(item.crecimiento_porcentual);
      
      acum2024 += ventas2024;
      acum2025 += ventas2025;
      
      const diferencia_acum = acum2025 - acum2024;
      const crecimiento_porcentual_acum = acum2024 > 0 
        ? Math.round(((acum2025 - acum2024) / acum2024) * 100 * 100) / 100
        : 0;

      const itemWithAccum: VentasAcumuladas = {
        mes: item.mes,
        mes_nombre: item.mes_nombre,
        ventas_2024: ventas2024,
        ventas_2025: ventas2025,
        diferencia: diferencia,
        crecimiento_porcentual: crecimiento_porcentual,
        ventas_2024_acum: acum2024,
        ventas_2025_acum: acum2025,
        diferencia_acum,
        crecimiento_porcentual_acum
      };
      
      return itemWithAccum;
    });
    
    // Filtrar solo hasta el último mes con datos cuando estamos en modo acumulado
    const filteredResult = showAccumulated ? 
      result.filter(item => item.mes <= lastMonthWithData) : 
      result;
    
    return filteredResult;
  }, [data, showAccumulated]);

  // Filtrar por mes máximo seleccionado
  const finalData = useMemo(() => {
    const baseData = showAccumulated ? dataWithAccumulated : data;
    return baseData.filter(item => item.mes <= maxMonth);
  }, [showAccumulated, dataWithAccumulated, data, maxMonth]);

  const displayData = finalData;
  const dataKey2024 = showAccumulated ? 'ventas_2024_acum' : 'ventas_2024';
  const dataKey2025 = showAccumulated ? 'ventas_2025_acum' : 'ventas_2025';

  const exportToExcel = () => {
    // Preparar datos para la exportación
    const exportData = dataWithAccumulated.map((item) => ({
      'Mes': item.mes_nombre,
      'Ventas 2024': formatCurrencyFull(item.ventas_2024),
      'Ventas 2025': formatCurrencyFull(item.ventas_2025),
      'Diferencia': formatCurrencyFull(item.diferencia),
      'Crecimiento %': `${item.crecimiento_porcentual}%`,
      'Ventas 2024 Acumulado': formatCurrencyFull(item.ventas_2024_acum),
      'Ventas 2025 Acumulado': formatCurrencyFull(item.ventas_2025_acum),
      'Diferencia Acumulada': formatCurrencyFull(item.diferencia_acum),
      'Crecimiento Acumulado %': `${item.crecimiento_porcentual_acum}%`
    }));

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Hoja 1: Comparativo Mensual
    const wsMensual = XLSX.utils.json_to_sheet(exportData.map(item => ({
      'Mes': item.Mes,
      'Ventas 2024': item['Ventas 2024'],
      'Ventas 2025': item['Ventas 2025'],
      'Diferencia': item.Diferencia,
      'Crecimiento %': item['Crecimiento %']
    })));
    
    // Hoja 2: Comparativo Acumulado
    const wsAcumulado = XLSX.utils.json_to_sheet(exportData.map(item => ({
      'Mes': item.Mes,
      'Ventas 2024 Acumulado': item['Ventas 2024 Acumulado'],
      'Ventas 2025 Acumulado': item['Ventas 2025 Acumulado'],
      'Diferencia Acumulada': item['Diferencia Acumulada'],
      'Crecimiento Acumulado %': item['Crecimiento Acumulado %']
    })));

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(wb, wsMensual, 'Comparativo Mensual');
    XLSX.utils.book_append_sheet(wb, wsAcumulado, 'Comparativo Acumulado');

    // Descargar archivo
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    XLSX.writeFile(wb, `Ventas_Comparativas_${fecha}.xlsx`);
  };

  const copyTableToClipboard = async () => {
    const tableData = displayData.map(item => {
      if (showAccumulated) {
        const accum = item as VentasAcumuladas;
        return [
          accum.mes_nombre,
          formatCurrencyTable(accum.ventas_2024_acum),
          formatCurrencyTable(accum.ventas_2025_acum),
          formatCurrencyTable(accum.diferencia_acum),
          `${accum.crecimiento_porcentual_acum}%`
        ].join('\t');
      } else {
        return [
          item.mes_nombre,
          formatCurrencyTable(toNumber(item.ventas_2024)),
          formatCurrencyTable(toNumber(item.ventas_2025)),
          formatCurrencyTable(toNumber(item.diferencia)),
          `${toNumber(item.crecimiento_porcentual)}%`
        ].join('\t');
      }
    });

    const headers = showAccumulated ? 
      ['Mes', '2024 Acumulado', '2025 Acumulado', 'Diferencia Acum.', 'Crecimiento Acum.'].join('\t') :
      ['Mes', '2024', '2025', 'Diferencia', 'Crecimiento'].join('\t');
    
    const tableText = [headers, ...tableData].join('\n');
    
    try {
      await navigator.clipboard.writeText(tableText);
      // Aquí podrías agregar una notificación de éxito
      alert('Tabla copiada al portapapeles');
    } catch (err) {
      console.error('Error al copiar tabla:', err);
      alert('Error al copiar tabla');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = showAccumulated 
        ? dataWithAccumulated.find(d => d.mes_nombre === label) as VentasAcumuladas
        : data.find(d => d.mes_nombre === label);
        
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
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
          {item && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-sm">
                <span className="text-gray-600">
                  {showAccumulated ? 'Diferencia acumulada: ' : 'Diferencia: '}
                </span>
                <span className={`font-medium ${
                  (showAccumulated 
                    ? (item as VentasAcumuladas).diferencia_acum 
                    : toNumber((item as any).diferencia)
                  ) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(showAccumulated 
                    ? (item as VentasAcumuladas).diferencia_acum 
                    : toNumber((item as any).diferencia)
                  )}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Crecimiento: </span>
                <span className={`font-medium ${
                  (showAccumulated 
                    ? (item as VentasAcumuladas).crecimiento_porcentual_acum 
                    : toNumber((item as any).crecimiento_porcentual)
                  ) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showAccumulated 
                    ? (item as VentasAcumuladas).crecimiento_porcentual_acum 
                    : toNumber((item as any).crecimiento_porcentual)
                  }%
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Mes
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              {showAccumulated ? '2024 Acumulado' : '2024'}
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              {showAccumulated ? '2025 Acumulado' : '2025'}
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              {showAccumulated ? 'Diferencia Acum.' : 'Diferencia'}
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              {showAccumulated ? 'Crecimiento Acum.' : 'Crecimiento'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {displayData.map((item, index) => {
            const isAccum = showAccumulated && 'ventas_2024_acum' in item;
            const ventas2024 = isAccum ? (item as VentasAcumuladas).ventas_2024_acum : toNumber(item.ventas_2024);
            const ventas2025 = isAccum ? (item as VentasAcumuladas).ventas_2025_acum : toNumber(item.ventas_2025);
            const diferencia = isAccum ? (item as VentasAcumuladas).diferencia_acum : toNumber(item.diferencia);
            const crecimiento = isAccum ? (item as VentasAcumuladas).crecimiento_porcentual_acum : toNumber(item.crecimiento_porcentual);
            
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                  {item.mes_nombre}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                  {formatCurrencyTable(ventas2024)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                  {formatCurrencyTable(ventas2025)}
                </td>
                <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                  diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrencyTable(diferencia)}
                </td>
                <td className={`px-4 py-2 text-sm text-right border-b font-medium ${
                  crecimiento >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {crecimiento}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Tipo de vista */}
          <button
            onClick={() => {
              setShowAccumulated(false);
            }}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              !showAccumulated 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Mensual
          </button>
          <button
            onClick={() => {
              setShowAccumulated(true);
            }}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showAccumulated 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Acumulado
          </button>

          {/* Vista gráfico/tabla */}
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
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

          {/* Selector de mes límite */}
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <label className="text-sm text-gray-600">Hasta:</label>
            <select
              value={maxMonth}
              onChange={(e) => setMaxMonth(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {data.map(item => (
                <option key={item.mes} value={item.mes}>
                  {item.mes_nombre}
                </option>
              ))}
            </select>
          </div>
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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="mes_nombre" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey={dataKey2024}
                name={showAccumulated ? "2024 Acumulado" : "2024"} 
                fill="#3b82f6" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey={dataKey2025}
                name={showAccumulated ? "2025 Acumulado" : "2025"} 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 