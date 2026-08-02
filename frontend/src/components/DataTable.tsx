import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import Pagination from './Pagination';

interface DataTableProps {
  title: string;
  icon: LucideIcon;
  total: number;
  headers: string[];
  children: ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
  pagination: {
    page: number;
    totalPages: number;
  };
  onPrev: () => void;
  onNext: () => void;
  delay?: number;
}

export default function DataTable({
  title,
  icon: Icon,
  total,
  headers,
  children,
  isEmpty,
  emptyMessage,
  pagination,
  onPrev,
  onNext,
  delay = 0,
}: DataTableProps) {
  return (
    <div
      className="card animate-fade-in"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Icon size={16} className="text-gray-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
          {total} total
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {isEmpty ? (
          <p className="text-sm text-gray-400 py-8 text-center">{emptyMessage}</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6">
              <div className="px-6 min-w-full inline-block align-middle">
                <table className="data-table">
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{children}</tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPrev={onPrev}
              onNext={onNext}
            />
          </>
        )}
      </div>
    </div>
  );
}
