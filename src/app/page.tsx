'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Store, Package, BarChart3, Target, Layers, DollarSign } from 'lucide-react';
import { 
  Filtros,
  VentasMensuales,
  VentasPorSucursal,
  TopProductos,
  TipoDocumento,
  Plataforma,
  VentasPorPlataforma,
  MargenPorSucursal,
  VentasPorCategoria,
  VentasFiltradas
} from '@/lib/queries';
import VentasMensualesChart from '@/components/VentasMensualesChart';
import VentasSucursalChart from '@/components/VentasSucursalChart';
import TopProductosTable from '@/components/TopProductosTable';
import FilterPanel from '@/components/FilterPanel';
import VentasPlataformaChart from '@/components/VentasPlataformaChart';
import MargenSucursalChart from '@/components/MargenSucursalChart';
import VentasCategoriaTable from '@/components/VentasCategoriaTable';
import TabNavigation from '@/components/TabNavigation';
import ResumenVentasTab from '@/components/tabs/ResumenVentasTab';
import AnalisisProductosTab from '@/components/tabs/AnalisisProductosTab';
import StockTab from '@/components/tabs/StockTab';

export default function Dashboard() {
  // Estados para los datos
  const [ventasMensuales, setVentasMensuales] = useState<VentasMensuales[]>([]);
  const [ventasSucursal, setVentasSucursal] = useState<VentasPorSucursal[]>([]);
  const [topProductos, setTopProductos] = useState<TopProductos[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  
  // Estados para los nuevos datos
  const [ventasPlataforma, setVentasPlataforma] = useState<VentasPorPlataforma[]>([]);
  const [margenSucursal, setMargenSucursal] = useState<MargenPorSucursal[]>([]);
  const [ventasCategoria, setVentasCategoria] = useState<VentasPorCategoria[]>([]);
  const [ventasFiltradas, setVentasFiltradas] = useState<VentasFiltradas[]>([]);
  
  // Estados para opciones de filtros
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
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

  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState('resumen-ventas');

  // Cargar opciones de filtros (solo una vez)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [tiposDocResponse, plataformasResponse, empresasResponse, sucursalesResponse] = await Promise.all([
          fetch('/api/tipos-documento'),
          fetch('/api/plataformas'),
          fetch('/api/empresas'),
          fetch('/api/sucursales')
        ]);
        
        const tipos = await tiposDocResponse.json();
        const plataformasData = await plataformasResponse.json();
        const empresasData = await empresasResponse.json();
        const sucursalesData = await sucursalesResponse.json();
        
        setTiposDocumento(tipos);
        setPlataformas(plataformasData);
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
          plataforma: plataformasData.map((p: Plataforma) => p.plataforma),
          empresa: empresasData,
          sucursal: sucursalesData
        });
        
        setFiltersInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
        setLoading(false);
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
          setVentasPlataforma([]);
          setMargenSucursal([]);
          setVentasCategoria([]);
          setVentasFiltradas([]);
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
          setDataLoading(false);
          return;
        }

        const allFilters = getAllFilters();
        const params = createUrlParams(allFilters);

        // Cargar todos los datos en paralelo
        const [
          ventasMensualesRes,
          ventasSucursalRes,
          topProductosRes,
          resumenRes,
          ventasPlataformaRes,
          margenSucursalRes,
          ventasCategoriaRes,
          ventasFiltradasRes
        ] = await Promise.all([
          fetch(`/api/ventas-mensuales?${params}`),
          fetch(`/api/ventas-sucursal?${params}`),
          fetch(`/api/top-productos?${params}`),
          fetch(`/api/resumen?${params}`),
          fetch(`/api/ventas-plataforma?${params}`),
          fetch(`/api/margen-sucursal?${params}`),
          fetch(`/api/ventas-categoria?${params}`),
          fetch(`/api/ventas-filtradas?${params}`)
        ]);

        const [
          ventasMensualesData,
          ventasSucursalData,
          topProductosData,
          resumenData,
          ventasPlataformaData,
          margenSucursalData,
          ventasCategoriaData,
          ventasFiltradasData
        ] = await Promise.all([
          ventasMensualesRes.json(),
          ventasSucursalRes.json(),
          topProductosRes.json(),
          resumenRes.json(),
          ventasPlataformaRes.json(),
          margenSucursalRes.json(),
          ventasCategoriaRes.json(),
          ventasFiltradasRes.json()
        ]);

        setVentasMensuales(ventasMensualesData);
        setVentasSucursal(ventasSucursalData);
        setTopProductos(topProductosData);
        setResumen(resumenData);
        setVentasPlataforma(ventasPlataformaData);
        setMargenSucursal(margenSucursalData);
        setVentasCategoria(ventasCategoriaData);
        setVentasFiltradas(ventasFiltradasData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [filtersInitialized, filtros, selectedYears, selectedMonths]);

  const handleFiltrosChange = (newFiltros: Filtros) => {
    setFiltros(newFiltros);
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
        <div className="max-w-full mx-auto px-8 sm:px-12 lg:px-16">
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

      {/* Tabs pegadas al header */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-full mx-auto px-8 sm:px-12 lg:px-16 py-8">
        {/* Contenido de las Pestañas */}
        {activeTab === 'resumen-ventas' && (
          <ResumenVentasTab
            ventasMensuales={ventasMensuales}
            ventasSucursal={ventasSucursal}
            ventasPlataforma={ventasPlataforma}
            margenSucursal={margenSucursal}
            ventasFiltradas={ventasFiltradas}
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            dataLoading={dataLoading}
            tiposDocumento={tiposDocumento}
            plataformas={plataformas}
            empresas={empresas}
            sucursales={sucursales}
            resumen={resumen}
          />
        )}

        {activeTab === 'analisis-productos' && (
          <AnalisisProductosTab
            topProductos={topProductos}
            ventasCategoria={ventasCategoria}
            dataLoading={dataLoading}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab dataLoading={dataLoading} />
        )}
      </main>
    </div>
  );
} 