import { useState, useRef, useCallback } from 'react';

interface ColumnConfig {
  key: string;
  width: number;
  minWidth: number;
  maxWidth: number;
}

export interface ResizableColumn {
  key: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
}

export const useResizableColumns = (initialColumns: ResizableColumn[]) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(
    initialColumns.map(col => ({
      key: col.key,
      width: col.width,
      minWidth: col.minWidth || 80,
      maxWidth: col.maxWidth || 400
    }))
  );

  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const startResize = useCallback((columnKey: string, event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    startX.current = event.clientX;
    
    const column = columns.find(col => col.key === columnKey);
    if (column) {
      startWidth.current = column.width;
    }
  }, [columns]);

  const resize = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;

    const deltaX = event.clientX - startX.current;
    const newWidth = Math.max(
      Math.min(
        startWidth.current + deltaX,
        columns.find(col => col.key === resizingColumn)?.maxWidth || 400
      ),
      columns.find(col => col.key === resizingColumn)?.minWidth || 80
    );

    setColumns(prev => 
      prev.map(col => 
        col.key === resizingColumn 
          ? { ...col, width: newWidth }
          : col
      )
    );
  }, [isResizing, resizingColumn, columns]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, []);

  // Agregar event listeners globales para mouse events
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isResizing) {
      resize(event);
    }
  }, [isResizing, resize]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      stopResize();
    }
  }, [isResizing, stopResize]);

  // Función para obtener el ancho de una columna
  const getColumnWidth = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    return column ? column.width : 120;
  }, [columns]);

  // Función para obtener el estilo de una columna
  const getColumnStyle = useCallback((columnKey: string) => {
    return {
      width: `${getColumnWidth(columnKey)}px`,
      minWidth: `${getColumnWidth(columnKey)}px`,
      maxWidth: `${getColumnWidth(columnKey)}px`
    };
  }, [getColumnWidth]);

  // Memorizar resetColumns para que no cambie en cada render
  const resetColumns = useCallback(() => {
    setColumns(
      initialColumns.map(col => ({
        key: col.key,
        width: col.width,
        minWidth: col.minWidth || 80,
        maxWidth: col.maxWidth || 400
      }))
    );
  }, [initialColumns]);

  return {
    columns,
    isResizing,
    resizingColumn,
    startResize,
    getColumnWidth,
    getColumnStyle,
    resetColumns,
    handleMouseMove,
    handleMouseUp
  };
}; 