'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Package, Building, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, Download, Info, RotateCcw } from 'lucide-react';
import { useResizableColumns, ResizableColumn } from '../hooks/useResizableColumns';
import ResizableHeader from './ui/ResizableHeader';

interface InventarioItem {
  sku: string;
  producto_servicio: string;
  tipo_producto_servicio: string;
  variante: string;
  sucursal?: string;
  empresa?: string;
  stock_disponible?: number;
  stock_total_consolidado?: number;
  costo_unitario?: number;
  valor_total_stock?: number;
  precio_venta?: number;
  margen_unitario?: number;
  porcentaje_margen?: number;
  valor_venta_stock?: number;
  estado_stock?: string;
  // Campos consolidados
  total_sucursales?: number;
  stock_total_disponible?: number;
  stock_total_bodega?: number;
  costo_promedio?: number;
  ultima_actualizacion: string;
}

interface InventarioTableProps {
  consolidado?: boolean;
}

type SortField = 'producto_servicio' | 'sku' | 'tipo_producto_servicio' | 'stock_disponible' | 'stock_total_consolidado' | 'costo_unitario' | 'valor_total_stock' | 'precio_venta' | 'margen_unitario' | 'porcentaje_margen' | 'valor_venta_stock' | 'estado_stock';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

function InventarioTableBody({
  sucursalFiltro,
  modoConsolidado,
  page,
  setPage,
  setTotalPages,
  setTotal,
  sortConfig,
  setSortConfig,
  hideZeroStock,
  selectedDate,
  showAllRecords,
  setShowAllRecords,
  setTotales,
  setResetColumnsFunc
}: {
  sucursalFiltro: string[];
  modoConsolidado: boolean;
  page: number;
  setPage: (n: number) => void;
  setTotalPages: (n: number) => void;
  setTotal: (n: number) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  hideZeroStock: boolean;
  selectedDate: string;
  showAllRecords: boolean;
  setShowAllRecords: (show: boolean) => void;
  setTotales: (totales: { valorVenta: number; valorCompra: number; margen: number; mgPorcentaje: number }) => void;
  setResetColumnsFunc: (func: (() => void) | null) => void;
}) {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPagesLocal, setTotalPagesLocal] = useState(1);
  const [totalLocal, setTotalLocal] = useState(0);

  // Configuración de columnas redimensionables
  const initialColumns: ResizableColumn[] = useMemo(() => [
    { key: 'tipo', width: 120, minWidth: 80, maxWidth: 200 },
    { key: 'producto', width: 300, minWidth: 200, maxWidth: 500 },
    { key: 'sku', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'stock', width: 80, minWidth: 60, maxWidth: 120 },
    { key: 'total', width: 80, minWidth: 60, maxWidth: 120 },
    { key: 'precio', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'costo', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'margen', width: 120, minWidth: 80, maxWidth: 180 },
    { key: 'porcentaje', width: 100, minWidth: 80, maxWidth: 140 },
    { key: 'valor_venta', width: 140, minWidth: 100, maxWidth: 200 },
    { key: 'valor_costo', width: 140, minWidth: 100, maxWidth: 200 },
    { key: 'estado', width: 100, minWidth: 80, maxWidth: 140 }
  ], []);

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

  // Pasar la función resetColumns al componente padre
  useEffect(() => {
    setResetColumnsFunc(resetColumns);
    return () => {
      setResetColumnsFunc(null);
    };
  }, [resetColumns, setResetColumnsFunc]);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        setLoading(true);
        console.log('Cargando inventario con filtros:', { sucursalFiltro, selectedDate });
        const params = new URLSearchParams({
          page: page.toString(),
          limit: showAllRecords ? '10000' : '50',
          consolidado: modoConsolidado.toString(),
          sortField: sortConfig.field,
          sortDirection: sortConfig.direction,
          hideZeroStock: hideZeroStock.toString(),
          fecha: selectedDate
        });
        if (sucursalFiltro.length > 0) {
          params.append('sucursales', sucursalFiltro.join(','));
        }
        console.log('URL de inventario:', `/api/inventario-completo?${params}`);
        const response = await fetch(`/api/inventario-completo?${params}`);
        const data = await response.json();
        console.log('Respuesta de inventario:', data);
        if (data.success) {
          setInventario(data.data.inventario);
          setTotalPagesLocal(data.data.pagination.totalPages);
          setTotalLocal(data.data.pagination.total);
          setTotalPages(data.data.pagination.totalPages);
          setTotal(data.data.pagination.total);
          console.log('Inventario cargado:', data.data.inventario.length, 'productos');
          
          // Usar totales del backend
          if (data.data.totales) {
            setTotales({
              valorVenta: data.data.totales.valorVenta,
              valorCompra: data.data.totales.valorCompra,
              margen: data.data.totales.margen,
              mgPorcentaje: data.data.totales.mgPorcentaje
            });
          }
        }
      } catch (error) {
        console.error('Error fetching inventario:', error);
        setTotales({
          valorVenta: 0,
          valorCompra: 0,
          margen: 0,
          mgPorcentaje: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInventario();
  }, [page, sucursalFiltro, modoConsolidado, sortConfig, setTotalPages, setTotal, hideZeroStock, selectedDate, showAllRecords]);

  // Limpiar totales cuando no hay sucursales seleccionadas
  useEffect(() => {
    if (sucursalFiltro.length === 0) {
      setTotales({
        valorVenta: 0,
        valorCompra: 0,
        margen: 0,
        mgPorcentaje: 0
      });
    }
  }, [sucursalFiltro, setTotales]);

  // Calcular y setear totales solo cuando inventario cambie
  useEffect(() => {
    // Calcula los totales aquí como se hacía antes
    // (puedes ajustar el cálculo según tu lógica actual)
    if (inventario && inventario.length > 0) {
      // Ejemplo de cálculo de totales
      const totales = inventario.reduce((acc, item) => {
        acc.valorVenta += item.valor_venta_stock || 0;
        acc.valorCompra += item.valor_total_stock || 0;
        acc.margen += (item.margen_unitario || 0) * (item.stock_disponible || 0);
        return acc;
      }, { valorVenta: 0, valorCompra: 0, margen: 0, mgPorcentaje: 0 });
      // Calcula el porcentaje de margen si corresponde
      totales.mgPorcentaje = totales.valorCompra > 0 ? ((totales.valorVenta - totales.valorCompra) / totales.valorCompra) * 100 : 0;
      setTotales(totales);
    } else {
      setTotales({ valorVenta: 0, valorCompra: 0, margen: 0, mgPorcentaje: 0 });
    }
  }, [inventario, setTotales]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(num);
  };

  const getStockStatus = (disponible: number, total: number): { color: string; text: string } => {
    if (disponible === 0) return { color: 'text-red-600', text: 'Sin Stock' };
    if (disponible <= 5) return { color: 'text-orange-600', text: 'Stock Bajo' };
    if (disponible <= total * 0.2) return { color: 'text-yellow-600', text: 'Stock Medio' };
    return { color: 'text-green-600', text: 'Stock OK' };
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPagesLocal) {
      setPage(newPage);
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
    setPage(1); // Reset a la primera página al ordenar
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        
        {/* Table skeleton */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
              ))}
            </div>
          </div>
          
          {/* Data rows */}
          <div className="space-y-0">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-gray-100 flex justify-between">
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex justify-between items-center mt-6">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200">
              <ResizableHeader
                columnKey="tipo"
                width={getColumnWidth('tipo')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'tipo'}
                className="text-left py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('tipo_producto_servicio')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors text-xs"
                >
                  Tipo
                  {getSortIcon('tipo_producto_servicio')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="producto"
                width={getColumnWidth('producto')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'producto'}
                className="text-left py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('producto_servicio')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors text-xs"
                >
                  Producto
                  {getSortIcon('producto_servicio')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="sku"
                width={getColumnWidth('sku')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'sku'}
                className="text-left py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('sku')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors text-xs"
                >
                  SKU
                  {getSortIcon('sku')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="stock"
                width={getColumnWidth('stock')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'stock'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('stock_disponible')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  Stock
                  {getSortIcon('stock_disponible')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="total"
                width={getColumnWidth('total')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'total'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('stock_total_consolidado')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  Total
                  {getSortIcon('stock_total_consolidado')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="precio"
                width={getColumnWidth('precio')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'precio'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('precio_venta')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  <div className="flex items-center gap-1">
                    Precio
                    <div className="relative group">
                      <Info className="h-3 w-3 text-gray-400 hover:text-blue-500 cursor-help" />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-3 py-2 bg-black text-white text-xs rounded-md whitespace-nowrap invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-[999999] shadow-lg">
                        Precio desde Lista de Precios de Comercializadora Bath & White
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black"></div>
                      </div>
                    </div>
                  </div>
                  {getSortIcon('precio_venta')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="costo"
                width={getColumnWidth('costo')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'costo'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('costo_unitario')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  <div className="flex items-center gap-1">
                    Costo
                    <div className="relative group">
                      <Info className="h-3 w-3 text-gray-400 hover:text-blue-500 cursor-help" />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-3 py-2 bg-black text-white text-xs rounded-md whitespace-nowrap invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-[999999] shadow-lg">
                        Costo desde datos de Stock diario de Bodega
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black"></div>
                      </div>
                    </div>
                  </div>
                  {getSortIcon('costo_unitario')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="margen"
                width={getColumnWidth('margen')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'margen'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('margen_unitario')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  Margen
                  {getSortIcon('margen_unitario')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="porcentaje"
                width={getColumnWidth('porcentaje')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'porcentaje'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('porcentaje_margen')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  % Mg
                  {getSortIcon('porcentaje_margen')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="valor_venta"
                width={getColumnWidth('valor_venta')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'valor_venta'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('valor_venta_stock')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  Val. Venta
                  {getSortIcon('valor_venta_stock')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="valor_costo"
                width={getColumnWidth('valor_costo')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'valor_costo'}
                className="text-right py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('valor_total_stock')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors ml-auto text-xs"
                >
                  Val. Costo
                  {getSortIcon('valor_total_stock')}
                </button>
              </ResizableHeader>
              
              <ResizableHeader
                columnKey="estado"
                width={getColumnWidth('estado')}
                onStartResize={startResize}
                isResizing={resizingColumn === 'estado'}
                className="text-center py-2 px-1 text-xs font-medium text-gray-600"
              >
                <button
                  onClick={() => handleSort('estado_stock')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors mx-auto text-xs"
                >
                  Estado
                  {getSortIcon('estado_stock')}
                </button>
              </ResizableHeader>
            </tr>
          </thead>
          <tbody>
            {inventario.map((item, index) => {
              const stockDisponible = Number(item.stock_disponible) || 0;
              const stockTotalConsolidado = Number(item.stock_total_consolidado) || 0;
              const costo = Number(item.costo_unitario) || 0;
              const valor = Number(item.valor_total_stock) || 0;
              const precioVenta = Number(item.precio_venta) || 0;
              const margenUnitario = Number(item.margen_unitario) || 0;
              const porcentajeMargen = Number(item.porcentaje_margen) || 0;
              const valorVentaStock = Number(item.valor_venta_stock) || 0;
              const status = { 
                color: item.estado_stock === 'Sin Stock' ? 'text-red-600' :
                       item.estado_stock === 'Stock Bajo' ? 'text-orange-600' :
                       item.estado_stock === 'Stock Medio' ? 'text-yellow-600' : 'text-green-600',
                text: item.estado_stock || getStockStatus(stockDisponible, stockTotalConsolidado).text
              };
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-1 px-1" style={getColumnStyle('tipo')}>
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" title={item.tipo_producto_servicio || 'Sin tipo'}>
                      <div className="truncate">
                        {item.tipo_producto_servicio || 'N/A'}
                      </div>
                    </span>
                  </td>
                  <td className="py-1 px-1" style={getColumnStyle('producto')}>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-gray-900 leading-tight truncate" title={`${item.producto_servicio}${item.variante ? ` - ${item.variante}` : ''}`}>
                        {item.producto_servicio}
                        {item.variante && ` - ${item.variante}`}
                      </p>
                    </div>
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 font-mono truncate" style={getColumnStyle('sku')} title={item.sku}>{item.sku}</td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right font-medium" style={getColumnStyle('stock')}>
                    {(stockDisponible || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right" style={getColumnStyle('total')}>
                    {(stockTotalConsolidado || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right" style={getColumnStyle('precio')}>
                    {precioVenta && precioVenta > 0 ? formatCurrency(precioVenta) : 'N/A'}
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right" style={getColumnStyle('costo')}>
                    {costo && costo > 0 ? formatCurrency(costo) : 'N/A'}
                  </td>
                  <td className={`py-1 px-1 text-xs text-right ${margenUnitario < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`} style={getColumnStyle('margen')}>
                    {margenUnitario !== null && margenUnitario !== undefined ? formatCurrency(margenUnitario) : 'N/A'}
                  </td>
                  <td className={`py-1 px-1 text-xs text-right ${porcentajeMargen < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`} style={getColumnStyle('porcentaje')}>
                    {porcentajeMargen !== null && porcentajeMargen !== undefined ? `${porcentajeMargen.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right font-medium" style={getColumnStyle('valor_venta')}>
                    {valorVentaStock && valorVentaStock > 0 ? formatCurrency(valorVentaStock) : 'N/A'}
                  </td>
                  <td className="py-1 px-1 text-xs text-gray-600 text-right font-medium" style={getColumnStyle('valor_costo')}>
                    {valor && valor > 0 ? formatCurrency(valor) : 'N/A'}
                  </td>
                  <td className="py-1 px-1 text-center" style={getColumnStyle('estado')}>
                    <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium whitespace-nowrap ${status.color.replace('text-', 'bg-').replace('-600', '-100')} ${status.color}`}>
                      {status.text === 'Sin Stock' ? 'Sin' : status.text === 'Stock Bajo' ? 'Bajo' : 'OK'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Paginación */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          {showAllRecords ? (
            `Mostrando todos los ${totalLocal.toLocaleString()} registros`
          ) : (
            `Página ${page} de ${totalPagesLocal} (${totalLocal.toLocaleString()} total)`
          )}
        </div>
        <div className="flex items-center gap-3">
          {!showAllRecords && totalPagesLocal > 1 && (
            <>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPagesLocal}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setShowAllRecords(!showAllRecords);
              setPage(1);
            }}
            className={`px-3 py-1 text-sm font-medium rounded-lg border transition-colors ${
              showAllRecords
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
          >
            {showAllRecords ? 'Paginar' : 'Ver Todo'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function InventarioTable({ consolidado = false }: InventarioTableProps) {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [sucursales, setSucursales] = useState<{ sucursal: string; empresa: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalFiltro, setSucursalFiltro] = useState<string[]>([]);
  const [sucursalesLoaded, setSucursalesLoaded] = useState(false);
  const [modoConsolidado] = useState(true); // Consolidado por defecto y no editable
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'producto_servicio',
    direction: 'asc'
  });
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [totales, setTotales] = useState({
    valorVenta: 0,
    valorCompra: 0,
    margen: 0,
    mgPorcentaje: 0
  });
  const [resetColumnsFunc, setResetColumnsFunc] = useState<(() => void) | null>(null);


  // Cargar sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        console.log('Cargando sucursales...');
        const response = await fetch('/api/sucursales');
        const data = await response.json();
        console.log('Respuesta de sucursales:', data);
        if (data.success) {
          setSucursales(data.data);
          // Por defecto seleccionar todas las sucursales
          setSucursalFiltro(data.data.map((s: { sucursal: string }) => s.sucursal));
          setSucursalesLoaded(true);
          console.log('Sucursales cargadas:', data.data.length);
        }
      } catch (error) {
        console.error('Error fetching sucursales:', error);
        setSucursalesLoaded(true);
      }
    };
    fetchSucursales();
  }, []);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Función para exportar a Excel
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        fecha: selectedDate,
        hideZeroStock: hideZeroStock.toString()
      });
      if (sucursalFiltro.length > 0) {
        params.append('sucursales', sucursalFiltro.join(','));
      }
      
      console.log('Exportando a Excel con parámetros:', params.toString());
      
      const response = await fetch(`/api/inventario-completo/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar');
      }
      
      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extraer nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'inventario.xlsx';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Archivo Excel descargado:', filename);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar el archivo. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Header con título */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Inventario Consolidado
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetColumnsFunc || (() => {})}
            disabled={!resetColumnsFunc}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Resetear columnas"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportExcel}
            disabled={sucursalFiltro.length === 0}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Exportar a Excel"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Filtros en la misma línea */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filtro de fecha a la izquierda */}
        <div className="flex items-center gap-4">
          <label htmlFor="dateSelector" className="text-sm font-medium text-gray-700">
            Fecha:
          </label>
          <input
            id="dateSelector"
            type="date"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {/* Filtro de sucursal a la derecha */}
        <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por sucursal:</span>
            <button
              type="button"
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white shadow-sm hover:bg-gray-50 min-w-[200px] text-left"
              onClick={e => { e.stopPropagation(); setDropdownOpen((open) => !open); }}
            >
              {sucursalFiltro.length === 0
                ? 'Seleccionar sucursales'
                : sucursalFiltro.length === sucursales.length
                  ? 'Todas'
                  : sucursalFiltro.length <= 2
                    ? sucursalFiltro.join(', ')
                    : `${sucursalFiltro.slice(0, 2).join(', ')} y ${sucursalFiltro.length - 2} más`
              }
              <span className="float-right ml-2">▼</span>
            </button>
          </div>
          {dropdownOpen && (
            <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full min-w-[220px]"
              onClick={e => e.stopPropagation()}>
              {/* Botón Todos */}
              <div className="border-b border-gray-200 pb-2 mb-2">
                <label className="flex items-center gap-2 py-1 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={sucursalFiltro.length === sucursales.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSucursalFiltro(sucursales.map(s => s.sucursal));
                      } else {
                        setSucursalFiltro([]);
                      }
                      setPage(1);
                    }}
                    className="accent-blue-600"
                  />
                  <span className="text-blue-600">Todos</span>
                </label>
              </div>
              {/* Lista de sucursales */}
              {sucursales.map((suc) => (
                <label key={suc.sucursal} className="flex items-center gap-2 py-1 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    value={suc.sucursal}
                    checked={sucursalFiltro.includes(suc.sucursal)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSucursalFiltro([...sucursalFiltro, suc.sucursal]);
                      } else {
                        setSucursalFiltro(sucursalFiltro.filter(s => s !== suc.sucursal));
                      }
                      setPage(1);
                    }}
                    className="accent-blue-600"
                  />
                  {suc.sucursal}
                </label>
              ))}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-1">Puedes seleccionar varias sucursales</span>
        </div>
      </div>
      {/* Checkbox debajo de los filtros */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="hideZeroStock"
          checked={hideZeroStock}
          onChange={e => setHideZeroStock(e.target.checked)}
          className="accent-blue-600"
        />
        <label htmlFor="hideZeroStock" className="text-sm text-gray-700 select-none cursor-pointer">
          Ocultar productos con stock en cero
        </label>
      </div>

      {/* Información del total */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {sucursalFiltro.length === 0 
            ? 'Sin sucursales seleccionadas - 0 productos'
            : `Mostrando ${total.toLocaleString()} productos ${
                sucursalFiltro.length === sucursales.length 
                  ? 'de todas las sucursales' 
                  : `de ${sucursalFiltro.length} sucursal${sucursalFiltro.length > 1 ? 'es' : ''}: ${sucursalFiltro.join(', ')}`
              } para el ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`
          }
        </p>
      </div>

      {/* Indicadores de totales */}
      {sucursalFiltro.length > 0 && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-500">Valor de Venta Inventario</h3>
              <div className="relative group">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]">
                  Suma de productos que tienen precio de venta definido
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(totales.valorVenta)}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-500">Valor de Compra Inventario</h3>
              <div className="relative group">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]">
                  Suma de productos que tienen costo definido
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-700">
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(totales.valorCompra)}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-500">Margen</h3>
              <div className="relative group">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]">
                  Diferencia entre valor de venta y compra (productos con ambos datos)
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p className={`text-2xl font-bold ${totales.margen < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(totales.margen)}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-500">Mg %</h3>
              <div className="relative group">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]">
                  Porcentaje de margen sobre costo. Nota: Algunos productos carecen de precio o costo
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p className={`text-2xl font-bold ${totales.mgPorcentaje < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totales.mgPorcentaje.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Tabla y paginación */}
      {!sucursalesLoaded ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando sucursales...</p>
        </div>
      ) : sucursalFiltro.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin sucursales seleccionadas</h3>
          <p className="text-gray-500 mb-4">Selecciona al menos una sucursal para ver el inventario</p>
          <button
            onClick={() => setSucursalFiltro(sucursales.map(s => s.sucursal))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Seleccionar todas las sucursales
          </button>
        </div>
      ) : (
        <InventarioTableBody
          sucursalFiltro={sucursalFiltro}
          modoConsolidado={modoConsolidado}
          page={page}
          setPage={setPage}
          setTotalPages={setTotalPages}
          setTotal={setTotal}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          hideZeroStock={hideZeroStock}
          selectedDate={selectedDate}
          showAllRecords={showAllRecords}
          setShowAllRecords={setShowAllRecords}
          setTotales={setTotales}
          setResetColumnsFunc={setResetColumnsFunc}
        />
      )}
    </div>
  );
} 