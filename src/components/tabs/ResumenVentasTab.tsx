'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Store, Layers, DollarSign, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';
import { 
  VentasMensuales, 
  VentasPorSucursal, 
  VentasPorPlataforma, 
  MargenPorSucursal,
  VentasFiltradas,
  Filtros
} from '@/lib/queries';
import VentasMensualesChart from '@/components/VentasMensualesChart';
import VentasSucursalChart from '@/components/VentasSucursalChart';
import VentasPlataformaChart from '@/components/VentasPlataformaChart';
import MargenSucursalChart from '@/components/MargenSucursalChart';
import VentasFiltradasChart from '@/components/VentasFiltradasChart';

interface ResumenVentasTabProps {
  ventasMensuales: VentasMensuales[];
  ventasSucursal: VentasPorSucursal[];
  ventasPlataforma: VentasPorPlataforma[];
  margenSucursal: MargenPorSucursal[];
  ventasFiltradas: VentasFiltradas[];
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  dataLoading: boolean;
}

export default function ResumenVentasTab({
  ventasMensuales,
  ventasSucursal,
  ventasPlataforma,
  margenSucursal,
  ventasFiltradas,
  filtros,
  onFiltrosChange,
  dataLoading,
  tiposDocumento,
  plataformas,
  empresas,
  sucursales,
  resumen
}: ResumenVentasTabProps & {
  tiposDocumento: any[];
  plataformas: any[];
  empresas: string[];
  sucursales: string[];
  resumen: any;
}) {
  const tiposDocumentoMemo = useMemo(() => tiposDocumento, [tiposDocumento]);
  const plataformasMemo = useMemo(() => plataformas, [plataformas]);
  const empresasMemo = useMemo(() => empresas, [empresas]);
  const sucursalesMemo = useMemo(() => sucursales, [sucursales]);

  // Formateadores
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const formatNumber = (num: number) => new Intl.NumberFormat('es-CL').format(num);

  // Estado local para días seleccionados
  const [selectedDays, setSelectedDays] = useState<number[]>(filtros.dias || []);

  // Handler para días
  const handleDaysChange = (days: number[]) => {
    setSelectedDays(days);
    onFiltrosChange({ ...filtros, dias: days });
  };

  return (
    <div className="space-y-8">
      {/* Gráfico de Ventas (antes Ventas Mensuales) - ahora ancho completo */}
      <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col justify-center items-center">
        <div className="flex items-center mb-4 w-full">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 text-left">Ventas</h2>
        </div>
        {dataLoading ? (
          <div className="animate-pulse bg-gray-200 h-64 rounded w-full"></div>
        ) : (
          <div className="w-full">
            <VentasMensualesChart 
              data={ventasMensuales}
              tiposDocumento={tiposDocumentoMemo}
              plataformas={plataformasMemo}
              empresas={empresasMemo}
              sucursales={sucursalesMemo}
            />
          </div>
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
          <VentasSucursalChart 
            data={ventasSucursal}
            tiposDocumento={tiposDocumentoMemo}
            plataformas={plataformasMemo}
            empresas={empresasMemo}
          />
        )}
      </div>

      {/* Ventas por Plataforma y Margen por Sucursal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ventas por Plataforma */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Layers className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Ventas por Plataforma
            </h2>
          </div>
          {dataLoading ? (
            <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
          ) : (
            <VentasPlataformaChart data={ventasPlataforma} />
          )}
        </div>

        {/* Margen por Sucursal */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Márgenes por Sucursal
            </h2>
          </div>
          {dataLoading ? (
            <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
          ) : (
            <MargenSucursalChart data={margenSucursal} />
          )}
        </div>
      </div>
    </div>
  );
} 