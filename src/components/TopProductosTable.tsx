import React from 'react';
import { Download } from 'lucide-react';
import { TopProductos } from '@/lib/queries';
import * as XLSX from 'xlsx';

interface TopProductosTableProps {
  data: TopProductos[];
}

export default function TopProductosTable({ data }: TopProductosTableProps) {
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

  const exportToExcel = () => {
    // Preparar datos para la exportación
    const exportData = data.map((item, index) => ({
      'Ranking': `#${index + 1}`,
      'SKU': item.sku,
      'Producto/Servicio': item.producto_servicio,
      'Ventas Totales': formatCurrency(item.total_ventas),
      'Unidades Vendidas': item.total_unidades
    }));

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Top Productos');

    // Descargar archivo
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    XLSX.writeFile(wb, `Top_Productos_${fecha}.xlsx`);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div>
      {/* Control de exportar */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={exportToExcel}
          className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar Excel
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto/Servicio
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Ventas Totales
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Unidades
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((producto, index) => (
              <tr key={producto.sku} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-xs">
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {producto.sku}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="break-words" title={producto.producto_servicio}>
                    {producto.producto_servicio}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {formatCurrency(producto.total_ventas)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatNumber(producto.total_unidades)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 