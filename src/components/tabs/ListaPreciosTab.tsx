"use client"

import { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useResizableColumns, ResizableColumn } from '../../hooks/useResizableColumns';
import ResizableHeader from '../ui/ResizableHeader';

interface ListaPrecio {
  id: number;
  sku: string;
  empresa: string;
  precio_sin_iva: number;
  precio_con_iva: number;
  fecha_actualizacion: string;
  fecha_creacion: string;
  nombre_producto: string;
  descripcion_variante: string;
  id_variante_bsale: number;
}

interface Stats {
  skus_unicos: number;
  empresas_activas: number;
  ultima_actualizacion: string;
  precio_promedio: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export default function ListaPreciosTab() {
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<Stats>({
    skus_unicos: 0,
    empresas_activas: 0,
    ultima_actualizacion: '',
    precio_promedio: 0
  });

  // Filtros
  const [empresa, setEmpresa] = useState('');
  const [sku, setSku] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Ordenamiento
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'fecha_actualizacion',
    direction: 'desc'
  });

  // Configuración de columnas redimensionables
  const initialColumns: ResizableColumn[] = [
    { key: 'sku', width: 150, minWidth: 100, maxWidth: 200 },
    { key: 'producto', width: 350, minWidth: 200, maxWidth: 500 },
    { key: 'empresa', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'precio_sin_iva', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'precio_con_iva', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'fecha_actualizacion', width: 140, minWidth: 100, maxWidth: 200 }
  ];

  const {
    columns,
    isResizing,
    resizingColumn,
    startResize,
    getColumnWidth,
    getColumnStyle,
    resetColumns,
    handleMouseMove,
    handleMouseUp
  } = useResizableColumns(initialColumns);

  // Event listeners para el redimensionamiento
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const fetchListaPrecios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        ...(empresa && { empresa }),
        ...(sku && { sku }),
        ...(busqueda && { busqueda })
      });

      const response = await fetch(`/api/lista-precios?${params}`);
      const data = await response.json();

      if (data.success) {
        setListaPrecios(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching lista precios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListaPrecios();
  }, [pagination.page, empresa, sku, busqueda, sortConfig]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListaPrecios();
  };

  const clearFilters = () => {
    setEmpresa('');
    setSku('');
    setBusqueda('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Lista de Precios</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetColumns}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Resetear columnas"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={fetchListaPrecios}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">SKUs Únicos</p>
            <p className="text-2xl font-bold text-blue-900">{stats.skus_unicos.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Empresas Activas</p>
            <p className="text-2xl font-bold text-green-900">{stats.empresas_activas}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Precio Promedio</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.precio_promedio)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Última Actualización</p>
            <p className="text-sm font-medium text-orange-900">
              {stats.ultima_actualizacion ? formatDate(stats.ultima_actualizacion) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las empresas</option>
                <option value="COMERCIALIZADORA BATH & WHITE LTDA">COMERCIALIZADORA BATH & WHITE LTDA</option>
                <option value="MARÍA IGNACIA TURULL Y CIA LTDA">MARÍA IGNACIA TURULL Y CIA LTDA</option>
                <option value="MARIA JOSE TURULL SPA">MARIA JOSE TURULL SPA</option>
                <option value="EMILIA FT SPA">EMILIA FT SPA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU Específico
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ingrese SKU específico"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda General
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="SKU, producto o variante"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔍 Buscar
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Lista de Precios ({pagination.total.toLocaleString()} registros)
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Cargando lista de precios...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <ResizableHeader
                      columnKey="sku"
                      width={getColumnWidth('sku')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'sku'}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1" onClick={() => handleSort('sku')}>
                        SKU
                        {getSortIcon('sku')}
                      </div>
                    </ResizableHeader>
                    <ResizableHeader
                      columnKey="producto"
                      width={getColumnWidth('producto')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'producto'}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1" onClick={() => handleSort('nombre_producto')}>
                        Producto
                        {getSortIcon('nombre_producto')}
                      </div>
                    </ResizableHeader>
                    <ResizableHeader
                      columnKey="empresa"
                      width={getColumnWidth('empresa')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'empresa'}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1" onClick={() => handleSort('empresa')}>
                        Empresa
                        {getSortIcon('empresa')}
                      </div>
                    </ResizableHeader>
                    <ResizableHeader
                      columnKey="precio_sin_iva"
                      width={getColumnWidth('precio_sin_iva')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'precio_sin_iva'}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1" onClick={() => handleSort('precio_sin_iva')}>
                        Precio sin IVA
                        {getSortIcon('precio_sin_iva')}
                      </div>
                    </ResizableHeader>
                    <ResizableHeader
                      columnKey="precio_con_iva"
                      width={getColumnWidth('precio_con_iva')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'precio_con_iva'}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1" onClick={() => handleSort('precio_con_iva')}>
                        Precio con IVA
                        {getSortIcon('precio_con_iva')}
                      </div>
                    </ResizableHeader>
                    <ResizableHeader
                      columnKey="fecha_actualizacion"
                      width={getColumnWidth('fecha_actualizacion')}
                      onStartResize={startResize}
                      isResizing={resizingColumn === 'fecha_actualizacion'}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1" onClick={() => handleSort('fecha_actualizacion')}>
                        Actualizado
                        {getSortIcon('fecha_actualizacion')}
                      </div>
                    </ResizableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listaPrecios.map((precio) => (
                    <tr key={precio.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={getColumnStyle('sku')}>
                        {precio.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900" style={getColumnStyle('producto')}>
                        <div>
                          <p className="font-medium">
                            {precio.nombre_producto || 'Sin nombre'}
                            {precio.descripcion_variante && (
                              <span className="text-gray-500 text-xs font-normal ml-2">
                                - {precio.descripcion_variante}
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500" style={getColumnStyle('empresa')}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {precio.empresa.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium" style={getColumnStyle('precio_sin_iva')}>
                        {formatCurrency(precio.precio_sin_iva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold" style={getColumnStyle('precio_con_iva')}>
                        {formatCurrency(precio.precio_con_iva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={getColumnStyle('fecha_actualizacion')}>
                        {formatDate(precio.fecha_actualizacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Anterior</span>
                      ←
                    </button>
                    
                    {/* Números de página */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Siguiente</span>
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 