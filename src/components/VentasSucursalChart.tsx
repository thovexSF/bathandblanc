'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Table, Download, Copy, Filter, X, Calendar } from 'lucide-react';
import { VentasPorSucursal, TipoDocumento, Plataforma } from '@/lib/queries';
import * as XLSX from 'xlsx';
import { useState, useEffect } from 'react';

interface VentasSucursalChartProps {
  data: VentasPorSucursal[];
  tiposDocumento: TipoDocumento[];
  plataformas: Plataforma[];
  empresas: string[];
}

interface Filtros {
  tipoDocumento?: string[];
  plataforma?: string[];
  empresa?: string[];
}

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function VentasSucursalChart({ 
  data, 
  tiposDocumento = [], 
  plataformas = [], 
  empresas = []
}: VentasSucursalChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [filteredData, setFilteredData] = useState<VentasPorSucursal[]>([]);
  const [loading, setLoading] = useState(false);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(MONTHS);
  const [selectedDays, setSelectedDays] = useState<number[]>(DAYS);

  useEffect(() => {
    fetch('/api/available-years')
      .then(res => res.json())
      .then(data => {
        setAvailableYears(data.years);
        setSelectedYears(data.years);
      });
  }, []);

  // Inicializar solo los filtros adicionales
  useEffect(() => {
    setFiltros(f => ({
      ...f,
      tipoDocumento: tiposDocumento
        .map(t => t.tipo_documento)
        .filter(td => td.toUpperCase().includes('BOLETA') || td.toUpperCase().includes('FACTURA')),
      plataforma: plataformas.map(p => p.plataforma),
      empresa: empresas
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposDocumento, plataformas, empresas]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        selectedYears.forEach(y => params.append('años', y.toString()));
        selectedMonths.forEach(m => params.append('meses', m.toString()));
        selectedDays.forEach(d => params.append('dias', d.toString()));
        (filtros.tipoDocumento || []).forEach(td => params.append('tipoDocumento', td));
        (filtros.plataforma || []).forEach(p => params.append('plataforma', p));
        (filtros.empresa || []).forEach(e => params.append('empresa', e));
        const res = await fetch(`/api/ventas-sucursal?${params.toString()}`);
        const data = await res.json();
        setFilteredData(data);
      } catch (e) {
        setFilteredData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [
    selectedYears.join(','),
    selectedMonths.join(','),
    selectedDays.join(','),
    (filtros.tipoDocumento || []).join(','),
    (filtros.plataforma || []).join(','),
    (filtros.empresa || []).join(',')
  ]);

  const handleFilterChange = (filterType: keyof Filtros, value: string, checked: boolean) => {
    setFiltros(prev => {
      const currentValues = prev[filterType] || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      
      return {
        ...prev,
        [filterType]: newValues.length > 0 ? newValues : undefined
      };
    });
  };

  const clearFilter = (filterType: keyof Filtros) => {
    setFiltros(prev => ({
      ...prev,
      [filterType]: undefined
    }));
  };

  const clearAllFilters = () => {
    setFiltros({});
  };

  const hasActiveFilters = Object.values(filtros).some(value => value && value.length > 0);
  const activeFiltersCount = Object.values(filtros).filter(value => Array.isArray(value) && value.length > 0).length;

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
    const exportData = filteredData.map((item, index) => ({
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
    const tableData = filteredData.map((item, index) => {
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

  const handleYearToggle = (year: number) => {
    const newYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    setSelectedYears(newYears);
  };

  const handleMonthToggle = (month: number) => {
    const newMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month];
    setSelectedMonths(newMonths);
  };

  const handleDayToggle = (day: number) => {
    if (!selectedDays.includes(day)) {
      setSelectedDays(Array.from({ length: day }, (_, i) => i + 1));
    } else {
      setSelectedDays(selectedDays.filter(d => d < day));
    }
  };

  const handleSelectAllYears = () => {
    setSelectedYears(selectedYears.length === availableYears.length ? [] : availableYears);
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths(selectedMonths.length === MONTHS.length ? [] : MONTHS);
  };

  const handleSelectAllDays = () => {
    setSelectedDays(selectedDays.length === DAYS.length ? [] : DAYS);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando datos...</div>;
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Mostrar todas las sucursales (máximo 9)
  const sucursalesToShow = filteredData.slice(0, 9);

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
          {filteredData.map((sucursal, index) => (
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Ventas por Sucursal',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toLocaleString('es-CL')}`,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="relative">
        {/* Filtros de Fecha SIEMPRE visibles */}
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
          {/* Filtro de Años */}
          <div className="mb-3">
            <div className="flex items-center space-x-3">
              <h5 className="text-xs font-medium text-gray-600 w-12">Años:</h5>
              <div className="flex space-x-2">
                {availableYears.map(year => (
                  <label key={year} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{year}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedYears.length === availableYears.length}
                    onChange={handleSelectAllYears}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700 font-medium">Todos</span>
                </label>
              </div>
            </div>
          </div>
          {/* Filtro de Meses */}
          <div className="mb-3">
            <div className="flex items-center space-x-3">
              <h5 className="text-xs font-medium text-gray-600 w-12">Meses:</h5>
              <div className="flex flex-wrap gap-2">
                {MONTHS.map(month => (
                  <label key={month} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month)}
                      onChange={() => handleMonthToggle(month)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{month}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedMonths.length === MONTHS.length}
                    onChange={handleSelectAllMonths}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700 font-medium">Todos</span>
                </label>
              </div>
            </div>
          </div>
          {/* Filtro de Días */}
          <div className="mb-3">
            <div className="flex items-center space-x-3">
              <h5 className="text-xs font-medium text-gray-600 w-12">Días:</h5>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <label key={day} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{day}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedDays.length === DAYS.length}
                    onChange={handleSelectAllDays}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700 font-medium">Todos</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Botón y panel de filtros adicionales */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Filtros adicionales</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {showFilters && (
            <div className="absolute z-50 mt-2 w-[400px] bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros adicionales</h3>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
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
                {/* Filtro Tipo de Documento */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tipo de Documento
                    </label>
                    {filtros.tipoDocumento && filtros.tipoDocumento.length > 0 && (
                      <button
                        onClick={() => clearFilter('tipoDocumento')}
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
                          onChange={(e) => handleFilterChange('tipoDocumento', tipo.tipo_documento, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1">
                          {tipo.tipo_documento} <span className="text-gray-500">({tipo.total_documentos?.toLocaleString('es-CL') ?? 0})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Filtro Plataforma */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Plataforma
                    </label>
                    {filtros.plataforma && filtros.plataforma.length > 0 && (
                      <button
                        onClick={() => clearFilter('plataforma')}
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
                          onChange={(e) => handleFilterChange('plataforma', plataforma.plataforma, e.target.checked)}
                          className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="flex-1">
                          {plataforma.plataforma} <span className="text-gray-500">({plataforma.total_documentos?.toLocaleString('es-CL') ?? 0})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Filtro Empresa */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Empresa
                    </label>
                    {filtros.empresa && filtros.empresa.length > 0 && (
                      <button
                        onClick={() => clearFilter('empresa')}
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
                          onChange={(e) => handleFilterChange('empresa', empresa, e.target.checked)}
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
    </div>
  );
} 