'use client';

import React from 'react';
import { Package, Target, Award } from 'lucide-react';
import { TopProductos, VentasPorCategoria } from '@/lib/queries';
import TopProductosTable from '@/components/TopProductosTable';
import ComparacionCostosTable from '@/components/ComparacionCostosTable';

interface AnalisisProductosTabProps {
  topProductos: TopProductos[];
  ventasCategoria: VentasPorCategoria[];
  dataLoading: boolean;
}

export default function AnalisisProductosTab({
  topProductos,
  ventasCategoria,
  dataLoading
}: AnalisisProductosTabProps) {
  return (
    <div className="space-y-8">
      {/* Tabla de Top Productos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top Productos
          </h2>
          {dataLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <TopProductosTable data={topProductos} />
          )}
        </div>
      </div>

      {/* Estadísticas Resumidas */}
      {!dataLoading && ventasCategoria.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-200" />
              <div className="ml-4">
                <p className="text-blue-100 text-sm font-medium">Total Productos</p>
                <p className="text-2xl font-bold">{ventasCategoria.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-200" />
              <div className="ml-4">
                <p className="text-green-100 text-sm font-medium">Categorías</p>
                <p className="text-2xl font-bold">
                  {new Set(ventasCategoria.map(item => item.tipo_producto_servicio)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-200" />
              <div className="ml-4">
                <p className="text-purple-100 text-sm font-medium">Margen Promedio</p>
                <p className="text-2xl font-bold">
                  {ventasCategoria.length > 0 
                    ? (ventasCategoria.reduce((sum, item) => sum + item.porcentaje_margen, 0) / ventasCategoria.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-200" />
              <div className="ml-4">
                <p className="text-orange-100 text-sm font-medium">Unidades Totales</p>
                <p className="text-2xl font-bold">
                  {ventasCategoria.reduce((sum, item) => sum + item.total_unidades, 0).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparación de Costos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <ComparacionCostosTable />
        </div>
      </div>
    </div>
  );
} 