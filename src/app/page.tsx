'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Store, Package } from 'lucide-react';
import { 
  Filtros,
  VentasMensuales,
  VentasPorSucursal,
  TopProductos,
  TipoDocumento
} from '@/lib/queries';
import VentasMensualesChart from '@/components/VentasMensualesChart';
import VentasSucursalChart from '@/components/VentasSucursalChart';
import TopProductosTable from '@/components/TopProductosTable';
import ResumenCards from '@/components/ResumenCards';
import FilterPanel from '@/components/FilterPanel';
import DateFilterPanel from '@/components/DateFilterPanel';

export default function Dashboard() {
  // Estados para los datos
  const [ventasMensuales, setVentasMensuales] = useState<VentasMensuales[]>([]);
  const [ventasSucursal, setVentasSucursal] = useState<VentasPorSucursal[]>([]);
  const [topProductos, setTopProductos] = useState<TopProductos[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  
  // Estados para opciones de filtros
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [sucursales, setSucursales] = useState<string[]>([]);
  
  // Estado para filtros activos - se inicializará después de cargar las opciones
  const [filtros, setFiltros] = useState<Filtros>({});
  
  // Estados para filtros de fecha
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Cargar opciones de filtros (solo una vez)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [tiposDocResponse, empresasResponse, sucursalesResponse] = await Promise.all([
          fetch('/api/tipos-documento'),
          fetch('/api/empresas'),
          fetch('/api/sucursales')
        ]);
        
        const tipos = await tiposDocResponse.json();
        const empresasData = await empresasResponse.json();
        const sucursalesData = await sucursalesResponse.json();
        
        setTiposDocumento(tipos);
        setEmpresas(empresasData);
        setSucursales(sucursalesData);
        
        // Inicializar solo con Boleta y Factura seleccionados
        const tiposSeleccionados = tipos
          .filter((t: TipoDocumento) => 
            t.tipo_documento.includes('BOLETA ELECTRÓNICA') || 
            t.tipo_documento.includes('FACTURA ELECTRÓNICA')
          )
          .map((t: TipoDocumento) => t.tipo_documento);
        
        setFiltros({
          tipoDocumento: tiposSeleccionados,
          empresa: empresasData,
          sucursal: sucursalesData
        });
        
        setFiltersInitialized(true);
      } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Crear parámetros de URL para filtros múltiples
  const createUrlParams = (filtros: Filtros) => {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, values]) => {
      if (values && values.length > 0) {
        values.forEach((value: string | number) => {
          params.append(key, value.toString());
        });
      }
    });
    
    return params.toString();
  };

  // Combinar todos los filtros
  const getAllFilters = (): Filtros => {
    const combined: Filtros = { ...filtros };
    
    // Solo incluir años y meses si hay alguno seleccionado
    if (selectedYears.length > 0) {
      combined.años = selectedYears;
    }
    
    if (selectedMonths.length > 0) {
      combined.meses = selectedMonths;
    }
    
    return combined;
  };

  // Verificar si hay filtros que devuelvan datos
  const shouldLoadData = (): boolean => {
    const allFilters = getAllFilters();
    
    // Si no hay años o meses seleccionados, no cargar datos
    if (!allFilters.años || allFilters.años.length === 0 || 
        !allFilters.meses || allFilters.meses.length === 0) {
      return false;
    }
    
    return true;
  };

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    if (!filtersInitialized) return;
    
    const loadData = async () => {
      setDataLoading(true);
      
      try {
        // Si no deberíamos cargar datos, establecer todo en vacío/cero
        if (!shouldLoadData()) {
          setVentasMensuales([]);
          setVentasSucursal([]);
          setTopProductos([]);
          setResumen({
            total_registros: 0,
            total_documentos: 0,
            productos_diferentes: 0,
            sucursales_activas: 0,
            ventas_totales: 0,
            registros_con_margen: 0,
            registros_sin_margen: 0,
            ventas_con_costo: 0,
            margen_total: 0,
            porcentaje_margen_promedio: 0,
            porcentaje_sin_margen: 0
          });
        } else {
          const allFilters = getAllFilters();
          const queryString = createUrlParams(allFilters);
          
          const [ventasMenResponse, ventasSucResponse, topProdResponse, resumenResponse] = await Promise.all([
            fetch('/api/ventas-mensuales?' + queryString),
            fetch('/api/ventas-sucursal?' + queryString),
            fetch('/api/top-productos?' + queryString),
            fetch('/api/resumen?' + queryString)
          ]);

          const ventasMenData = await ventasMenResponse.json();
          const ventasSucData = await ventasSucResponse.json();
          const topProdData = await topProdResponse.json();
          const resumenData = await resumenResponse.json();

          setVentasMensuales(ventasMenData);
          setVentasSucursal(ventasSucData);
          setTopProductos(topProdData);
          setResumen(resumenData);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setDataLoading(false);
        setLoading(false);
      }
    };

    loadData();
  }, [filtros, selectedYears, selectedMonths, filtersInitialized]);

  const handleFiltrosChange = (newFiltros: Filtros) => {
    setFiltros(newFiltros);
  };

  const handleDateFiltersChange = (years: number[], months: number[]) => {
    setSelectedYears(years);
    setSelectedMonths(months);
  };

  const handleClearDateFilters = () => {
    setSelectedYears([]);
    setSelectedMonths([]);
  };

  const handleClearAllFilters = () => {
    setFiltros({});
    setSelectedYears([]);
    setSelectedMonths([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {/* Logo */}
              <img 
                src="/logo.png" 
                alt="Bath & Blanc Logo" 
                className="h-20 w-auto mr-8"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Ventas
                </h1>
                <p className="text-gray-600 mt-1">
                  Bath & Blanc - Análisis de Ventas 2024-2025
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Última actualización: {new Date().toLocaleDateString('es-CL')}
              </div>
              {dataLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de Filtros - Siempre visible */}
        <FilterPanel
          tiposDocumento={tiposDocumento}
          empresas={empresas}
          sucursales={sucursales}
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
        />

        {/* Filtros de Fecha - Compacto */}
        <DateFilterPanel
          selectedYears={selectedYears}
          selectedMonths={selectedMonths}
          onYearsChange={setSelectedYears}
          onMonthsChange={setSelectedMonths}
          onClearAll={handleClearDateFilters}
        />

        {/* Resumen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {resumen && <ResumenCards resumen={resumen} />}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ventas Mensuales Comparativas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Ventas Mensuales Comparativas
              </h2>
            </div>
            {dataLoading ? (
              <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
            ) : (
              <VentasMensualesChart data={ventasMensuales} />
            )}
          </div>

          {/* Ventas por Sucursal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <Store className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Ventas por Sucursal
              </h2>
            </div>
            {dataLoading ? (
              <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
            ) : (
              <VentasSucursalChart data={ventasSucursal} />
            )}
          </div>
        </div>

        {/* Top Productos Table */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Package className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Top 10 Productos Más Vendidos
            </h2>
          </div>
          {dataLoading ? (
            <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
          ) : (
            <TopProductosTable data={topProductos} />
          )}
        </div>
      </main>
    </div>
  );
} 