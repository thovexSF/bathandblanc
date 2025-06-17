'use client';

import { Calendar, X } from 'lucide-react';

interface DateFilterPanelProps {
  selectedYears: number[];
  selectedMonths: number[];
  onYearsChange: (years: number[]) => void;
  onMonthsChange: (months: number[]) => void;
  onClearAll: () => void;
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

export default function DateFilterPanel({
  selectedYears,
  selectedMonths,
  onYearsChange,
  onMonthsChange,
  onClearAll
}: DateFilterPanelProps) {
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

  const hasActiveFilters = selectedYears.length > 0 || selectedMonths.length > 0;

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Filtros de Fecha</h3>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {(selectedYears.length > 0 ? selectedYears.length : 0) + (selectedMonths.length > 0 ? selectedMonths.length : 0)} seleccionado(s)
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Filtro de Años - Horizontal */}
        <div>
          <div className="flex items-center space-x-3">
            <h4 className="text-xs font-medium text-gray-600 w-12">Años:</h4>
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
              {/* Checkbox "Todos" para años */}
              <label className="flex items-center space-x-1 cursor-pointer bg-gray-50 px-2 py-1 rounded">
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

        {/* Filtro de Meses - Horizontal */}
        <div>
          <div className="flex items-center space-x-3">
            <h4 className="text-xs font-medium text-gray-600 w-12">Meses:</h4>
            <div className="flex flex-wrap gap-1">
              {MONTHS.map(month => (
                <label 
                  key={month.value} 
                  className={`flex items-center space-x-1 cursor-pointer px-1 py-1 rounded transition-colors ${
                    selectedMonths.includes(month.value) ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month.value)}
                    onChange={() => handleMonthToggle(month.value)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-3 h-3"
                  />
                  <span className="text-xs text-gray-700">{month.label}</span>
                </label>
              ))}
              {/* Checkbox "Todos" para meses */}
              <label className="flex items-center space-x-1 cursor-pointer bg-gray-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedMonths.length === MONTHS.length}
                  onChange={handleSelectAllMonths}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-3 h-3"
                />
                <span className="text-xs text-gray-700 font-medium">Todos</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 