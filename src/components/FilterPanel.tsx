'use client';

import React, { useState } from 'react';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { TipoDocumento, Plataforma, Filtros } from '@/lib/queries';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterPanelProps {
  tiposDocumento: TipoDocumento[];
  plataformas: Plataforma[];
  empresas: string[];
  sucursales: string[];
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  selectedYears: number[];
  selectedMonths: number[];
  onYearsChange: (years: number[]) => void;
  onMonthsChange: (months: number[]) => void;
  selectedDays?: number[];
  onDaysChange?: (days: number[]) => void;
}

const AVAILABLE_YEARS = [2024, 2025];
const MONTHS = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' }
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function FilterPanel({ 
  tiposDocumento = [], 
  plataformas = [], 
  empresas = [], 
  sucursales = [], 
  filtros, 
  onFiltrosChange,
  selectedYears = [],
  selectedMonths = [],
  onYearsChange,
  onMonthsChange,
  selectedDays = [],
  onDaysChange
}: FilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleFilterChange = (key: keyof Filtros, value: string, checked: boolean) => {
    const currentValues = (filtros[key] || []) as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    const newFiltros = {
      ...filtros,
      [key]: newValues.length > 0 ? newValues : undefined
    };
    onFiltrosChange(newFiltros);
  };

  const clearAllFilters = () => {
    onFiltrosChange({});
    onYearsChange([]);
    onMonthsChange([]);
    onDaysChange?.([]);
  };

  const clearFilter = (key: keyof Filtros) => {
    const newFiltros = { ...filtros };
    delete newFiltros[key];
    onFiltrosChange(newFiltros);
  };

  // Funciones para filtros de fecha
  const handleYearToggle = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter(y => y !== year));
    } else {
      onYearsChange([...selectedYears, year]);
    }
  };

  const handleMonthToggle = (month: number) => {
    if (selectedMonths.includes(month)) {
      onMonthsChange(selectedMonths.filter(m => m !== month));
    } else {
      onMonthsChange([...selectedMonths, month]);
    }
  };

  const handleSelectAllYears = () => {
    if (selectedYears.length === AVAILABLE_YEARS.length) {
      onYearsChange([]);
    } else {
      onYearsChange([...AVAILABLE_YEARS]);
    }
  };

  const handleSelectAllMonths = () => {
    if (selectedMonths.length === MONTHS.length) {
      onMonthsChange([]);
    } else {
      onMonthsChange(MONTHS.map(m => m.value));
    }
  };

  // Nueva función para manejar el cambio de fechas
  const handleDateChange = (date: Date | null, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date);
      const newFiltros = { ...filtros, fechaInicio: date ? date.toISOString() : undefined };
      onFiltrosChange(newFiltros);
    } else {
      setEndDate(date);
      const newFiltros = { ...filtros, fechaFin: date ? date.toISOString() : undefined };
      onFiltrosChange(newFiltros);
    }
  };

  // Handler para días
  const handleDayToggle = (day: number) => {
    if (!onDaysChange) return;
    let newDays: number[] = [];
    if (!selectedDays?.includes(day)) {
      // Seleccionar todos los días desde 1 hasta day
      newDays = Array.from({ length: day }, (_, i) => i + 1);
    } else {
      // Deseleccionar: dejar solo los días menores a day
      newDays = (selectedDays || []).filter(d => d < day);
    }
    onDaysChange(newDays);
  };

  const handleSelectAllDays = () => {
    if (!onDaysChange) return;
    if (selectedDays?.length === DAYS.length) {
      onDaysChange([]);
    } else {
      onDaysChange([...DAYS]);
    }
  };

  const hasActiveFilters = Object.values(filtros).some(value => value && value.length > 0);
  const activeFiltersCount = Object.values(filtros).reduce((count, value) => {
    return count + (value ? value.length : 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Filtros de Fecha - Siempre visibles */}
      <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Filtros de Fecha</h4>
              {(selectedYears.length > 0 || selectedMonths.length > 0 || selectedDays?.length > 0) && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {selectedYears.length + selectedMonths.length + selectedDays?.length} seleccionado(s)
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {/* Filtro de Años */}
              <div>
                <div className="flex items-center space-x-3">
                  <h5 className="text-xs font-medium text-gray-600 w-12">Años:</h5>
                  <div className="flex space-x-2">
                    {AVAILABLE_YEARS.map(year => (
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
                        checked={selectedYears.length === AVAILABLE_YEARS.length}
                        onChange={handleSelectAllYears}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span className="text-xs text-gray-700 font-medium">Todos</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filtro de Meses */}
              <div>
                <div className="flex items-center space-x-3">
                  <h5 className="text-xs font-medium text-gray-600 w-12">Meses:</h5>
                  <div className="flex flex-wrap gap-2">
                    {MONTHS.map(month => (
                      <label key={month.value} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month.value)}
                          onChange={() => handleMonthToggle(month.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">{month.label}</span>
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
              <div>
                <div className="flex items-center space-x-3">
                  <h5 className="text-xs font-medium text-gray-600 w-12">Días:</h5>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <label key={day} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDays?.includes(day) || false}
                          onChange={() => handleDayToggle(day)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">{day}</span>
                      </label>
                    ))}
                    <label className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedDays?.length === DAYS.length}
                        onChange={handleSelectAllDays}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span className="text-xs text-gray-700 font-medium">Todos</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Botón y panel de filtros adicionales */}
      <div className="relative">
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
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} />
        </button>

        {/* Panel de filtros desplegable */}
        {showFilters && (
          <div className="absolute z-50 mt-2 w-[800px] bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Filtros adicionales</h3>
              </div>
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

            <div className="grid grid-cols-2 gap-6">
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
                      {tipo.tipo_documento} <span className="text-gray-500">({tipo.total_documentos.toLocaleString('es-CL')})</span>
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
                      {plataforma.plataforma} <span className="text-gray-500">({plataforma.total_documentos.toLocaleString('es-CL')})</span>
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

            {/* Filtro Sucursal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Sucursal
                </label>
                {filtros.sucursal && filtros.sucursal.length > 0 && (
                  <button
                    onClick={() => clearFilter('sucursal')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                {sucursales.map((sucursal) => (
                  <label key={sucursal} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filtros.sucursal?.includes(sucursal) || false}
                      onChange={(e) => handleFilterChange('sucursal', sucursal, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="flex-1">{sucursal}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 