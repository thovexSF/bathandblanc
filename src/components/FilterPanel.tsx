'use client';

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { TipoDocumento, Filtros } from '@/lib/queries';

interface FilterPanelProps {
  tiposDocumento: TipoDocumento[];
  empresas: string[];
  sucursales: string[];
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
}

export default function FilterPanel({ 
  tiposDocumento, 
  empresas, 
  sucursales, 
  filtros, 
  onFiltrosChange
}: FilterPanelProps) {
  const [showFilters, setShowFilters] = useState(true);

  // Auto-hide de filtros después de 5 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFilters(false);
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, []);

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
  };

  const clearFilter = (key: keyof Filtros) => {
    const newFiltros = { ...filtros };
    delete newFiltros[key];
    onFiltrosChange(newFiltros);
  };

  const hasActiveFilters = Object.values(filtros).some(value => value && value.length > 0);
  const activeFiltersCount = Object.values(filtros).reduce((count, value) => {
    return count + (value ? value.length : 0);
  }, 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      {/* Header del panel de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
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
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} filtros
          </button>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
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
      )}
    </div>
  );
} 