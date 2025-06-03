import React from 'react';
import { TrendingUp, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';

interface ResumenCardsProps {
  resumen: {
    total_registros: number;
    total_documentos: number;
    productos_diferentes: number;
    sucursales_activas: number;
    ventas_totales: number;
    ventas_con_costo: number;
    margen_total: number;
    porcentaje_margen_promedio: number;
    registros_con_margen: number;
    registros_sin_margen: number;
    porcentaje_sin_margen: number;
  };
}

export default function ResumenCards({ resumen }: ResumenCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  return (
    <>
      {/* Ventas Totales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
        <div className="flex items-center h-full">
          <div className="p-2 bg-blue-100 rounded-md">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Ventas Totales</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(resumen.ventas_totales)}
            </p>
          </div>
        </div>
      </div>

      {/* Total Documentos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
        <div className="flex items-center h-full">
          <div className="p-2 bg-green-100 rounded-md">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Documentos</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(resumen.total_documentos)}
            </p>
          </div>
        </div>
      </div>

      {/* Productos Diferentes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
        <div className="flex items-center h-full">
          <div className="p-2 bg-purple-100 rounded-md">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Productos Diferentes</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(resumen.productos_diferentes)}
            </p>
          </div>
        </div>
      </div>

      {/* Margen Promedio - Solo con costos registrados */}
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
        <div className="flex items-center h-full">
          <div className="p-2 bg-orange-100 rounded-md flex-shrink-0">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm text-gray-600">Margen Promedio</p>
            <p className="text-2xl font-semibold text-gray-900">
              {resumen.porcentaje_margen_promedio}%
            </p>
            
            {/* Texto explicativo principal */}
            <div className="text-xs text-gray-600 mt-2 font-medium">
              Calculado solo con las ventas que tienen costo registrado
            </div>
            
            {/* Información adicional */}
            <div className="mt-2 space-y-1">
              {resumen.porcentaje_sin_margen > 0 && (
                <div className="flex items-center text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                  <span>{resumen.porcentaje_sin_margen}% de registros sin costo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 