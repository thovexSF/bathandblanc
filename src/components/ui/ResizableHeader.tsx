import React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableHeaderProps {
  columnKey: string;
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  isResizing?: boolean;
  onStartResize: (columnKey: string, event: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizableHeader: React.FC<ResizableHeaderProps> = ({
  columnKey,
  children,
  width,
  minWidth = 80,
  maxWidth = 400,
  isResizing = false,
  onStartResize,
  className = '',
  style = {}
}) => {
  const handleMouseDown = (event: React.MouseEvent) => {
    onStartResize(columnKey, event);
  };

  return (
    <th
      className={`relative select-none ${className}`}
      style={{
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
        ...style
      }}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {/* Resize Handle */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3 text-gray-500" />
          </div>
        </div>
      </div>
    </th>
  );
};

export default ResizableHeader; 