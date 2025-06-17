'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Download, BarChart3, TrendingUp, Table, Copy, Calendar, Filter, X } from 'lucide-react';
import { VentasMensuales, Filtros } from '@/lib/queries';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import FilterPanel from '@/components/FilterPanel';
import { useState, useMemo, useEffect } from 'react';

interface VentasMensualesChartProps {
  data: VentasMensuales[];
  tiposDocumento: any[];
  plataformas: any[];
  empresas: string[];
  sucursales: string[];
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

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function VentasMensualesChart({ data: initialData, tiposDocumento, plataformas, empresas, sucursales }: VentasMensualesChartProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(MONTHS);
  const [selectedDays, setSelectedDays] = useState<number[]>(DAYS);
  const [chartData, setChartData] = useState<VentasMensuales[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [showAccumulated, setShowAccumulated] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxMonth, setMaxMonth] = useState<number>(12);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'mensual' | 'diaria' | 'anual'>('mensual');
  const [filtros, setFiltros] = useState<{ tipoDocumento?: string[]; plataforma?: string[]; empresa?: string[] }>({});

  useEffect(() => {
    fetch('/api/available-years')
      .then(res => res.json())
      .then(data => {
        setAvailableYears(data.years);
        setSelectedYears(data.years);
      });
  }, []);

  useEffect(() => {
    setFiltros(f => ({
      ...f,
      tipoDocumento: tiposDocumento
        .map(t => t.tipo_documento)
        .filter(td => td.toUpperCase().includes('BOLETA') || td.toUpperCase().includes('FACTURA')),
      plataforma: plataformas.map(p => p.plataforma),
      empresa: empresas
    }));
  }, [tiposDocumento, plataformas, empresas]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const filtrosAny = filtros as Record<string, any>;
        Object.entries(filtrosAny).forEach(([key, values]) => {
          if (Array.isArray(values)) {
            values.forEach((v) => params.append(key, String(v)));
          } else if (values) {
            params.append(key, String(values));
          }
        });
        selectedYears.forEach((y) => params.append('años', y.toString()));
        selectedMonths.forEach((m) => params.append('meses', m.toString()));
        selectedDays.forEach((d) => params.append('dias', d.toString()));
        params.append('viewMode', viewMode);
        const res = await fetch(`/api/ventas-mensuales?${params.toString()}`);
        const json = await res.json();
        setChartData(json);
      } catch (e) {
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filtros, selectedYears, selectedMonths, selectedDays, viewMode]);

  const handleLocalFiltrosChange = (f: Filtros) => {
    setFiltros(f);
    if (f.años) setSelectedYears(f.años);
    if (f.meses) setSelectedMonths(f.meses);
    if (f.dias) setSelectedDays(f.dias);
  };

  const handleDaysChange = (days: number[]) => {
    setSelectedDays(days);
  };

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

  const dataWithAccumulated = useMemo((): VentasAcumuladas[] => {
    const sortedData = [...chartData].sort((a, b) => a.mes - b.mes);
    
    const lastMonthWith2024Data = sortedData.findLast(item => toNumber(item.ventas_2024) > 0)?.mes || 0;
    const lastMonthWith2025Data = sortedData.findLast(item => toNumber(item.ventas_2025) > 0)?.mes || 0;
    const lastMonthWithData = Math.max(lastMonthWith2024Data, lastMonthWith2025Data);
    
    let acum2024 = 0;
    let acum2025 = 0;
    
    const result = sortedData.map((item) => {
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
    
    const filteredResult = showAccumulated ? 
      result.filter(item => item.mes <= lastMonthWithData) : 
      result;
    
    return filteredResult;
  }, [chartData, showAccumulated]);

  const finalData = useMemo(() => {
    const baseData = showAccumulated ? dataWithAccumulated : chartData;
    return baseData.filter(item => item.mes <= maxMonth);
  }, [showAccumulated, dataWithAccumulated, chartData, maxMonth]);

  const displayData = finalData;
  const dataKey2024 = showAccumulated ? 'ventas_2024_acum' : 'ventas_2024';
  const dataKey2025 = showAccumulated ? 'ventas_2025_acum' : 'ventas_2025';

  const totalVendido = displayData.reduce((acc, item) => acc + toNumber(item.ventas_2024) + toNumber(item.ventas_2025), 0);

  const exportToExcel = () => {
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

    const wb = XLSX.utils.book_new();
    
    const wsMensual = XLSX.utils.json_to_sheet(exportData.map(item => ({
      'Mes': item.Mes,
      'Ventas 2024': item['Ventas 2024'],
      'Ventas 2025': item['Ventas 2025'],
      'Diferencia': item.Diferencia,
      'Crecimiento %': item['Crecimiento %']
    })));
    
    const wsAcumulado = XLSX.utils.json_to_sheet(exportData.map(item => ({
      'Mes': item.Mes,
      'Ventas 2024 Acumulado': item['Ventas 2024 Acumulado'],
      'Ventas 2025 Acumulado': item['Ventas 2025 Acumulado'],
      'Diferencia Acumulada': item['Diferencia Acumulada'],
      'Crecimiento Acumulado %': item['Crecimiento Acumulado %']
    })));

    XLSX.utils.book_append_sheet(wb, wsMensual, 'Comparativo Mensual');
    XLSX.utils.book_append_sheet(wb, wsAcumulado, 'Comparativo Acumulado');

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
      alert('Tabla copiada al portapapeles');
    } catch (err) {
      console.error('Error al copiar tabla:', err);
      alert('Error al copiar tabla');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <div className="text-sm text-gray-700">Ventas 2024: <span className="font-medium">{data.ventas_2024?.toLocaleString('es-CL')}</span></div>
          <div className="text-sm text-gray-700">Ventas 2025: <span className="font-medium">{data.ventas_2025?.toLocaleString('es-CL')}</span></div>
          <div className="text-sm text-blue-700 font-semibold">Variación: {data.variacion?.toFixed(1)}%</div>
        </div>
      );
    }
    return null;
  };

  let xKey = 'mes';
  let xLabel = 'mes_nombre';
  if (viewMode === 'diaria') {
    xKey = 'dia';
    xLabel = 'dia_nombre';
  } else if (viewMode === 'anual') {
    xKey = 'año';
    xLabel = 'año_nombre';
  }

  // Calcular variación porcentual para cada mes
  const chartDataWithVariacion = chartData.map(item => ({
    ...item,
    variacion: Number(item.ventas_2024) > 0
      ? ((Number(item.ventas_2025) - Number(item.ventas_2024)) / Number(item.ventas_2024)) * 100
      : 0
  }));

  if (!chartData || chartData.length === 0) {
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

  const filtrosAny = filtros as Record<string, any>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border mb-4">
        <div className="flex items-center mb-3">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-900">Filtros de Fecha</h4>
          {(selectedYears.length > 0 || selectedMonths.length > 0 || selectedDays.length > 0) && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {selectedYears.length + selectedMonths.length + selectedDays.length} seleccionado(s)
            </span>
          )}
        </div>
        <div className="mb-3">
          <div className="flex items-center space-x-3">
            <h5 className="text-xs font-medium text-gray-600 w-12">Años:</h5>
            <div className="flex space-x-2">
              {availableYears.map(year => (
                <label key={year} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => setSelectedYears(selectedYears.includes(year) ? selectedYears.filter(y => y !== year) : [...selectedYears, year])}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700">{year}</span>
                </label>
              ))}
              <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedYears.length === availableYears.length}
                  onChange={() => setSelectedYears(selectedYears.length === availableYears.length ? [] : availableYears)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-xs text-gray-700 font-medium">Todos</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center space-x-3">
            <h5 className="text-xs font-medium text-gray-600 w-12">Meses:</h5>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(month => (
                <label key={month} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month)}
                    onChange={() => setSelectedMonths(selectedMonths.includes(month) ? selectedMonths.filter(m => m !== month) : [...selectedMonths, month])}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700">{month}</span>
                </label>
              ))}
              <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedMonths.length === MONTHS.length}
                  onChange={() => setSelectedMonths(selectedMonths.length === MONTHS.length ? [] : MONTHS)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-xs text-gray-700 font-medium">Todos</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center space-x-3">
            <h5 className="text-xs font-medium text-gray-600 w-12">Días:</h5>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <label key={day} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => {
                      if (!selectedDays.includes(day)) {
                        setSelectedDays(Array.from({ length: day }, (_, i) => i + 1));
                      } else {
                        setSelectedDays(selectedDays.filter(d => d < day));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700">{day}</span>
                </label>
              ))}
              <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedDays.length === DAYS.length}
                  onChange={() => setSelectedDays(selectedDays.length === DAYS.length ? [] : DAYS)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-xs text-gray-700 font-medium">Todos</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Filtros adicionales</span>
          {Object.keys(filtrosAny).filter(key => Array.isArray(filtrosAny[key]) && filtrosAny[key].length > 0).length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {Object.keys(filtrosAny).filter(key => Array.isArray(filtrosAny[key]) && filtrosAny[key].length > 0).length}
            </span>
          )}
        </button>
        {showFilters && (
          <div className="absolute z-50 mt-2 w-[400px] bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros adicionales</h3>
              <div className="flex items-center space-x-2">
                {Object.keys(filtrosAny).filter(key => Array.isArray(filtrosAny[key]) && filtrosAny[key].length > 0).length > 0 && (
                  <button
                    onClick={() => {
                      Object.keys(filtrosAny).forEach(key => {
                        if (Array.isArray(filtrosAny[key])) {
                          setFiltros(f => ({
                            ...f,
                            [key]: []
                          }));
                        }
                      });
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar todo
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tipo de Documento
                  </label>
                  {filtros.tipoDocumento && filtros.tipoDocumento.length > 0 && (
                    <button
                      onClick={() => setFiltros(f => ({ ...f, tipoDocumento: [] }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                  {tiposDocumento.map((tipo) => (
                    <label key={tipo.tipo_documento} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filtros.tipoDocumento?.includes(tipo.tipo_documento) || false}
                        onChange={(e) => setFiltros(f => ({
                          ...f,
                          tipoDocumento: e.target.checked ? [...(f.tipoDocumento || []), tipo.tipo_documento] : f.tipoDocumento?.filter(td => td !== tipo.tipo_documento)
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex-1">
                        {tipo.tipo_documento} <span className="text-gray-500">({tipo.total_documentos?.toLocaleString('es-CL') ?? 0})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Plataforma
                  </label>
                  {filtros.plataforma && filtros.plataforma.length > 0 && (
                    <button
                      onClick={() => setFiltros(f => ({ ...f, plataforma: [] }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                  {plataformas.map((plataforma) => (
                    <label key={plataforma.plataforma} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filtros.plataforma?.includes(plataforma.plataforma) || false}
                        onChange={(e) => setFiltros(f => ({
                          ...f,
                          plataforma: e.target.checked ? [...(f.plataforma || []), plataforma.plataforma] : f.plataforma?.filter(p => p !== plataforma.plataforma)
                        }))}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="flex-1">
                        {plataforma.plataforma} <span className="text-gray-500">({plataforma.total_documentos?.toLocaleString('es-CL') ?? 0})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  {filtros.empresa && filtros.empresa.length > 0 && (
                    <button
                      onClick={() => setFiltros(f => ({ ...f, empresa: [] }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                  {empresas.map((empresa) => (
                    <label key={empresa} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filtros.empresa?.includes(empresa) || false}
                        onChange={(e) => setFiltros(f => ({
                          ...f,
                          empresa: e.target.checked ? [...(f.empresa || []), empresa] : f.empresa?.filter(e => e !== empresa)
                        }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex-1">{empresa}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button
          className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors ${viewMode === 'mensual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setViewMode('mensual')}
        >
          Mensual
        </button>
        <button
          className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors ${viewMode === 'diaria' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setViewMode('diaria')}
        >
          Diaria
        </button>
        <button
          className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors ${viewMode === 'anual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setViewMode('anual')}
        >
          Anual
        </button>
      </div>
      <div className="flex items-center mb-2 gap-8">
        <div>
          <span className="text-lg font-semibold text-gray-700 mr-2">Total vendido:</span>
          <span className="text-2xl font-bold text-blue-700">{formatCurrency(totalVendido)}</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
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
            <Table className="h-4 w-4" />
            <span>Tabla</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={copyTableToClipboard}
            className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar</span>
          </button>
        </div>
      </div>

      {showTable ? (
        <TableView />
      ) : (
        <div className="bg-white p-4 rounded-lg border">
          <ResponsiveContainer width="100%" height={400}>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <BarChart data={chartDataWithVariacion} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={xLabel}
                  stroke="#6b7280"
                  fontSize={11}
                  angle={viewMode === 'diaria' ? 0 : -45}
                  textAnchor={viewMode === 'diaria' ? 'middle' : 'end'}
                  height={viewMode === 'diaria' ? 40 : 80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={formatCurrencyTable}
                />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="ventas_2024"
                  name="2024" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="ventas_2025"
                  name="2025" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                >
                  <LabelList dataKey="variacion" position="top" formatter={(value: number) => `${value.toFixed(1)}%`} />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 